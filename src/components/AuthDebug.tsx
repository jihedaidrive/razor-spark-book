import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Check localStorage directly
  const storedUser = localStorage.getItem('user');
  const storedAccessToken = localStorage.getItem('accessToken');
  const storedRefreshToken = localStorage.getItem('refreshToken');

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>User in Context: {user ? 'Yes' : 'No'}</div>
        {user && (
          <div className="ml-2">
            <div>ID: {user.id}</div>
            <div>Name: {user.name}</div>
            <div>Phone: {user.phone}</div>
            <div>Role: {user.role}</div>
          </div>
        )}
        <div>Stored User: {storedUser ? 'Yes' : 'No'}</div>
        <div>Access Token: {storedAccessToken ? 'Yes' : 'No'}</div>
        <div>Refresh Token: {storedRefreshToken ? 'Yes' : 'No'}</div>
        {storedUser && (
          <div className="mt-2 text-xs">
            <div>Raw stored user:</div>
            <div className="bg-gray-800 p-1 rounded text-xs overflow-hidden">
              {storedUser.substring(0, 100)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;