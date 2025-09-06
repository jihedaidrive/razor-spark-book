import axios from 'axios';
import { authApi } from './authApi';
import { sanitizeHtml } from '@/utils/security';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Validate API URL to prevent SSRF attacks
const isValidApiUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // Block private IP ranges in production
    if (import.meta.env.PROD) {
      const hostname = urlObj.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

if (!isValidApiUrl(BASE_URL)) {
  throw new Error('Invalid API URL configuration');
}

// Remove debug logging in production
if (import.meta.env.DEV) {
  console.log('API Base URL:', BASE_URL);
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout for better UX
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Explicitly set for security
});

// Request interceptor to add access token and security headers
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      // Validate token format (basic JWT structure check)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Invalid token format, remove it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    
    // Note: Security headers like X-Content-Type-Options should be set by the server
    // not in API requests as they cause CORS issues
    
    // Sanitize request data to prevent injection attacks
    if (config.data && typeof config.data === 'object') {
      const originalData = JSON.parse(JSON.stringify(config.data)); // Deep copy for logging
      config.data = sanitizeRequestData(config.data);
      
      // Debug logging in development
      if (import.meta.env.DEV && config.url?.includes('reservations')) {
        console.log('API Request Debug:', {
          url: config.url,
          method: config.method,
          originalData: originalData,
          sanitizedData: config.data
        });
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to sanitize request data
const sanitizeRequestData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  // Fields that should NOT be sanitized (preserve exact values)
  const preserveFields = [
    'date', 'startTime', 'endTime', 'serviceId', 'serviceIds', 
    'barberName', 'id', '_id', 'status', 'role', 'password',
    'name', 'duration', 'price', 'isActive' // Service fields
  ];
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Only sanitize specific user input fields, preserve system fields
      if (preserveFields.includes(key)) {
        sanitized[key] = value; // Preserve as-is
      } else if (key === 'notes' || key === 'description') {
        sanitized[key] = sanitizeHtml(value).substring(0, 1000);
      } else if (key === 'name' || key === 'clientName') {
        sanitized[key] = value.replace(/[<>\"'&]/g, '').trim().substring(0, 100);
      } else if (key === 'phone' || key === 'clientPhone') {
        sanitized[key] = value.replace(/[^\d+\-\s()]/g, '').trim();
      } else {
        // For other string fields, only remove dangerous characters
        sanitized[key] = value.replace(/[<>]/g, '');
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Response interceptor to handle token expiration and auto-refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    // Sanitize response data to prevent XSS
    if (response.data && typeof response.data === 'object') {
      response.data = sanitizeResponseData(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Enhanced error handling with security considerations
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authApi.refreshToken();
        
        // Validate new token format
        if (newToken && typeof newToken === 'string' && newToken.split('.').length === 3) {
          localStorage.setItem('accessToken', newToken);
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return axiosClient(originalRequest);
        } else {
          throw new Error('Invalid token received');
        }
      } catch (err) {
        processQueue(err, null);
        // Secure cleanup
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Prevent open redirect attacks
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Rate limiting detection
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to sanitize response data
const sanitizeResponseData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Sanitize string values that might be displayed in UI
      if (key === 'name' || key === 'clientName' || key === 'barberName') {
        sanitized[key] = sanitizeHtml(value);
      } else if (key === 'notes' || key === 'description') {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponseData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export default axiosClient;
