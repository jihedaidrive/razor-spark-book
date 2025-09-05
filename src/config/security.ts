/**
 * Security configuration and constants
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    LOGIN: parseInt(import.meta.env.VITE_RATE_LIMIT_LOGIN || '5'),
    REGISTER: parseInt(import.meta.env.VITE_RATE_LIMIT_REGISTER || '3'),
    API_CALLS: 100, // per minute
  },
  
  // Session management
  SESSION: {
    TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour default
    REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh token 5 minutes before expiry
  },
  
  // Input validation
  VALIDATION: {
    MAX_NAME_LENGTH: 100,
    MAX_PHONE_LENGTH: 20,
    MAX_NOTES_LENGTH: 500,
    MIN_PASSWORD_LENGTH: 8,
    MAX_SERVICES_PER_BOOKING: 5,
  },
  
  // Content Security Policy
  CSP: {
    ALLOWED_ORIGINS: import.meta.env.PROD 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
  },
  
  // Security headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
} as const;

// Allowed file types for uploads (if implemented)
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Blocked user agents (basic bot protection)
export const BLOCKED_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
] as const;

// Sensitive data patterns to avoid logging
export const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
] as const;