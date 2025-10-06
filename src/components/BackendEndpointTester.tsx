// Backend Endpoint Tester
// Tests if notification endpoints are available on the backend

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Server, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EndpointTest {
  endpoint: string;
  method: string;
  status: 'pending' | 'success' | 'error' | 'not-tested';
  statusCode?: number;
  error?: string;
  response?: any;
}

const BackendEndpointTester: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<EndpointTest[]>([
    { endpoint: '/notifications/vapid-public-key', method: 'GET', status: 'not-tested' },
    { endpoint: '/notifications/subscribe', method: 'POST', status: 'not-tested' },
    { endpoint: '/notifications/test', method: 'POST', status: 'not-tested' },
    { endpoint: '/notifications/unsubscribe', method: 'DELETE', status: 'not-tested' },
    { endpoint: '/notifications/subscriptions', method: 'GET', status: 'not-tested' }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const runEndpointTests = async () => {
    setIsRunning(true);
    const authToken = localStorage.getItem('accessToken');
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    if (!authToken) {
      console.error('No auth token available for testing');
      return;
    }

    const updatedTests: EndpointTest[] = [];

    for (const test of tests) {
      const updatedTest = { ...test, status: 'pending' as const };
      setTests(prev => prev.map(t => t.endpoint === test.endpoint ? updatedTest : t));

      try {
        console.log(`🧪 Testing ${test.method} ${test.endpoint}...`);

        const response = await fetch(`${apiBaseUrl}${test.endpoint}`, {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          // Add body for POST requests
          ...(test.method === 'POST' && test.endpoint === '/notifications/test' && {
            body: JSON.stringify({
              title: 'Backend Test',
              body: 'Testing backend endpoint availability'
            })
          })
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        updatedTest.status = response.ok ? 'success' : 'error';
        updatedTest.statusCode = response.status;
        updatedTest.response = responseData;

        if (!response.ok) {
          updatedTest.error = `${response.status} ${response.statusText}: ${responseText}`;
        }

        console.log(`${response.ok ? '✅' : '❌'} ${test.method} ${test.endpoint}: ${response.status}`);
        
      } catch (error) {
        console.error(`❌ ${test.method} ${test.endpoint} failed:`, error);
        updatedTest.status = 'error';
        updatedTest.error = error instanceof Error ? error.message : 'Network error';
      }

      updatedTests.push(updatedTest);
      setTests(prev => prev.map(t => t.endpoint === test.endpoint ? updatedTest : t));
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    console.log('🧪 Backend endpoint testing complete');
  };

  const getStatusIcon = (status: EndpointTest['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (test: EndpointTest) => {
    switch (test.status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">{test.statusCode}</Badge>;
      case 'error':
        return <Badge variant="destructive">{test.statusCode || 'Error'}</Badge>;
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Server className="w-5 h-5" />
          Backend Endpoint Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>VAPID Key Error Fix:</strong> This tool tests if your backend notification endpoints are working.
            The "Failed to retrieve VAPID public key" error means the backend endpoint is not responding correctly.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center">
          <div>
            <div className="font-medium text-sm">API Base URL:</div>
            <div className="text-xs text-muted-foreground font-mono">
              {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
            </div>
          </div>
          <Button
            onClick={runEndpointTests}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Server className="w-4 h-4 mr-2" />
            )}
            Test Endpoints
          </Button>
        </div>

        {/* Endpoint Test Results */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Notification Endpoints:</h4>
          {tests.map((test) => (
            <div key={test.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium text-sm">
                    <span className="text-blue-600">{test.method}</span> {test.endpoint}
                  </div>
                  {test.error && (
                    <div className="text-xs text-red-600 mt-1">{test.error}</div>
                  )}
                  {test.status === 'success' && test.response && (
                    <div className="text-xs text-green-600 mt-1">
                      Response: {typeof test.response === 'object' ? JSON.stringify(test.response).substring(0, 100) + '...' : test.response}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(test)}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-sm mb-2">How to Fix VAPID Key Error:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>1. Check Backend:</strong> Ensure your NestJS backend has notification endpoints</div>
            <div><strong>2. VAPID Keys:</strong> Backend needs VAPID public/private key pair configured</div>
            <div><strong>3. CORS:</strong> Backend must allow requests from your frontend domain</div>
            <div><strong>4. Authentication:</strong> Ensure JWT token is valid and user is admin</div>
          </div>
        </div>

        {/* Quick Backend Check */}
        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <h4 className="font-medium text-sm text-yellow-900 mb-2">Backend Status Check:</h4>
          <div className="text-xs text-yellow-800">
            <div>• <strong>Expected:</strong> GET /notifications/vapid-public-key should return {"{"}"publicKey": "your-vapid-public-key"{"}"}</div>
            <div>• <strong>Required:</strong> Backend must have VAPID keys configured</div>
            <div>• <strong>Auth:</strong> Endpoint requires admin JWT token</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendEndpointTester;