import { Service, Barber, TimeSlot, Reservation } from '@/types';

// Mock users removed for security reasons
// export const mockUsers: User[] = [];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Haircut',
    description: 'Professional haircut with modern styling techniques',
    duration: 45,
    price: 35,
    isActive: true,
  },
  {
    id: '2',
    name: 'Beard Trim',
    description: 'Expert beard trimming and shaping for the perfect look',
    duration: 30,
    price: 25,
    isActive: true,
  },
  {
    id: '3',
    name: 'Hair Treatment',
    description: 'Deep conditioning and keratin treatments for healthy hair',
    duration: 60,
    price: 75,
    isActive: true,
  },
  {
    id: '4',
    name: 'Soin du Visage',
    description: 'Complete facial care and grooming experience',
    duration: 90,
    price: 95,
    isActive: true,
  },
  {
    id: '5',
    name: 'Shampooing Premium',
    description: 'Professional hair washing with premium products',
    duration: 20,
    price: 15,
    isActive: true,
  },
  {
    id: '6',
    name: 'Styling',
    description: 'Professional hair styling and finishing',
    duration: 30,
    price: 25,
    isActive: true,
  },
  {
    id: '7',
    name: 'Mustache Trim',
    description: 'Precise mustache trimming and shaping',
    duration: 20,
    price: 20,
    isActive: true,
  },
  {
    id: '8',
    name: 'Massage Relaxant',
    description: 'Relaxing head and neck massage',
    duration: 45,
    price: 40,
    isActive: true,
  },
  {
    id: '9',
    name: 'Conditioning Treatment',
    description: 'Deep hair conditioning for softness and shine',
    duration: 35,
    price: 30,
    isActive: true,
  },
];

export const mockBarbers: Barber[] = [
  {
    id: 'barber1',
    name: 'Mike Johnson',
  },
  {
    id: 'barber2',
    name: 'Alex Rodriguez',
  },
  {
    id: 'barber3',
    name: 'Chris Wilson',
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
          date: date.toISOString().split('T')[0],
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
    clientName: 'John Doe',
    clientPhone: '+1234567890',
    barberName: 'Mike Johnson',
    serviceId: '1',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    startTime: '10:00',
    endTime: '10:45',
    status: 'pending',
    notes: 'Regular trim, not too short',
    totalDuration: 45,
    totalPrice: 35,
  },
  {
    id: '2',
    clientName: 'John Doe',
    clientPhone: '+1234567890',
    barberName: 'Alex Rodriguez',
    serviceId: '2',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
    startTime: '14:00',
    endTime: '14:30',
    status: 'confirmed',
    totalDuration: 30,
    totalPrice: 25,
  },
];