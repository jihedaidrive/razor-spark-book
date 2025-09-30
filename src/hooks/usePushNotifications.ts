// React Hook for Push Notifications
// Provides state management and methods for push notification functionality

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pushNotificationManager, NotificationPermissionState } from '@/utils/pushNotificationManager';
import { toast } from '@/hooks/use-toast';

export interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptions: any[];
  
  // Actions
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  checkPermissionState: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    supported: false,
    permission: 'default',
    subscribed: false,
    subscription: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  const authToken = localStorage.getItem('accessToken');

  /**
   * Check current permission state
   */
  const checkPermissionState = useCallback(async () => {
    try {
      setError(null);
      const state = await pushNotificationManager.getPermissionState();
      setPermissionState(state);
      
      // If service worker is not registered but supported, initialize it
      if (state.supported && !state.subscription) {
        await pushNotificationManager.initializeServiceWorker();
        // Re-check state after initialization
        const updatedState = await pushNotificationManager.getPermissionState();
        setPermissionState(updatedState);
      }
    } catch (err) {
      console.error('Error checking permission state:', err);
      setError(err instanceof Error ? err.message : 'Failed to check notification state');
    }
  }, []);

  /**
   * Load user's subscriptions
   */
  const refreshSubscriptions = useCallback(async () => {
    if (!isAdmin || !authToken) {
      return;
    }

    try {
      setError(null);
      const userSubscriptions = await pushNotificationManager.getSubscriptions(authToken);
      setSubscriptions(userSubscriptions);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    }
  }, [isAdmin, authToken]);

  /**
   * Enable push notifications
   */
  const enableNotifications = useCallback(async () => {
    if (!isAdmin || !authToken) {
      setError('Only admin users can enable notifications');
      return;
    }

    if (!permissionState.supported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationManager.subscribe(authToken);
      
      // Refresh state and subscriptions
      await checkPermissionState();
      await refreshSubscriptions();
      
      toast({
        title: 'Success',
        description: 'Push notifications have been enabled successfully.',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error enabling notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, authToken, permissionState.supported, checkPermissionState, refreshSubscriptions]);

  /**
   * Disable push notifications
   */
  const disableNotifications = useCallback(async () => {
    if (!isAdmin || !authToken) {
      setError('Only admin users can disable notifications');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationManager.unsubscribe(authToken);
      
      // Refresh state and subscriptions
      await checkPermissionState();
      await refreshSubscriptions();
      
      toast({
        title: 'Success',
        description: 'Push notifications have been disabled.',
        variant: 'default'
      });
    } catch (err) {
      console.error('Error disabling notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable notifications';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, authToken, checkPermissionState, refreshSubscriptions]);

  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async () => {
    if (!isAdmin || !authToken) {
      setError('Only admin users can send test notifications');
      return;
    }

    if (!permissionState.subscribed) {
      setError('You must be subscribed to notifications to send a test');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationManager.sendTestNotification(authToken);
    } catch (err) {
      console.error('Error sending test notification:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, authToken, permissionState.subscribed]);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (isAdmin) {
      checkPermissionState();
      refreshSubscriptions();
    }
  }, [isAdmin, checkPermissionState, refreshSubscriptions]);

  // Listen for permission changes
  useEffect(() => {
    if (!permissionState.supported) return;

    const handlePermissionChange = () => {
      checkPermissionState();
    };

    // Listen for permission changes (if supported)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', handlePermissionChange);
          return () => {
            permissionStatus.removeEventListener('change', handlePermissionChange);
          };
        })
        .catch(() => {
          // Permissions API not supported, ignore
        });
    }

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, [permissionState.supported, checkPermissionState]);

  // Listen for service worker messages
  useEffect(() => {
    if (!permissionState.supported) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_RECEIVED') {
        // Handle notification received event
        console.log('Notification received:', event.data);
        // Optionally refresh data or update UI
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [permissionState.supported]);

  return {
    // State
    isSupported: permissionState.supported,
    permission: permissionState.permission,
    isSubscribed: permissionState.subscribed,
    isLoading,
    error,
    subscriptions,
    
    // Actions
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    refreshSubscriptions,
    checkPermissionState
  };
};

export default usePushNotifications;