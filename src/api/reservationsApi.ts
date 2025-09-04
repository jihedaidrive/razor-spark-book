// src/services/reservationsApi.ts
import axios from 'axios';
import axiosClient from './axiosClient';

// DTOs for frontend requests
export interface CreateReservationData {
  clientName: string;
  clientPhone?: string;
  barberName: string;
  date: string;           // e.g., "2025-08-26"
  startTime: string;      // "HH:MM"
  serviceId?: string;     // single service
  serviceIds?: string[];  // multiple services
  notes?: string;
}

export interface UpdateReservationData {
  clientName?: string;
  clientPhone?: string;
  barberName?: string;
  date?: string;
  startTime?: string;
  serviceId?: string;
  serviceIds?: string[];
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

// Service object returned inside reservation
export interface ReservationServiceDetail {
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone?: string;
}

// UI-specific types
export interface UiBarber {
  id: string;
  name: string;
  phone?: string;
  isActive?: boolean;
}

export interface UiTimeSlot {
  time: string;
  date: string;
  barberId: string;
  isAvailable: boolean;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  clientName?: string;
  clientPhone?: string;
  service?: string;
  reservationId?: string;
}

export type CalendarView = 'week' | 'month' | 'day';

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  barberId: string;
  isAvailable: boolean;
  services: Service[];
}

export interface Reservation {
  _id?: string;  // MongoDB style ID
  id?: string;   // REST API style ID
  clientName: string;
  clientPhone?: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceId?: string;
  serviceIds?: string[];
  services?: ReservationServiceDetail[]; // <-- match backend
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalDuration?: number;
  totalPrice?: number;
}

export const reservationsService = {
  // Fetch all reservations
  getReservations: async (params: { clientId?: string } & Partial<Reservation> = {}) => {
    const response = await axiosClient.get<Reservation[]>('/reservations', { params });
    return response.data;
  },

  // Fetch single reservation by ID
  getReservationById: async (id: string) => {
    const response = await axiosClient.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  // Create reservation
  createReservation: async (data: CreateReservationData) => {
    const response = await axiosClient.post<Reservation>('/reservations/create', data);
    return response.data;
  },

  // Update reservation (full or partial)
  updateReservation: async (id: string, data: UpdateReservationData) => {
    const response = await axiosClient.put<Reservation>(`/reservations/${id}`, data);
    return response.data;
  },

  // Update reservation status only
  updateReservationStatus: async (id: string, status: UpdateReservationData['status']) => {
    if (!id) throw new Error('Reservation ID is required');

    // Clean up the ID by removing any ellipsis or truncation
    const cleanId = id.replace('…', '');
    console.log('Updating reservation status:', { cleanId, status });

    try {
      const response = await axiosClient.put<Reservation>(`/reservations/${cleanId}`, { status });
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        endpoint: `/reservations/${cleanId}`,
        method: 'PUT',
        payload: { status },
        error
      });
      throw error;
    }
  },

  // Delete reservation
  deleteReservation: async (id: string) => {
    const response = await axiosClient.delete<{ message: string }>(`/reservations/${id}`);
    return response.data;
  },
};