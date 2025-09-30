// Notification Permission Component
// Handles notification permission requests and status display

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, AlertTriangle, CheckCircle, XCircle, Info, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPermissionProps {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  onEnable: () => Promise<void>;
  onDisable: () => Promise<void>;
  className?: string;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  isSupported,
  permission,
  isSubscribed,
  isLoading,
  error,
  onEnable,
  onDisable,
  className
}) => {
  // Get permission status info
  const getPermissionInfo = () => {
    if (!isSupported) {
      return {
        status: 'unsupported',
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.'
      };
    }

    if (permission === 'denied') {
      return {
        status: 'denied',
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        title: 'Permission Denied',
        description: 'Notification permission has been denied. Please enable notifications in your browser settings.'
      };
    }

    if (permission === 'granted' && isSubscribed) {
      return {
        status: 'active',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Notifications Active',
        description: 'You will receive push notifications for new reservations and updates.'
      };
    }

    if (permission === 'granted' && !isSubscribed) {
      return {
        status: 'granted',
        icon: Bell,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        title: 'Permission Granted',
        description: 'Click "Enable Notifications" to start receiving push notifications.'
      };
    }

    return {
      status: 'default',
      icon: BellOff,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      title: 'Notifications Disabled',
      description: 'Enable push notifications to receive real-time updates about reservations.'
    };
  };

  const permissionInfo = getPermissionInfo();
  const StatusIcon = permissionInfo.icon;

  // Browser compatibility info
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const renderActionButton = () => {
    if (!isSupported) {
      return (
        <Button disabled variant="outline" className="w-full">
          <XCircle className="w-4 h-4 mr-2" />
          Not Supported
        </Button>
      );
    }

    if (permission === 'denied') {
      return (
        <Button disabled variant="outline" className="w-full">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Permission Denied
        </Button>
      );
    }

    if (isSubscribed) {
      return (
        <Button
          onClick={onDisable}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Disabling...
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Disable Notifications
            </>
          )}
        </Button>
      );
    }

    return (
      <Button
        onClick={onEnable}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Enabling...
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </>
        )}
      </Button>
    );
  };

  return (
    <Card className={cn('mobile-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <Badge
            variant={permissionInfo.status === 'active' ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              permissionInfo.status === 'active' && 'bg-green-100 text-green-800',
              permissionInfo.status === 'denied' && 'bg-red-100 text-red-800',
              permissionInfo.status === 'unsupported' && 'bg-gray-100 text-gray-800'
            )}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {permissionInfo.title}
          </Badge>
        </div>
        <CardDescription>
          Receive real-time notifications for new reservations and status updates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Alert */}
        <Alert className={cn('border-l-4', permissionInfo.bgColor)}>
          <StatusIcon className={cn('h-4 w-4', permissionInfo.color)} />
          <AlertDescription className="ml-2">
            <strong>{permissionInfo.title}:</strong> {permissionInfo.description}
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="space-y-3">
          {renderActionButton()}
          
          {/* Browser Instructions */}
          {permission === 'denied' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">To enable notifications in {getBrowserInfo()}:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Click the lock icon in the address bar</li>
                <li>Set "Notifications" to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ul>
            </div>
          )}
        </div>

        {/* Feature Info */}
        {isSupported && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">You'll receive notifications for:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>New reservation requests</li>
                  <li>Reservation status changes</li>
                  <li>Cancellations and updates</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Device Info */}
        {isSubscribed && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              <span>Notifications enabled on this device ({getBrowserInfo()})</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPermission;