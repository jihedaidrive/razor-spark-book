import axiosClient from './axiosClient';
import { User } from '@/types';

// -------------------------
// DTOs
// -------------------------
export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role?: string; // optional, backend handles default
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    phone?: string;
    role?: string; // 'user' | 'admin'
    createdAt?: string;
  };
}

// -------------------------
// Helper to map backend user to frontend User type
// -------------------------
const mapUser = (backendUser: AuthResponse['user']): User => {
  if (!backendUser) {
    throw new Error('Backend user data is missing');
  }

  return {
    id: backendUser._id || backendUser.id || '',
    name: backendUser.name || '',
    phone: backendUser.phone || '',
    role: backendUser.role === 'user' ? 'user' : 'admin',
    createdAt: new Date(backendUser.createdAt || Date.now()),
  };
};

// -------------------------
// API
// -------------------------
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('authApi: Making login request with:', credentials);
    const response = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    
    console.log('authApi: Login response received:', {
      status: response.status,
      data: response.data,
      hasAccessToken: !!response.data?.access_token,
      hasRefreshToken: !!response.data?.refresh_token,
      hasUser: !!response.data?.user,
      userData: response.data?.user
    });
    
    // Don't store anything here - let AuthContext handle storage
    // This prevents conflicts and ensures consistent storage logic
    
    return response.data; // return full response including tokens
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register', data);

    console.log('Raw registration response:', response.data);

    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response from registration endpoint');
    }

    // Handle different possible response formats
    let authResponse: AuthResponse;

    if (response.data.user) {
      // Standard format with user object
      authResponse = response.data as AuthResponse;
    } else if (response.data._id || response.data.id) {
      // Backend returned user data directly (no nested user object)
      authResponse = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        user: response.data
      };
    } else {
      // Registration might only return success message, no user data
      console.log('Registration successful but no user data returned');
      return { user: undefined };
    }

    // Don't store anything here - let AuthContext handle all storage
    // This prevents conflicts and ensures consistent storage logic
    
    return authResponse;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get<AuthResponse['user']>('/auth/me');
    return mapUser(response.data as AuthResponse['user']);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.patch<AuthResponse>(`/users/${id}`, data);
    return mapUser(response.data.user);
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token stored');

    const response = await axiosClient.post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken });
    localStorage.setItem('accessToken', response.data.access_token);
    return response.data.access_token;
  },

  deleteUser: async (id: string): Promise<void> => {
    await axiosClient.delete(`/users/${id}`);
  },
};
