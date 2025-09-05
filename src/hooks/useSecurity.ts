import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SECURITY_CONFIG } from '@/config/security';

/**
 * Security hook for monitoring and protecting the application
 */
export const useSecurity = () => {
  const { user, logout } = useAuth();

  // Session timeout monitoring
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    let warningId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);

      // Warn user 5 minutes before session expires
      warningId = setTimeout(() => {
        const shouldExtend = window.confirm(
          'Your session will expire in 5 minutes. Would you like to extend it?'
        );
        if (!shouldExtend) {
          logout();
        }
      }, SECURITY_CONFIG.SESSION.TIMEOUT - 5 * 60 * 1000);

      // Auto logout after session timeout
      timeoutId = setTimeout(() => {
        logout();
        alert('Your session has expired. Please log in again.');
      }, SECURITY_CONFIG.SESSION.TIMEOUT);
    };

    // Reset timeout on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimeoutHandler = () => resetTimeout();

    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(warningId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
    };
  }, [user, logout]);

  // Detect suspicious activity
  const detectSuspiciousActivity = useCallback(() => {
    // Check for multiple failed login attempts
    const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0');
    if (failedAttempts > 5) {
      console.warn('Multiple failed login attempts detected');
      // Could implement additional security measures here
    }

    // Check for unusual navigation patterns
    const navigationCount = parseInt(sessionStorage.getItem('navigationCount') || '0');
    sessionStorage.setItem('navigationCount', (navigationCount + 1).toString());
    
    if (navigationCount > 100) {
      console.warn('Unusual navigation pattern detected');
    }
  }, []);

  // Monitor for XSS attempts
  const monitorXSS = useCallback(() => {
    // Check for script injection in URL
    const url = window.location.href;
    if (/<script|javascript:|data:/i.test(url)) {
      console.error('Potential XSS attempt detected in URL');
      window.location.href = '/';
    }

    // Monitor for DOM manipulation attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' || element.innerHTML?.includes('<script')) {
                console.error('Potential XSS attempt detected');
                element.remove();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Initialize security monitoring
  useEffect(() => {
    detectSuspiciousActivity();
    const cleanup = monitorXSS();

    // Check for developer tools (basic detection)
    const devtools = {
      open: false,
      orientation: null as string | null,
    };

    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          console.warn('Developer tools detected');
          // In production, you might want to implement additional security measures
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    return cleanup;
  }, [detectSuspiciousActivity, monitorXSS]);

  // Secure clipboard operations
  const secureClipboard = {
    copy: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Clipboard operation failed:', error);
        return false;
      }
    },
    
    paste: async () => {
      try {
        const text = await navigator.clipboard.readText();
        // Sanitize pasted content
        return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } catch (error) {
        console.error('Clipboard read failed:', error);
        return '';
      }
    },
  };

  return {
    secureClipboard,
    detectSuspiciousActivity,
  };
};