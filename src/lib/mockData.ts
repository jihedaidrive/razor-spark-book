import { User, Service, Barber, TimeSlot, Reservation } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    phone: '+1234567890',
    name: 'John Doe',
    role: 'client',
    createdAt: new Date(),
  },
  {
    id: 'admin',
    phone: '+1111111111',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
  },
  {
    id: 'barber1',
    phone: '+2222222222',
    name: 'Mike Johnson',
    role: 'barber',
    createdAt: new Date(),
  },
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Haircut',
    description: 'Professional haircut with modern styling techniques',
    duration: 45,
    price: 35,
    image: '/src/assets/haircut-service.jpg',
  },
  {
    id: '2',
    name: 'Beard Trim',
    description: 'Expert beard trimming and shaping for the perfect look',
    duration: 30,
    price: 25,
    image: '/src/assets/beard-service.jpg',
  },
  {
    id: '3',
    name: 'Hair Treatment',
    description: 'Deep conditioning and keratin treatments for healthy hair',
    duration: 60,
    price: 75,
    image: '/src/assets/treatment-service.jpg',
  },
  {
    id: '4',
    name: 'Soin',
    description: 'Complete grooming experience with premium products',
    duration: 90,
    price: 95,
    image: '/src/assets/treatment-service.jpg',
  },
];

export const mockBarbers: Barber[] = [
  {
    id: 'barber1',
    name: 'Mike Johnson',
    phone: '+2222222222',
    specialties: ['Haircut', 'Beard Trim'],
    isActive: true,
  },
  {
    id: 'barber2',
    name: 'Alex Rodriguez',
    phone: '+3333333333',
    specialties: ['Hair Treatment', 'Soin'],
    isActive: true,
  },
  {
    id: 'barber3',
    name: 'Chris Wilson',
    phone: '+4444444444',
    specialties: ['Haircut', 'Hair Treatment', 'Soin'],
    isActive: true,
  },
];

// Generate time slots for the next 7 days
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    
    // Skip Sundays
    if (date.getDay() === 0) continue;
    
    mockBarbers.forEach(barber => {
      // Working hours: 9 AM to 6 PM
      for (let hour = 9; hour < 18; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        slots.push({
          id: `${barber.id}-${date.toISOString().split('T')[0]}-${startTime}`,
          barberId: barber.id,
          date,
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3, // 70% chance of being available
        });
      }
    });
  }
  
  return slots;
};

export const mockTimeSlots = generateTimeSlots();

export const mockReservations: Reservation[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'John Doe',
    clientPhone: '+1234567890',
    barberId: 'barber1',
    barberName: 'Mike Johnson',
    serviceId: '1',
    serviceName: 'Haircut',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    startTime: '10:00',
    endTime: '10:45',
    status: 'pending',
    description: 'Regular trim, not too short',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    clientId: '1',
    clientName: 'John Doe',
    clientPhone: '+1234567890',
    barberId: 'barber2',
    barberName: 'Alex Rodriguez',
    serviceId: '2',
    serviceName: 'Beard Trim',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    startTime: '14:00',
    endTime: '14:30',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];