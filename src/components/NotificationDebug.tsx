// Notification Debug Component
// Temporary component for testing notification system

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testNotificationSystem } from '@/utils/notificationTriggers';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Bug } from 'lucide-react';

const NotificationDebug: React.FC = () => {
  const { user } = useAuth();

  // Only show in development and for admin users
  if (import.meta.env.PROD || !user || user.role !== 'admin') {
    return null;
  }

  const handleTestNotification = async () => {
    try {
      await testNotificationSystem();
      console.log('✅ Debug test completed - check console and notifications');
    } catch (error) {
      console.error('❌ Debug test failed:', error);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Bug className="w-5 h-5" />
          Notification Debug (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-orange-800">
            Test the notification system with a mock reservation booking.
          </p>
          <Button
            onClick={handleTestNotification}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <Bell className="w-4 h-4 mr-2" />
            Test Booking Notification
          </Button>
          <div className="text-xs text-orange-600">
            <strong>Mobile Testing Instructions:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>📱 <strong>On Mobile:</strong> Enable notifications in Dashboard → Notifications</li>
              <li>🧪 <strong>Test:</strong> Click "Test Booking Notification" above</li>
              <li>🔔 <strong>Expected:</strong> Notification appears in phone's notification bar</li>
              <li>👆 <strong>Click:</strong> Notification should open app and navigate here</li>
              <li>📝 <strong>Real Test:</strong> Book reservation from another device</li>
            </ol>
            <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800">
              <strong>📱 Mobile Note:</strong> For mobile testing, use ngrok HTTPS URLs. 
              Notifications work like Instagram - they appear in your phone's notification bar!
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDebug;