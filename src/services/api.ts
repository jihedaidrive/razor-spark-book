import { User, Service, Barber, TimeSlot, Reservation } from '@/types';
import { 
  mockUsers, 
  mockServices, 
  mockBarbers, 
  mockTimeSlots, 
  mockReservations 
} from '@/lib/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth Service
export const authService = {
  async login(phone: string, password: string): Promise<User> {
    await delay(1000);
    
    const user = mockUsers.find(u => u.phone === phone);
    if (!user) {
      throw new Error('Invalid phone number or password');
    }
    
    // In real implementation, verify password hash
    return user;
  },

  async register(phone: string, password: string, name: string): Promise<User> {
    await delay(1000);
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.phone === phone);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      phone,
      name,
      role: 'client',
      createdAt: new Date(),
    };
    
    mockUsers.push(newUser);
    return newUser;
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(500);
    // In real implementation, verify JWT token
    return mockUsers[0]; // Return first user for demo
  },
};

// Services Service
export const servicesService = {
  async getServices(): Promise<Service[]> {
    await delay(500);
    return mockServices;
  },

  async getServiceById(id: string): Promise<Service | null> {
    await delay(300);
    return mockServices.find(s => s.id === id) || null;
  },
};

// Barbers Service
export const barbersService = {
  async getBarbers(): Promise<Barber[]> {
    await delay(500);
    return mockBarbers.filter(b => b.isActive);
  },

  async getBarberById(id: string): Promise<Barber | null> {
    await delay(300);
    return mockBarbers.find(b => b.id === id) || null;
  },
};

// Time Slots Service
export const timeSlotsService = {
  async getAvailableSlots(date: Date, barberId?: string): Promise<TimeSlot[]> {
    await delay(700);
    
    let slots = mockTimeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.toDateString() === date.toDateString() && slot.isAvailable;
    });
    
    if (barberId) {
      slots = slots.filter(slot => slot.barberId === barberId);
    }
    
    return slots;
  },

  async getSlotsByDateRange(startDate: Date, endDate: Date, barberId?: string): Promise<TimeSlot[]> {
    await delay(700);
    
    let slots = mockTimeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate >= startDate && slotDate <= endDate;
    });
    
    if (barberId) {
      slots = slots.filter(slot => slot.barberId === barberId);
    }
    
    return slots;
  },
};

// Reservations Service
export const reservationsService = {
  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    await delay(1000);
    
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockReservations.push(newReservation);
    
    // Mark the time slot as unavailable
    const slot = mockTimeSlots.find(s => 
      s.barberId === reservation.barberId &&
      s.date.toDateString() === reservation.date.toDateString() &&
      s.startTime === reservation.startTime
    );
    if (slot) {
      slot.isAvailable = false;
    }
    
    return newReservation;
  },

  async getReservations(clientId?: string, barberId?: string): Promise<Reservation[]> {
    await delay(500);
    
    let reservations = [...mockReservations];
    
    if (clientId) {
      reservations = reservations.filter(r => r.clientId === clientId);
    }
    
    if (barberId) {
      reservations = reservations.filter(r => r.barberId === barberId);
    }
    
    return reservations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async updateReservationStatus(id: string, status: Reservation['status']): Promise<Reservation> {
    await delay(800);
    
    const reservation = mockReservations.find(r => r.id === id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    reservation.status = status;
    reservation.updatedAt = new Date();
    
    return reservation;
  },

  async cancelReservation(id: string): Promise<void> {
    await delay(800);
    
    const reservation = mockReservations.find(r => r.id === id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    reservation.status = 'cancelled';
    reservation.updatedAt = new Date();
    
    // Make the time slot available again
    const slot = mockTimeSlots.find(s => 
      s.barberId === reservation.barberId &&
      s.date.toDateString() === reservation.date.toDateString() &&
      s.startTime === reservation.startTime
    );
    if (slot) {
      slot.isAvailable = true;
    }
  },
};