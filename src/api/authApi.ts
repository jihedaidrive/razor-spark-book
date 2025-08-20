import axiosClient from './axiosClient';

export interface RegisterData {
  name: string;
  phone: string;
  password: string;
  role?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    createdAt: string;
  };
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get('/users/me');
    return response.data;
  },

  // Update user (admin/superadmin only)
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.patch(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (superadmin only)
  deleteUser: async (id: string): Promise<void> => {
    await axiosClient.delete(`/users/${id}`);
  },
};