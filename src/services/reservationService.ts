import { 
  CreateReservationData, 
  UpdateReservationData, 
  Reservation,
  TimeSlot 
} from '../api/reservationsApi';
import axiosClient from '../api/axiosClient';

export const reservationService = {
  // Get all reservations (filtered by user role)
  async getReservations(filters?: Partial<Reservation>): Promise<Reservation[]> {
    const response = await axiosClient.get<Reservation[]>('/reservations', {
      params: filters
    });
    return response.data;
  },

  // Create new reservation
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const response = await axiosClient.post<Reservation>('/reservations/create', data);
    return response.data;
  },

  // Update reservation
  async updateReservation(id: string, data: UpdateReservationData): Promise<Reservation> {
    const response = await axiosClient.put<Reservation>(`/reservations/${id}`, data);
    return response.data;
  },

  // Cancel/delete reservation
  async cancelReservation(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<{ message: string }>(`/reservations/${id}`);
    return response.data;
  },

  // Helper method to get available time slots
  async getAvailableTimeSlots(date: string, barberName?: string): Promise<Reservation[]> {
    const response = await axiosClient.get<Reservation[]>('/reservations', {
      params: {
        date,
        barberName,
        status: ['pending', 'confirmed'] // Only get active reservations to check availability
      }
    });
    return response.data;
  }
};
