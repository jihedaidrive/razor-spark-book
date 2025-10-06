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
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Check if push notifications are supported in the current browser
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      'fetch' in window
    );
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

      console.log('Service Worker registered successfully:', this.serviceWorkerRegistration);

      // Handle service worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
              // Optionally show update notification to user
            }
          });
        }
      });

      // Listen for messages from service worker
      // Listen for messages from service worker (mobile-optimized)
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
        
        if (event.data?.type === 'NAVIGATE' || event.data?.type === 'MOBILE_NAVIGATE') {
          // Handle navigation requests from service worker
          console.log('Navigating to:', event.data.url);
          
          // For mobile, use smooth navigation
          if (event.data.type === 'MOBILE_NAVIGATE') {
            // Add mobile-specific navigation handling
            window.location.href = event.data.url;
            
            // Optional: Add mobile app-like transition
            if ('vibrate' in navigator) {
              navigator.vibrate(100); // Quick feedback vibration
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
   * Get VAPID public key from backend
   */
  async getVapidPublicKey(authToken: string): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/vapid-public-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get VAPID key: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.vapidPublicKey = data.publicKey;

      if (!this.vapidPublicKey) {
        throw new Error('Invalid VAPID public key received');
      }

      return this.vapidPublicKey;
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      throw new Error('Failed to retrieve VAPID public key');
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

      console.log('Push subscription created:', subscription);
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

      console.log('Successfully subscribed to push notifications');

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
        console.log('Unsubscribed from browser push notifications');
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
        console.warn('Failed to remove subscription from backend:', response.status);
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