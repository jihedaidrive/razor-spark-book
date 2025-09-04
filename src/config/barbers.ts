// Centralized barber configuration
// Uses barber names as unique identifiers for consistency across Dashboard and Booking pages
// This ensures proper matching between API data (which stores barberName) and UI components

import { UiBarber } from '@/types';

export const BARBERS: UiBarber[] = [
  {
    id: 'John',        // Use actual name as ID to match API data
    name: 'John',
    phone: '123456789',
    isActive: true
  },
  {
    id: 'Mike',        // Use actual name as ID to match API data
    name: 'Mike', 
    phone: '987654321',
    isActive: true
  },
  {
    id: 'Alex',        // Use actual name as ID to match API data
    name: 'Alex',
    phone: '555555555', 
    isActive: true
  }
];

// Helper function to get barber by name (for API data mapping)
export const getBarberByName = (name: string): UiBarber | undefined => {
  return BARBERS.find(barber => barber.name === name);
};

// Helper function to get all active barbers
export const getActiveBarbers = (): UiBarber[] => {
  return BARBERS.filter(barber => barber.isActive);
};