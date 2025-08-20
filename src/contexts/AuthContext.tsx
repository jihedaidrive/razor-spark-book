import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/authApi';
import { authApi, RegisterData, LoginCredentials } from '@/api/authApi';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export { AuthContext };

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Session check failed:', error);
          // Clear invalid token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ phone, password });
      
      // Store token and user data
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.user.name || response.user.phone}`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || error.message || "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (phone: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ name, phone, password });
      
      // Store token and user data
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      toast({
        title: "Account created!",
        description: `Welcome, ${response.user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || error.message || "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};