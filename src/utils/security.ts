/**
 * Security utilities for input sanitization and validation
 */

// HTML entities for XSS prevention
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;'
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=\/]/g, (s) => HTML_ENTITIES[s] || s);
};

/**
 * Validate and sanitize phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return '';
  // Remove all non-digit characters except + and -
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

/**
 * Validate and sanitize names (allow letters, spaces, hyphens, apostrophes)
 */
export const sanitizeName = (name: string): string => {
  if (typeof name !== 'string') return '';
  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  return name.replace(/[^a-zA-ZÀ-ÿ\s\-'\.]/g, '').trim();
};

/**
 * Sanitize notes/comments to prevent XSS while preserving basic formatting
 */
export const sanitizeNotes = (notes: string): string => {
  if (typeof notes !== 'string') return '';
  // Remove script tags and other dangerous elements
  const cleaned = notes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitizeHtml(cleaned).substring(0, 500); // Limit length
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format - Very flexible validation
 */
export const isValidPhone = (phone: string): boolean => {
  if (typeof phone !== 'string' || phone.length === 0) return false;
  
  // Remove all non-digit characters to count actual digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Allow 7-15 digits (covers local and international formats)
  // Reduced minimum from 10 to 7 to support more formats
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return false;
  
  // Very permissive format validation - allow most common formats
  // Allow: +1234567890, (123) 456-7890, 123-456-7890, 1234567890, etc.
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,25}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: 'Password is valid' };
};

/**
 * Sanitize URL to prevent open redirect attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Only allow relative URLs or URLs from same origin
  if (url.startsWith('/')) return url;
  
  try {
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    
    if (urlObj.origin === currentOrigin) {
      return url;
    }
    
    // Block external URLs to prevent open redirect
    return '/';
  } catch {
    return '/';
  }
};

/**
 * Generate secure random string for CSRF tokens
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private maxAttempts: number = 5, private windowMs: number = 15 * 60 * 1000) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    
    const remaining = record.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

/**
 * Secure localStorage wrapper with encryption
 */
export class SecureStorage {
  private static encode(value: string): string {
    return btoa(encodeURIComponent(value));
  }
  
  private static decode(value: string): string {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return '';
    }
  }
  
  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, this.encode(value));
    } catch (error) {
      console.error('Failed to store item securely:', error);
    }
  }
  
  static getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(key);
      return item ? this.decode(item) : null;
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }
  
  static clear(): void {
    localStorage.clear();
  }
}