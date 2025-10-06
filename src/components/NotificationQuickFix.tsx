// Quick Fix Component for Notification Support Issues
// Temporary component to bypass support detection issues

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, TestTube, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NotificationQuickFix: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const runQuickTests = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic API availability
      results.push(`✅ Service Worker: ${'serviceWorker' in navigator}`);
      results.push(`✅ Push Manager: ${'PushManager' in window}`);
      results.push(`✅ Notifications: ${'Notification' in window}`);
      results.push(`✅ Fetch API: ${'fetch' in window}`);
      results.push(`✅ HTTPS: ${location.protocol === 'https:'}`);
      results.push(`✅ Location: ${location.href}`);
      
      // Test 2: Notification permission
      results.push(`✅ Permission: ${Notification.permission}`);
      
      // Test 3: Service Worker registration
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          results.push(`✅ SW Registrations: ${registrations.length}`);
          
          if (registrations.length > 0) {
            const reg = registrations[0];
            results.push(`✅ SW State: ${reg.active?.state || 'unknown'}`);
            results.push(`✅ SW Scope: ${reg.scope}`);
          }
        } catch (swError) {
          results.push(`❌ SW Error: ${swError}`);
        }
      }
      
      // Test 4: Try to request permission
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          results.push(`✅ Permission Request: ${permission}`);
        } catch (permError) {
          results.push(`❌ Permission Error: ${permError}`);
        }
      }
      
      // Test 5: Try basic notification
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('🧪 Quick Test', {
            body: 'Testing notification system',
            icon: '/Luxury Brand Logo ADIB - Chic Monogram.png'
          });
          results.push(`✅ Test Notification: Created successfully`);
          
          setTimeout(() => notification.close(), 3000);
        } catch (notifError) {
          results.push(`❌ Notification Error: ${notifError}`);
        }
      }
      
    } catch (error) {
      results.push(`❌ Test Error: ${error}`);
    }
    
    setTestResults(results);
  };

  const forceEnableNotifications = async () => {
    try {
      // Force request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Try to register service worker manually
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Force registration successful:', registration);
          
          // Test notification
          new Notification('🎉 Force Enable Success!', {
            body: 'Notifications have been force-enabled. Try booking a reservation to test.',
            icon: '/Luxury Brand Logo ADIB - Chic Monogram.png'
          });
          
          setTestResults([...testResults, '✅ Force enable successful!']);
        }
      } else {
        setTestResults([...testResults, `❌ Permission denied: ${permission}`]);
      }
    } catch (error) {
      setTestResults([...testResults, `❌ Force enable failed: ${error}`]);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <Wrench className="w-5 h-5" />
          Notification Quick Fix (Admin Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If you're seeing "not supported" errors, use these tools to diagnose and fix the issue.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={runQuickTests}
            variant="outline"
            size="sm"
            className="border-yellow-300"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Run Diagnostics
          </Button>
          
          <Button
            onClick={forceEnableNotifications}
            variant="outline"
            size="sm"
            className="border-yellow-300"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Force Enable
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-sm mb-2">Test Results:</h4>
            <div className="space-y-1 text-xs font-mono">
              {testResults.map((result, index) => (
                <div key={index} className={result.startsWith('❌') ? 'text-red-600' : 'text-green-600'}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-yellow-700">
          <strong>Common Issues:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Browser in Private/Incognito mode</li>
            <li>HTTP instead of HTTPS (check URL)</li>
            <li>Browser notifications disabled in settings</li>
            <li>Service worker blocked by browser</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationQuickFix;