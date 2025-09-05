import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { authApi } from '@/api/authApi';
import { toast } from '@/hooks/use-toast';
import { sanitizeName, sanitizePhone, isValidPhone, RateLimiter, SecureStorage } from '@/utils/security';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Rate limiters for auth operations
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const registerRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

// Map API user shape → app User shape with sanitization
const mapApiUserToClientUser = (apiUser: any): User => {
  if (!apiUser || typeof apiUser !== 'object') {
    throw new Error('Invalid user data received from API');
  }
  
  return {
    id: String(apiUser.id || apiUser._id || '').trim(),
    name: sanitizeName(String(apiUser.name || '')),
    phone: sanitizePhone(String(apiUser.phone || '')),
    role: ['user', 'admin'].includes(apiUser.role) ? apiUser.role : 'user',
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
  };
};

// Enhanced user validation with security checks
const isValidUser = (user: any): user is User => {
  if (!user || typeof user !== 'object') return false;
  
  const hasValidId = typeof user.id === 'string' && user.id.length > 0 && user.id.length < 100;
  const hasValidName = typeof user.name === 'string' && user.name.length > 0 && user.name.length < 100;
  const hasValidPhone = typeof user.phone === 'string' && isValidPhone(user.phone);
  const hasValidRole = ['user', 'admin'].includes(user.role);
  
  return hasValidId && hasValidName && hasValidPhone && hasValidRole;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------
  // Initialize auth on app load with security validation
  // -------------------------------
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('AuthContext: Starting bootstrap...');
    }

    const storedUser = SecureStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (import.meta.env.DEV) {
      console.log('AuthContext: Stored data check:', {
        hasStoredUser: !!storedUser,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });
    }

    // If no stored user, we're definitely not logged in
    if (!storedUser) {
      if (import.meta.env.DEV) {
        console.log('AuthContext: No stored user found');
      }
      setIsLoading(false);
      return;
    }

    try {
      // Parse and validate the stored user with enhanced security
      const parsedUser = JSON.parse(storedUser);
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: Parsed stored user:', parsedUser);
      }

      // Validate token expiry if available
      if (accessToken) {
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            throw new Error('Token expired');
          }
        } catch (tokenError) {
          if (import.meta.env.DEV) {
            console.warn('AuthContext: Token validation failed:', tokenError);
          }
          throw new Error('Invalid token');
        }
      }

      if (!isValidUser(parsedUser)) {
        throw new Error('Invalid user data structure');
      }

      // Additional security: re-sanitize stored user data
      const sanitizedUser = mapApiUserToClientUser(parsedUser);
      setUser(sanitizedUser);
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: User set successfully');
      }

    } catch (parseError) {
      if (import.meta.env.DEV) {
        console.error('AuthContext: Failed to parse stored user:', parseError);
      }
      // Secure cleanup of potentially corrupted data
      secureLogout();
    }

    setIsLoading(false);
    if (import.meta.env.DEV) {
      console.log('AuthContext: Bootstrap complete');
    }
  }, []);

  // -------------------------------
  // Secure Login with rate limiting and validation
  // -------------------------------
  const login = async (phone: string, password: string) => {
    // Input validation and sanitization
    const sanitizedPhone = sanitizePhone(phone);
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('Login validation:', {
        originalPhone: phone,
        sanitizedPhone: sanitizedPhone,
        isValid: isValidPhone(sanitizedPhone)
      });
    }
    
    if (!isValidPhone(sanitizedPhone)) {
      toast({
        title: 'Invalid Input',
        description: `Please enter a valid phone number (10-15 digits). You entered: "${phone}"`,
        variant: 'destructive',
      });
      throw new Error('Invalid phone number format');
    }

    if (!password || password.length < 6) {
      toast({
        title: 'Invalid Input',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      throw new Error('Invalid password');
    }

    // Rate limiting
    const clientId = `login_${sanitizedPhone}`;
    if (!loginRateLimiter.isAllowed(clientId)) {
      const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(clientId) / 1000 / 60);
      toast({
        title: 'Too Many Attempts',
        description: `Please wait ${remainingTime} minutes before trying again`,
        variant: 'destructive',
      });
      throw new Error('Rate limit exceeded');
    }

    setIsLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log('AuthContext: Starting login for:', sanitizedPhone);
      }

      const response = await authApi.login({ phone: sanitizedPhone, password });
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: Login response received:', {
          hasAccessToken: !!response.access_token,
          hasRefreshToken: !!response.refresh_token,
          hasUser: !!response.user
        });
      }

      const { access_token, refresh_token, user: apiUser } = response;

      // Enhanced validation of response data
      if (!access_token || typeof access_token !== 'string' || access_token.split('.').length !== 3) {
        throw new Error('Invalid access token received');
      }
      
      if (!refresh_token || typeof refresh_token !== 'string') {
        throw new Error('Invalid refresh token received');
      }
      
      if (!apiUser) {
        throw new Error('No user data received');
      }

      // Validate token expiry
      try {
        const tokenPayload = JSON.parse(atob(access_token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          throw new Error('Received expired token');
        }
      } catch (tokenError) {
        throw new Error('Invalid token format received');
      }

      // Store tokens securely
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: Tokens stored successfully');
      }

      // Process and store user data with enhanced validation
      const normalized = mapApiUserToClientUser(apiUser);
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: Normalized user:', normalized);
      }

      if (!isValidUser(normalized)) {
        throw new Error('Invalid user data after normalization');
      }

      setUser(normalized);
      SecureStorage.setItem('user', JSON.stringify(normalized));
      
      if (import.meta.env.DEV) {
        console.log('AuthContext: User data stored successfully');
      }

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${normalized.name}`,
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('AuthContext: Login error:', error);
      }

      // Secure cleanup on failure
      secureLogout();

      const errorMessage = error?.response?.data?.message || error?.message || 'Login failed';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Secure Register with validation and rate limiting
  // -------------------------------
  const register = async (phone: string, password: string, name: string) => {
    // Input validation and sanitization
    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedName = sanitizeName(name);
    
    if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 50) {
      toast({
        title: 'Invalid Input',
        description: 'Name must be between 2 and 50 characters',
        variant: 'destructive',
      });
      throw new Error('Invalid name');
    }

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('Register validation:', {
        originalPhone: phone,
        sanitizedPhone: sanitizedPhone,
        isValid: isValidPhone(sanitizedPhone)
      });
    }

    if (!isValidPhone(sanitizedPhone)) {
      toast({
        title: 'Invalid Input',
        description: `Please enter a valid phone number (10-15 digits). You entered: "${phone}"`,
        variant: 'destructive',
      });
      throw new Error('Invalid phone number format');
    }

    if (!password || password.length < 6) {
      toast({
        title: 'Invalid Input',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      throw new Error('Password too short');
    }

    // Rate limiting
    const clientId = `register_${sanitizedPhone}`;
    if (!registerRateLimiter.isAllowed(clientId)) {
      const remainingTime = Math.ceil(registerRateLimiter.getRemainingTime(clientId) / 1000 / 60);
      toast({
        title: 'Too Many Attempts',
        description: `Please wait ${remainingTime} minutes before trying again`,
        variant: 'destructive',
      });
      throw new Error('Rate limit exceeded');
    }

    setIsLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log('Starting registration for:', { name: sanitizedName, phone: sanitizedPhone });
      }

      const response = await authApi.register({ 
        name: sanitizedName, 
        phone: sanitizedPhone, 
        password 
      });
      
      if (import.meta.env.DEV) {
        console.log('Registration response received');
      }

      // If registration returned user data and tokens, use them
      if (response.user && response.access_token) {
        const normalized = mapApiUserToClientUser(response.user);
        
        if (!isValidUser(normalized)) {
          throw new Error('Invalid user data received after registration');
        }
        
        setUser(normalized);
        SecureStorage.setItem('user', JSON.stringify(normalized));
        localStorage.setItem('accessToken', response.access_token);
        
        if (response.refresh_token) {
          localStorage.setItem('refreshToken', response.refresh_token);
        }

        toast({
          title: 'Account created!',
          description: `Welcome, ${sanitizedName}!`,
        });
      } else {
        // Registration successful but no immediate user data - try to login
        if (import.meta.env.DEV) {
          console.log('Registration successful, attempting login...');
        }
        await login(sanitizedPhone, password);
      }

    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Registration error:', error);
      }

      // Secure cleanup on failure
      secureLogout();

      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Registration failed. Please try again.';

      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Secure Logout
  // -------------------------------
  const logout = () => {
    secureLogout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  // Helper function for secure cleanup
  const secureLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    SecureStorage.removeItem('user');
    setUser(null);
    
    // Clear any sensitive data from memory
    if (typeof window !== 'undefined') {
      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    }
  };

  // Debug function to check auth state
  const debugAuth = () => {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Current user:', user);
    console.log('Is loading:', isLoading);
    console.log('Stored user:', localStorage.getItem('user'));
    console.log('Access token:', localStorage.getItem('accessToken'));
    console.log('Refresh token:', localStorage.getItem('refreshToken'));
    console.log('=====================');
  };

  // Add debug function to window for easy access
  if (typeof window !== 'undefined') {
    (window as any).debugAuth = debugAuth;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
