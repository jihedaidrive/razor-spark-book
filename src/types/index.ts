// Service type matching the backend Mongoose schema
export interface Service {
  id: string; // MongoDB _id mapped to id
  name: string; // e.g. "Haircut", "Beard Trim"
  duration: number; // in minutes, e.g. 30, 45, 60
  price: number; // service price
  isActive: boolean; // enable/disable service (default: true)
  createdAt?: string; // timestamps from Mongoose
  updatedAt?: string; // timestamps from Mongoose
}

// Barber types
export interface Barber {
  id: string;
  name: string;
}

export interface UiBarber {
  id: string;
  name: string;
  phone?: string;
  isActive?: boolean;
}

// UI types
export interface UiTimeSlot {
  id: string;
  time?: string; // Made optional since code doesn't always provide it
  date: string | Date;
  startTime: string;
  endTime: string;
  barberId: string;
  isAvailable: boolean;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'past';
  clientName?: string;
  clientPhone?: string;
  service?: string;
  services?: Service[];
  reservationId?: string;
}

// TimeSlot for booking modal compatibility
export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  barberId: string;
  isAvailable: boolean;
  services?: Service[];
}

export type CalendarView = 'week' | 'month' | 'day' | 'list';

// User type
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Reservation type
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
  services?: Array<{
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
  }>;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalDuration?: number;
  totalPrice?: number;
}