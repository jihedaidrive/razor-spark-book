// Browser Support Debug Component
// Helps diagnose push notification support issues in production

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Smartphone, Globe, Shield } from 'lucide-react';

interface BrowserSupportInfo {
  serviceWorker: boolean;
  pushManager: boolean;
  notification: boolean;
  fetch: boolean;
  https: boolean;
  userAgent: string;
  location: string;
  isSupported: boolean;
}

const BrowserSupportDebug: React.FC = () => {
  const [supportInfo, setSupportInfo] = useState<BrowserSupportInfo | null>(null);

  useEffect(() => {
    const checkSupport = () => {
      const info: BrowserSupportInfo = {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notification: 'Notification' in window,
        fetch: 'fetch' in window,
        https: location.protocol === 'https:' || location.hostname === 'localhost',
        userAgent: navigator.userAgent,
        location: location.href,
        isSupported: false
      };

      info.isSupported = info.serviceWorker && 
                        info.pushManager && 
                        info.notification && 
                        info.fetch && 
                        info.https;

      setSupportInfo(info);
      
      // Log for debugging
      console.log('🔍 Browser Support Debug:', info);
    };

    checkSupport();
  }, []);

  if (!supportInfo) {
    return <div>Loading browser support check...</div>;
  }

  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Unknown';
  };

  const getDeviceType = (userAgent: string): string => {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/Mobile/.test(userAgent)) return 'Mobile';
    return 'Desktop';
  };

  const browserName = getBrowserName(supportInfo.userAgent);
  const deviceType = getDeviceType(supportInfo.userAgent);

  const SupportItem: React.FC<{ 
    label: string; 
    supported: boolean; 
    icon: React.ReactNode;
    description: string;
  }> = ({ label, supported, icon, description }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${supported ? 'bg-green-100' : 'bg-red-100'}`}>
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Badge variant={supported ? 'default' : 'destructive'} className="text-xs">
        {supported ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Supported
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Missing
          </>
        )}
      </Badge>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Browser Support Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Browser Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm font-medium">Browser</div>
            <div className="text-xs text-muted-foreground">{browserName}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Device</div>
            <div className="text-xs text-muted-foreground">{deviceType}</div>
          </div>
        </div>

        {/* Overall Status */}
        <Alert variant={supportInfo.isSupported ? 'default' : 'destructive'}>
          {supportInfo.isSupported ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>
              {supportInfo.isSupported 
                ? '✅ Push notifications are supported!' 
                : '❌ Push notifications are NOT supported'
              }
            </strong>
            {!supportInfo.isSupported && (
              <div className="mt-2 text-sm">
                Missing requirements are listed below. This might be due to:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Browser version too old</li>
                  <li>Private/Incognito mode</li>
                  <li>HTTP instead of HTTPS</li>
                  <li>Browser settings blocking notifications</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Detailed Support Check */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Detailed Requirements:</h4>
          
          <SupportItem
            label="Service Worker"
            supported={supportInfo.serviceWorker}
            icon={<Smartphone className="w-4 h-4" />}
            description="Background script support"
          />
          
          <SupportItem
            label="Push Manager"
            supported={supportInfo.pushManager}
            icon={<Globe className="w-4 h-4" />}
            description="Push message handling"
          />
          
          <SupportItem
            label="Notifications API"
            supported={supportInfo.notification}
            icon={<AlertTriangle className="w-4 h-4" />}
            description="Display notifications"
          />
          
          <SupportItem
            label="Fetch API"
            supported={supportInfo.fetch}
            icon={<Globe className="w-4 h-4" />}
            description="Network requests"
          />
          
          <SupportItem
            label="HTTPS/Secure Context"
            supported={supportInfo.https}
            icon={<Shield className="w-4 h-4" />}
            description="Secure connection required"
          />
        </div>

        {/* Browser-Specific Help */}
        {!supportInfo.isSupported && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">
              Troubleshooting for {browserName} on {deviceType}:
            </h4>
            <div className="text-xs text-blue-800 space-y-1">
              {browserName === 'Safari' && deviceType === 'iOS' && (
                <>
                  <div>• Ensure iOS 16.4+ for push notification support</div>
                  <div>• Check Settings → Safari → Advanced → Experimental Features</div>
                  <div>• Try adding to Home Screen (PWA mode)</div>
                </>
              )}
              {browserName === 'Chrome' && (
                <>
                  <div>• Ensure Chrome 50+ version</div>
                  <div>• Check if in Incognito mode (not supported)</div>
                  <div>• Verify site permissions in Settings</div>
                </>
              )}
              {!supportInfo.https && (
                <div>• ⚠️ HTTPS required - ensure using https:// URL</div>
              )}
              <div>• Try refreshing the page</div>
              <div>• Clear browser cache and cookies</div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
          <div className="mt-2 p-3 bg-muted/50 rounded text-xs font-mono">
            <div><strong>User Agent:</strong> {supportInfo.userAgent}</div>
            <div><strong>Location:</strong> {supportInfo.location}</div>
            <div><strong>Protocol:</strong> {location.protocol}</div>
            <div><strong>Hostname:</strong> {location.hostname}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default BrowserSupportDebug;