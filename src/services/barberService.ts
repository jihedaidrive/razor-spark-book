import { Service } from '../types';
import axiosClient from '../api/axiosClient';

export const barberService = {
  // List of available barbers (hardcoded as per backend)
  BARBERS: ['John', 'Mike', 'Alex'],

  // Get all barbers
  async getBarbers(): Promise<{ id: string; name: string; isActive: boolean }[]> {
    // Convert backend's barber list to frontend format
    return this.BARBERS.map(name => ({
      id: name.toLowerCase(),
      name,
      isActive: true
    }));
  },

  // Get a specific barber by ID
  async getBarberById(id: string): Promise<{ id: string; name: string; isActive: boolean } | null> {
    const barber = this.BARBERS.find(name => name.toLowerCase() === id.toLowerCase());
    return barber ? {
      id: barber.toLowerCase(),
      name: barber,
      isActive: true
    } : null;
  }
};
