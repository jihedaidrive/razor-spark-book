/**
 * BOOKING PAGE - FIXED VERSION
 * 
 * Key fixes implemented:
 * 1. Uses centralized barber configuration from src/config/barbers.ts
 * 2. Fixed barber ID consistency: uses barber names as IDs (matches Dashboard.tsx)
 * 3. Fixed calendarSlots mapping: barberId = r.barberName (no more ID mismatch)
 * 4. Enhanced handleBookingComplete: properly adds new reservations to state
 * 5. Added forced calendar refresh with key prop and lastUpdate dependency
 * 6. CRITICAL FIX: fetchReservations now gets ALL reservations (like Dashboard.tsx)
 *    - Previous version only fetched today's reservations
 *    - WeeklyCalendar shows full week, needs all reservations to show confirmed slots
 * 7. Added comprehensive logging and debug info for troubleshooting
 * 
 * This ensures confirmed/booked slots show as unavailable (red) after admin confirmation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklyCalendar from '@/components/Calendar/WeeklyCalendar';
import BookingModal from '@/components/Booking/BookingModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, List, User, Scissors, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Types
import { CalendarView, UiTimeSlot, UiBarber, Service, Reservation } from '@/types';
import { reservationsService } from '@/api/reservationsApi';
import { servicesApi } from '@/api/servicesApi';
// Import centralized barber configuration
import { getActiveBarbers } from '@/config/barbers';

const Booking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<UiTimeSlot | null>(null);
  const [selectedBarberData, setSelectedBarberData] = useState<UiBarber | null>(null);

  // Use centralized barber configuration - names as IDs for consistency with API data
  const availableBarbers = getActiveBarbers();

  // Fetch initial data (services and reservations)
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam) setSelectedService(serviceParam);

    const initData = async () => {
      await fetchServices();
      await fetchReservations();
    };
    initData();
  }, []);

  // Fetch services
  const fetchServices = async () => {
    try {
      const fetchedServices = await servicesApi.getServices();
      setServices(fetchedServices);
      // Initialize with first available barber if none selected
      if (!selectedBarber && availableBarbers.length > 0) {
        setSelectedBarber(availableBarbers[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    }
  };

  // Fetch reservations - WITH BOOKING AVAILABILITY FLAGS
  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const params: any = {};

      // 🚀 CRITICAL: Add booking availability flags for backend
      // These flags tell the backend to return ALL reservations, not just user's own
      params.forBooking = true;
      params.includeAll = true;
      params.allUsers = true;

      // Only filter by barber if one is selected
      if (selectedBarber) {
        params.barberName = selectedBarber;
      }

      console.log('Booking: Fetching ALL reservations with booking flags:', params);

      const fetchedReservations = await reservationsService.getReservations(params);

      console.log('Booking: Fetched ALL reservations:', fetchedReservations);
      console.log('Booking: Number of reservations:', fetchedReservations.length);

      // Log unique clients to verify we're getting all users' reservations
      if (fetchedReservations.length > 0) {
        const uniqueClients = [...new Set(fetchedReservations.map(r => r.clientName))];
        console.log('Booking: Unique clients found:', uniqueClients.length, uniqueClients);
      }

      setReservations(fetchedReservations);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      toast({ title: 'Error', description: 'Failed to load reservations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh reservations periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => setLastUpdate(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Re-fetch reservations when barber or service changes
  useEffect(() => {
    fetchReservations();
  }, [selectedBarber, selectedService, lastUpdate]);

  // Map reservations to calendar slots - FOLLOW DASHBOARD PATTERN EXACTLY
  const calendarSlots: UiTimeSlot[] = useMemo(() => {
    console.log('Booking: Generating calendar data from reservations:', reservations);

    // Follow Dashboard pattern exactly - just map existing reservations
    return reservations.map(r => {
      console.log('Booking: Processing reservation:', {
        id: r._id || r.id,
        barberName: r.barberName,
        date: r.date,
        startTime: r.startTime,
        status: r.status
      });

      return {
        id: r._id || r.id,
        barberId: r.barberName, // Use barber name directly as ID (matches Dashboard)
        date: new Date(r.date),
        startTime: r.startTime,
        endTime: r.endTime || `${parseInt(r.startTime.split(':')[0]) + 1}:00`,
        isAvailable: r.status === 'cancelled', // Only cancelled slots are truly available
        status: r.status, // PRESERVE ORIGINAL STATUS - THIS IS CRUCIAL
        services: (r.services || []).map(s => ({
          id: s.serviceId,
          name: s.serviceName,
          duration: s.duration || 30,
          price: s.price || 0,
          isActive: true
        })),
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        reservationId: r._id || r.id
      };
    });
  }, [reservations, lastUpdate]); // Include lastUpdate to force refresh like Dashboard

  // Handle slot click
  const handleSlotClick = (slot: UiTimeSlot, barber: UiBarber) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to book an appointment', variant: 'destructive' });
      return;
    }
    setSelectedSlot(slot);
    setSelectedBarberData(barber);
    setIsBookingModalOpen(true);
  };

  // Handle booking completion
  // FIXED: Properly handle optimistic updates and add new reservation to state
  const handleBookingComplete = (reservation?: Reservation) => {
    if (!selectedSlot || !reservation) return;

    console.log('Booking: Handling booking completion:', {
      selectedSlot,
      reservation,
      reservationBarberName: reservation.barberName
    });

    // FIXED: Add the new reservation to the list instead of trying to update existing one
    // This ensures the booked slot immediately shows as unavailable
    setReservations(prev => {
      // Check if reservation already exists (avoid duplicates)
      const existingIndex = prev.findIndex(r =>
        (r._id || r.id) === (reservation._id || reservation.id)
      );

      if (existingIndex >= 0) {
        // Update existing reservation
        const updated = [...prev];
        updated[existingIndex] = { ...reservation };
        console.log('Booking: Updated existing reservation in state');
        return updated;
      } else {
        // Add new reservation
        console.log('Booking: Added new reservation to state');
        return [...prev, reservation];
      }
    });

    // Force calendar refresh immediately (like Dashboard.tsx)
    setLastUpdate(Date.now());

    toast({
      title: 'Success!',
      description: 'Your appointment has been booked successfully'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please login to access the booking system.</p>
            <Button asChild className="w-full">
              <a href="/login">Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized container with proper padding */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Mobile-first Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Book Appointment</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Choose your barber and time</p>
        </div>

        {/* Mobile-optimized Filters - Stack on mobile, grid on larger screens */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Barber Selection - Full width on mobile */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Barber</label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="h-11 sm:h-10">
                <SelectValue placeholder="Any barber" />
              </SelectTrigger>
              <SelectContent>
                {availableBarbers.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{b.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection - Full width on mobile */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Service (Optional)</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-11 sm:h-10">
                <SelectValue placeholder="Any service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Scissors className="w-4 h-4" />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-muted-foreground ml-2 text-sm">${s.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle - Mobile-friendly buttons */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-sm font-medium">View</label>
            <div className="flex rounded-lg border p-1 bg-muted/20">
              <button
                onClick={() => setCalendarView('week')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${calendarView === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Week</span>
              </button>
              <button
                onClick={() => setCalendarView('list')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${calendarView === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile-optimized Debug Info - Collapsible on mobile */}
        <details className="mb-4 sm:mb-6">
          <summary className="cursor-pointer p-3 sm:p-4 bg-muted/50 rounded-lg text-sm font-medium">
            📊 Debug Info ({reservations.length} reservations)
          </summary>
          <div className="mt-2 p-3 sm:p-4 bg-muted/30 rounded-lg text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <div>Reservations: {reservations.length}</div>
              <div>Calendar Slots: {calendarSlots.length}</div>
              <div>Updated: {new Date(lastUpdate).toLocaleTimeString()}</div>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Recent Status:</p>
              {reservations.slice(0, 3).map(r => (
                <div key={r._id || r.id} className="text-xs text-muted-foreground truncate">
                  {r.barberName} - {r.startTime} - {r.status}
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Mobile-optimized Calendar / List */}
        <div className="w-full">
          {calendarView === 'week' ? (
            <WeeklyCalendar
              key={`calendar-${lastUpdate}-${JSON.stringify(reservations.map(r => ({ id: r._id || r.id, status: r.status })))}`}
              timeSlots={calendarSlots}
              barbers={selectedBarber ? availableBarbers.filter(b => b.id === selectedBarber) : availableBarbers}
              selectedBarber={selectedBarber}
              onSlotClick={handleSlotClick}
              isLoading={isLoading}
            />
          ) : (
            <Card className="border-0 sm:border shadow-none sm:shadow-sm">
              <CardHeader className="px-3 sm:px-6 py-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <List className="w-5 h-5" />
                  <span>Available Slots</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-3">
                  {calendarSlots.filter(slot => slot.isAvailable).length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No available slots found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    calendarSlots
                      .filter(slot => slot.isAvailable)
                      .slice(0, 20)
                      .map(slot => {
                        const barber = availableBarbers.find(b => b.id === slot.barberId);
                        if (!barber) return null;
                        return (
                          <div
                            key={slot.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{barber.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(slot.date, 'EEE, MMM d')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{slot.startTime} - {slot.endTime}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSlotClick(slot, barber)}
                              disabled={!slot.isAvailable}
                              className="w-full sm:w-auto"
                              size="sm"
                            >
                              Book Now
                            </Button>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlot ? {
            ...selectedSlot,
            date: typeof selectedSlot.date === 'string' ? selectedSlot.date : selectedSlot.date.toISOString().split('T')[0],
            services: selectedSlot.services || []
          } : null}
          selectedBarber={selectedBarberData}
          onBookingComplete={handleBookingComplete}
        />
      </div>
    </div>
  );
};

export default Booking;
