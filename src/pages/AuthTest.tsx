import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AuthTest: React.FC = () => {
  const { user, isLoading, logout } = useAuth();

  const checkLocalStorage = () => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    console.log('=== MANUAL STORAGE CHECK ===');
    console.log('Stored user:', storedUser);
    console.log('Access token:', accessToken);
    console.log('Refresh token:', refreshToken);
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log('Parsed user:', parsed);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
    console.log('============================');
  };

  const forceRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Loading State:</strong> {isLoading ? 'Loading...' : 'Loaded'}
            </div>
            
            <div>
              <strong>User in Context:</strong> {user ? 'Present' : 'Not present'}
            </div>
            
            {user && (
              <div className="bg-muted p-4 rounded">
                <h3 className="font-semibold mb-2">User Data:</h3>
                <div>ID: {user.id}</div>
                <div>Name: {user.name}</div>
                <div>Phone: {user.phone}</div>
                <div>Role: {user.role}</div>
                <div>Created: {user.createdAt?.toString()}</div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button onClick={checkLocalStorage}>Check LocalStorage</Button>
              <Button onClick={forceRefresh} variant="outline">Force Refresh</Button>
              {user && (
                <Button onClick={logout} variant="destructive">Logout</Button>
              )}
            </div>
            
            <div className="bg-muted p-4 rounded">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Login on another tab/page</li>
                <li>Come back to this page</li>
                <li>Check if user data appears</li>
                <li>Click "Force Refresh" to test persistence</li>
                <li>Check browser console for debug logs</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;