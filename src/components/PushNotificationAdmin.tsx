// Push Notification Admin Component
// Admin dashboard integration for managing push notifications

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Send, 
  Smartphone, 
  Monitor, 
  Tablet, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotificationPermission from './NotificationPermission';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const PushNotificationAdmin: React.FC = () => {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscriptions,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    refreshSubscriptions
  } = usePushNotifications();

  // Only show to admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Get device icon based on device name
  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('mobile')) return Smartphone;
    if (name.includes('tablet')) return Tablet;
    return Monitor;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Notification Control */}
      <NotificationPermission
        isSupported={isSupported}
        permission={permission}
        isSubscribed={isSubscribed}
        isLoading={isLoading}
        error={error}
        onEnable={enableNotifications}
        onDisable={disableNotifications}
      />

      {/* Admin Controls */}
      {isSupported && (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Admin Controls
            </CardTitle>
            <CardDescription>
              Test notifications and manage subscription settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Notification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Test Notification</h4>
                  <p className="text-sm text-muted-foreground">
                    Send a test notification to verify functionality
                  </p>
                </div>
                <Button
                  onClick={sendTestNotification}
                  disabled={!isSubscribed || isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="ml-2">Send Test</span>
                </Button>
              </div>
              
              {!isSubscribed && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You must enable notifications first to send test notifications.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Refresh Subscriptions */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Refresh Status</h4>
                <p className="text-sm text-muted-foreground">
                  Update subscription status and device list
                </p>
              </div>
              <Button
                onClick={refreshSubscriptions}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management */}
      {isSupported && subscriptions.length > 0 && (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Active Subscriptions
              <Badge variant="secondary" className="ml-2">
                {subscriptions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Devices currently subscribed to push notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((subscription, index) => {
                const DeviceIcon = getDeviceIcon(subscription.deviceName || '');
                
                return (
                  <div
                    key={subscription.id || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <DeviceIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {subscription.deviceName || 'Unknown Device'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Subscribed: {formatDate(subscription.createdAt || new Date().toISOString())}
                        </div>
                        {subscription.lastUsed && (
                          <div className="text-xs text-muted-foreground">
                            Last used: {formatDate(subscription.lastUsed)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={subscription.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {subscription.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      
                      {/* Future: Add individual device unsubscribe */}
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button> */}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browser Compatibility Info */}
      {!isSupported && (
        <Card className="mobile-card border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Browser Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported in this browser. 
                Please use a modern browser like Chrome, Firefox, Safari, or Edge.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Supported Browsers:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Chrome 50+</li>
                <li>• Firefox 44+</li>
                <li>• Safari 16+</li>
                <li>• Edge 17+</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Information */}
      <Card className="mobile-card bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-3">
          <div>
            <h4 className="font-medium mb-1">Automatic Notifications:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New reservation created → Instant notification</li>
              <li>Reservation status changed → Real-time update</li>
              <li>Cancellations and modifications → Immediate alert</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Features:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Works even when browser is closed</li>
              <li>Click notifications to view details</li>
              <li>Rich notifications with reservation info</li>
              <li>Multi-device support</li>
            </ul>
          </div>
          
          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs">
              <strong>Privacy:</strong> Notifications are sent securely and only contain 
              necessary reservation information. You can disable them at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationAdmin;