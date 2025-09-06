import axiosClient from './axiosClient';
import { Service } from '@/types';

// DTO matching backend CreateServiceDto exactly
export interface CreateServiceData {
  name: string;
  duration: number; // in minutes
  price: number;
}

// DTO matching backend UpdateServiceDto
export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  isActive?: boolean;
}

export const servicesApi = {
  // Get all services (admin or client)
  getServices: async (): Promise<Service[]> => {
    try {
      const response = await axiosClient.get<Service[]>('/services');
      return response.data.map(s => ({
        ...s,
        id: (s as Service & { _id?: string })._id || s.id, // map _id to id if backend uses _id
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error('Failed to get services:', err.response?.data || err.message);
      throw error;
    }
  },

  // Get a single service by ID
  getServiceById: async (id: string): Promise<Service> => {
    if (!id) throw new Error('Service ID is required');
    try {
      const response = await axiosClient.get<Service>(`/services/${id}`);
      return { ...response.data, id: (response.data as Service & { _id?: string })._id || response.data.id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(`Failed to get service ${id}:`, err.response?.data || err.message);
      throw error;
    }
  },

  // Create a new service (admin only) - matches backend POST /services/create
  createService: async (data: CreateServiceData): Promise<Service> => {
    // VALIDATION: Ensure required fields and proper data types
    if (!data.name || data.name.trim() === '') {
      throw new Error('Service name is required');
    }
    if (!data.price || data.price <= 0) {
      throw new Error('Service price must be positive');
    }
    if (!data.duration || data.duration <= 0) {
      throw new Error('Service duration must be positive');
    }

    try {
      console.log('Creating service with data:', data);

      // Clean and validate data to match backend DTO exactly
      const cleanData: CreateServiceData = {
        name: data.name.trim(),
        price: Number(data.price),
        duration: Number(data.duration)
      };

      // Validate data types and values
      if (!cleanData.name || cleanData.name.length === 0) {
        throw new Error('Service name is required and cannot be empty');
      }
      if (isNaN(cleanData.duration) || cleanData.duration < 1) {
        throw new Error('Duration must be a positive number (minimum 1 minute)');
      }
      if (isNaN(cleanData.price) || cleanData.price < 0) {
        throw new Error('Price must be a non-negative number (minimum 0)');
      }

      // Send data directly without any wrapper - backend expects exact DTO structure
      const response = await axiosClient.post<Service>('/services/create', {
        name: cleanData.name,
        duration: cleanData.duration,
        price: cleanData.price
      });

      console.log('Service created successfully:', response.data);
      return { ...response.data, id: (response.data as Service & { _id?: string })._id || response.data.id };
    } catch (error: unknown) {
      const err = error as { 
        response?: { data?: unknown; status?: number }; 
        message?: string; 
        config?: { url?: string } 
      };
      console.error('Failed to create service:', {
        data,
        error: err.response?.data || err.message,
        status: err.response?.status,
        url: err.config?.url
      });

      // Provide more specific error messages
      if (err.response?.status === 404) {
        throw new Error('Service creation endpoint not found. Please check your backend configuration.');
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data as { message?: string | string[] };
        if (Array.isArray(errorData?.message)) {
          throw new Error(`Backend validation failed: ${errorData.message.join(', ')}`);
        } else if (typeof errorData?.message === 'string') {
          throw new Error(`Backend validation failed: ${errorData.message}`);
        } else {
          throw new Error('Invalid service data provided. Please check the backend DTO configuration.');
        }
      } else if (err.response?.status === 401) {
        throw new Error('Authentication required to create services');
      } else if (err.response?.status === 403) {
        throw new Error('Admin privileges required to create services');
      }

      throw error;
    }
  },

  // Update an existing service (admin only) - matches backend PUT /services/:id
  updateService: async (id: string, data: UpdateServiceData): Promise<Service> => {
    if (!id) throw new Error('Service ID is required');

    // VALIDATION: Validate update data
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('Service name cannot be empty');
    }
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Service price must be positive');
    }
    if (data.duration !== undefined && data.duration <= 0) {
      throw new Error('Service duration must be positive');
    }

    try {
      console.log('Updating service:', { id, data });

      // Clean and validate data to match backend UpdateServiceDto
      const cleanData: UpdateServiceData = {};
      if (data.name !== undefined) cleanData.name = data.name.trim();
      if (data.price !== undefined) cleanData.price = Number(data.price);
      if (data.duration !== undefined) cleanData.duration = Number(data.duration);
      if (data.isActive !== undefined) cleanData.isActive = data.isActive;

      // Send data directly without any wrapper - backend expects exact DTO structure
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.price !== undefined) updateData.price = Number(data.price);
      if (data.duration !== undefined) updateData.duration = Number(data.duration);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const response = await axiosClient.put<Service>(`/services/${id}`, updateData);

      console.log('Service updated successfully:', response.data);
      return { ...response.data, id: (response.data as Service & { _id?: string })._id || response.data.id };
    } catch (error: unknown) {
      const err = error as { 
        response?: { data?: unknown; status?: number }; 
        message?: string 
      };
      console.error(`Failed to update service ${id}:`, {
        data,
        error: err.response?.data || err.message,
        status: err.response?.status
      });

      // Provide more specific error messages
      if (err.response?.status === 404) {
        throw new Error('Service not found or update endpoint not available');
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data as { message?: string | string[] };
        if (Array.isArray(errorData?.message)) {
          throw new Error(errorData.message.join(', '));
        } else if (typeof errorData?.message === 'string') {
          throw new Error(errorData.message);
        } else {
          throw new Error('Invalid service data provided');
        }
      }

      throw error;
    }
  },

  // Delete a service (admin only)
  deleteService: async (id: string): Promise<void> => {
    if (!id) throw new Error('Service ID is required');
    try {
      console.log('Deleting service:', id);
      await axiosClient.delete(`/services/${id}`);
      console.log('Service deleted successfully');
    } catch (error: unknown) {
      const err = error as { 
        response?: { data?: unknown; status?: number }; 
        message?: string 
      };
      console.error(`Failed to delete service ${id}:`, {
        error: err.response?.data || err.message,
        status: err.response?.status
      });
      throw error;
    }
  },
};
