import { servicesApi } from '@/api/servicesApi';
import { Service } from '@/types';

export const servicesService = {
  getServices: async (): Promise<Service[]> => {
    try {
      return await servicesApi.getServices();
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  getServiceById: async (id: string): Promise<Service> => {
    try {
      return await servicesApi.getServiceById(id);
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }
};
