// Push Notification Manager
// Handles service worker registration, VAPID keys, and push subscriptions

import { toast } from '@/hooks/use-toast';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName: string;
}

export interface NotificationPermissionState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: PushSubscription | null;
}

export interface TestNotificationPayload {
  title: string;
  body: string;
}

class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl();
  }

  /**
   * Get the correct API base URL for different environments
   */
  private getApiBaseUrl(): string {
    // Check environment variables in order of priority
    const envUrl = import.meta.env.VITE_API_URL;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const serverUrl = import.meta.env.VITE_SERVER_URL;

    // Production URL detection
    if (envUrl) return envUrl;
    if (backendUrl) return backendUrl;
    if (serverUrl) return serverUrl;

    // Auto-detect based on current domain for production
    if (import.meta.env.PROD) {
      const currentDomain = window.location.hostname;

      // Common production patterns
      if (currentDomain.includes('vercel.app') || currentDomain.includes('netlify.app')) {
        // For Vercel/Netlify deployments, try common backend patterns
        return `https://barber-backend-4817.onrender.com`; // Your known backend URL
      }

      // Default production backend
      return `https://barber-backend-4817.onrender.com`;
    }

    // Development fallback
    return 'http://localhost:3000';
  }

  /**
   * Check if push notifications are supported in the current browser
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      'fetch' in window &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }

  /**
   * Get current notification permission state
   */
  async getPermissionState(): Promise<NotificationPermissionState> {
    const supported = this.isSupported();

    if (!supported) {
      return {
        supported: false,
        permission: 'denied',
        subscribed: false,
        subscription: null
      };
    }

    const permission = Notification.permission;
    let subscribed = false;
    let subscription: PushSubscription | null = null;

    try {
      if (this.serviceWorkerRegistration) {
        subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        subscribed = !!subscription;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }

    return {
      supported,
      permission,
      subscribed,
      subscription
    };
  }

  /**
   * Initialize service worker registration
   */
  async initializeServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Handle service worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
            }
          });
        }
      });

      // Listen for messages from service worker (mobile-optimized)
      navigator.serviceWorker.addEventListener('message', (event) => {

        if (event.data?.type === 'NAVIGATE' || event.data?.type === 'MOBILE_NAVIGATE') {
          // Handle navigation requests from service worker
          if (event.data.type === 'MOBILE_NAVIGATE') {
            window.location.href = event.data.url;
            // Add mobile app-like transition
            if ('vibrate' in navigator) {
              navigator.vibrate(100);
            }
          } else {
            window.location.href = event.data.url;
          }
        }
      });

      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw new Error('Failed to register service worker');
    }
  }

  /**
   * Get VAPID public key from backend (Production-ready with fallbacks)
   */
  async getVapidPublicKey(authToken: string): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    const endpoint = `${this.apiBaseUrl}/notifications/vapid-public-key`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = '';

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
          } else {
            const errorText = await response.text();
            errorDetails = errorText;
          }
          errorMessage += ` - ${errorDetails}`;
        } catch (parseError) {
          // Ignore parse errors
        }

        if (response.status === 404) {
          throw new Error('VAPID endpoint not found. Backend notification endpoints may not be deployed to production.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please logout and login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Only admin users can access notifications.');
        } else if (response.status === 500) {
          throw new Error('Backend server error. The notification service may not be configured in production.');
        } else if (response.status === 502 || response.status === 503) {
          throw new Error('Backend service unavailable. Please try again in a few minutes.');
        }

        throw new Error(`Failed to get VAPID key: ${errorMessage}`);
      }

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);

        // Temporary debug logging for production troubleshooting
        // This will help us see exactly what the backend is returning
        if (import.meta.env.PROD) {
          console.log('🔍 Production VAPID Response Debug:', {
            responseText: responseText.substring(0, 500),
            parsedData: data,
            dataType: typeof data,
            dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'N/A'
          });
        }
      } catch (parseError) {
        throw new Error('Invalid JSON response from VAPID endpoint');
      }

      // Handle different possible response formats
      let publicKey = null;

      // Try different possible response structures
      if (data.publicKey) {
        publicKey = data.publicKey;
      } else if (data.vapidPublicKey) {
        publicKey = data.vapidPublicKey;
      } else if (data.key) {
        publicKey = data.key;
      } else if (data.data && data.data.publicKey) {
        publicKey = data.data.publicKey;
      } else if (data.result && data.result.publicKey) {
        publicKey = data.result.publicKey;
      } else if (data.vapid && data.vapid.publicKey) {
        publicKey = data.vapid.publicKey;
      } else if (data.keys && data.keys.publicKey) {
        publicKey = data.keys.publicKey;
      } else if (data.notification && data.notification.publicKey) {
        publicKey = data.notification.publicKey;
      } else if (typeof data === 'string') {
        publicKey = data;
      }

      // If publicKey is still an object, try to extract the actual key
      if (publicKey && typeof publicKey === 'object') {
        if (publicKey.key) {
          publicKey = publicKey.key;
        } else if (publicKey.publicKey) {
          publicKey = publicKey.publicKey;
        } else if (publicKey.value) {
          publicKey = publicKey.value;
        } else if (publicKey.data) {
          publicKey = publicKey.data;
        } else if (Array.isArray(publicKey) && publicKey.length > 0) {
          publicKey = publicKey[0];
        }
      }

      if (!publicKey || typeof publicKey !== 'string') {
        // Enhanced error message with response structure for debugging
        const responseStructure = JSON.stringify(data, null, 2);
        throw new Error(`Invalid VAPID public key format. Expected string, got: ${typeof publicKey}. Backend response: ${responseStructure}`);
      }

      // Validate VAPID key format (should be base64url)
      if (publicKey.length < 80 || publicKey.length > 90) {
        throw new Error(`Invalid VAPID key length: ${publicKey.length}. Expected 80-90 characters.`);
      }

      // Test if it's valid base64url
      try {
        this.urlBase64ToUint8Array(publicKey);
      } catch (base64Error) {
        throw new Error('VAPID key is not valid base64url format');
      }

      this.vapidPublicKey = publicKey;
      return this.vapidPublicKey;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot connect to backend at ${this.apiBaseUrl}`);
      }

      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Backend took too long to respond');
      }

      throw error instanceof Error ? error : new Error('Failed to retrieve VAPID public key');
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission has been denied. Please enable notifications in your browser settings.');
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw new Error('Failed to request notification permission');
    }
  }

  /**
   * Create push subscription
   */
  async createSubscription(authToken: string): Promise<PushSubscription> {
    if (!this.serviceWorkerRegistration) {
      await this.initializeServiceWorker();
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    // Request permission first
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Get VAPID public key
    const vapidPublicKey = await this.getVapidPublicKey(authToken);

    try {
      // Create push subscription
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      return subscription;
    } catch (error) {
      console.error('Error creating push subscription:', error);
      throw new Error('Failed to create push subscription');
    }
  }

  /**
   * Subscribe to push notifications on backend
   */
  async subscribe(authToken: string, deviceName?: string): Promise<void> {
    try {
      const subscription = await this.createSubscription(authToken);

      // Prepare subscription data for backend
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        deviceName: deviceName || this.getDeviceName()
      };

      // Send subscription to backend
      const response = await fetch(`${this.apiBaseUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Subscription failed: ${response.status}`);
      }

      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications for new reservations.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */

  async unsubscribe(authToken: string): Promise<void> {
    try {
      // Get current subscription
      const subscription = await this.serviceWorkerRegistration?.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      // Remove subscription from backend
      const response = await fetch(`${this.apiBaseUrl}/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Failed to remove from backend, but continue
      }

      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('Failed to unsubscribe from notifications');
    }
  }

  /**
   * Send test notification (admin only)
   */
  async sendTestNotification(authToken: string, customTitle?: string, customBody?: string): Promise<void> {
    try {
      // Prepare test notification payload with default values
      const testPayload: TestNotificationPayload = {
        title: customTitle || 'ADIB Barber Shop - Test Notification',
        body: customBody || 'This is a test notification to verify push notifications are working correctly. If you received this, your notifications are set up properly!'
      };

      const response = await fetch(`${this.apiBaseUrl}/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Test notification failed: ${response.status}`);
      }

      toast({
        title: 'Test Notification Sent',
        description: 'Check if you received the test notification.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Get user's notification subscriptions
   */
  async getSubscriptions(authToken: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get subscriptions: ${response.status}`);
      }

      const data = await response.json();
      return data.subscriptions || [];
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return [];
    }
  }

  /**
   * Utility: Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Utility: Get device name
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';

    if (userAgent.includes('Mobile')) {
      deviceName = 'Mobile Device';
    } else if (userAgent.includes('Tablet')) {
      deviceName = 'Tablet Device';
    } else {
      deviceName = 'Desktop Device';
    }

    // Add browser info
    if (userAgent.includes('Chrome')) {
      deviceName += ' (Chrome)';
    } else if (userAgent.includes('Firefox')) {
      deviceName += ' (Firefox)';
    } else if (userAgent.includes('Safari')) {
      deviceName += ' (Safari)';
    } else if (userAgent.includes('Edge')) {
      deviceName += ' (Edge)';
    }

    return deviceName;
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();
export default pushNotificationManager;