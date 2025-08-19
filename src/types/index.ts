export interface User {
  id: string;
  phone: string;
  name?: string;
  role: 'client' | 'barber' | 'admin';
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  image?: string;
}

export interface Barber {
  id: string;
  name: string;
  phone: string;
  specialties: string[];
  avatar?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  barberId: string;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  isAvailable: boolean;
}

export interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'available' | 'booked' | 'blocked';
  barberId?: string;
  reservationId?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export type CalendarView = 'week' | 'day' | 'list';