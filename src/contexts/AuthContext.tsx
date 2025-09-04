import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { authApi } from '@/api/authApi';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Map API user shape → app User shape
const mapApiUserToClientUser = (apiUser: any): User => ({
  id: apiUser.id || apiUser._id,
  name: apiUser.name,
  phone: apiUser.phone,
  role: apiUser.role,
  createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
});

// Validate user data structure
const isValidUser = (user: any): user is User => {
  return user && 
         typeof user.id === 'string' && 
         typeof user.name === 'string' && 
         typeof user.phone === 'string' && 
         (user.role === 'user' || user.role === 'admin');
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------
  // Initialize auth on app load - SIMPLIFIED VERSION
  // -------------------------------
  useEffect(() => {
    console.log('AuthContext: Starting bootstrap...');
    
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    console.log('AuthContext: Stored data check:', {
      hasStoredUser: !!storedUser,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      storedUserContent: storedUser
    });

    // If no stored user, we're definitely not logged in
    if (!storedUser) {
      console.log('AuthContext: No stored user found');
      setIsLoading(false);
      return;
    }

    try {
      // Parse and validate the stored user
      const parsedUser = JSON.parse(storedUser);
      console.log('AuthContext: Parsed stored user:', parsedUser);
      
      if (!isValidUser(parsedUser)) {
        console.error('AuthContext: Invalid user data structure:', parsedUser);
        throw new Error('Invalid user data structure');
      }
      
      // Set user immediately - no async operations
      setUser(parsedUser);
      console.log('AuthContext: User set successfully');
      
    } catch (parseError) {
      console.error('AuthContext: Failed to parse stored user:', parseError);
      // Clear corrupted data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
    
    setIsLoading(false);
    console.log('AuthContext: Bootstrap complete');
  }, []);

  // -------------------------------
  // Login
  // -------------------------------
  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Starting login for:', phone);
      
      const response = await authApi.login({ phone, password });
      console.log('AuthContext: Login response received:', {
        hasAccessToken: !!response.access_token,
        hasRefreshToken: !!response.refresh_token,
        hasUser: !!response.user
      });

      const { access_token, refresh_token, user: apiUser } = response;

      // Validate required data
      if (!access_token || !refresh_token || !apiUser) {
        throw new Error('Incomplete login response from server');
      }

      // Store tokens
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      console.log('AuthContext: Tokens stored successfully');

      // Process and store user data
      const normalized = mapApiUserToClientUser(apiUser);
      console.log('AuthContext: Normalized user:', normalized);
      
      // Validate the normalized user before storing
      if (!isValidUser(normalized)) {
        throw new Error('Invalid user data after normalization');
      }
      
      setUser(normalized);
      const userJson = JSON.stringify(normalized);
      localStorage.setItem('user', userJson);
      console.log('AuthContext: User data stored successfully:', userJson);
      
      // Verify storage worked
      const verifyStored = localStorage.getItem('user');
      console.log('AuthContext: Verification - stored user:', verifyStored);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${normalized.name || normalized.phone}`,
      });
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      
      // Clear any partial data on login failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      
      toast({
        title: 'Login failed',
        description: error?.response?.data?.message || error?.message || 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Register
  // -------------------------------
  const register = async (phone: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      console.log('Starting registration for:', { name, phone });
      
      const response = await authApi.register({ name, phone, password });
      console.log('Registration response:', response);

      // If registration returned user data and tokens, use them
      if (response.user && response.access_token) {
        const normalized = mapApiUserToClientUser(response.user);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        
        toast({
          title: 'Account created!',
          description: `Welcome, ${name}!`,
        });
      } else {
        // Registration successful but no immediate user data - try to login
        console.log('Registration successful, attempting login...');
        await login(phone, password);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error?.response?.data);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Registration failed. Please try again.';
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // Logout
  // -------------------------------
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  // Debug function to check auth state
  const debugAuth = () => {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('Current user:', user);
    console.log('Is loading:', isLoading);
    console.log('Stored user:', localStorage.getItem('user'));
    console.log('Access token:', localStorage.getItem('accessToken'));
    console.log('Refresh token:', localStorage.getItem('refreshToken'));
    console.log('=====================');
  };

  // Add debug function to window for easy access
  if (typeof window !== 'undefined') {
    (window as any).debugAuth = debugAuth;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
