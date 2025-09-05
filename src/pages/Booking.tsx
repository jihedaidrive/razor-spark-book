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
import MobileLayout from '@/components/MobileLayout';
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
    <MobileLayout>
      {/* Mobile-first Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Book Appointment</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Choose your barber and time</p>
      </div>

      {/* Mobile-First Filters */}
      <div className="space-y-4 mb-6">
        {/* Barber Selection Card */}
        <Card className="mobile-card">
          <CardContent className="mobile-card-content">
            <label className="text-sm font-medium mb-2 block">Select Barber</label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger className="mobile-input">
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
          </CardContent>
        </Card>

        {/* Service Selection Card */}
        <Card className="mobile-card">
          <CardContent className="mobile-card-content">
            <label className="text-sm font-medium mb-2 block">Service (Optional)</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="mobile-input">
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
          </CardContent>
        </Card>

        {/* View Toggle Card */}
        <Card className="mobile-card">
          <CardContent className="mobile-card-content">
            <label className="text-sm font-medium mb-2 block">View Mode</label>
            <div className="flex rounded-xl border-2 p-1 bg-muted/20">
              <button
                onClick={() => setCalendarView('week')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${calendarView === 'week'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Week</span>
              </button>
              <button
                onClick={() => setCalendarView('list')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${calendarView === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Debug Info - Collapsible */}
      <details className="mb-6">
        <summary className="cursor-pointer p-4 bg-muted/50 rounded-xl text-sm font-medium touch-manipulation">
          📊 Debug Info ({reservations.length} reservations)
        </summary>
        <Card className="mobile-card mt-2">
          <CardContent className="mobile-card-content">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-xs sm:text-sm">
              <div>Reservations: {reservations.length}</div>
              <div>Calendar Slots: {calendarSlots.length}</div>
              <div>Updated: {new Date(lastUpdate).toLocaleTimeString()}</div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Recent Status:</p>
              {reservations.slice(0, 3).map(r => (
                <div key={r._id || r.id} className="text-xs text-muted-foreground truncate">
                  {r.barberName} - {r.startTime} - {r.status}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </details>

      {/* Mobile-First Calendar / List */}
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
          <Card className="mobile-card">
            <CardHeader className="mobile-card-header">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <List className="w-5 h-5" />
                <span>Available Slots</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="mobile-card-content">
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
                        <Card key={slot.id} className="mobile-card hover:shadow-md transition-all duration-200">
                          <CardContent className="mobile-card-content">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <User className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{barber.name}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{format(slot.date, 'EEE, MMM d')}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{slot.startTime}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleSlotClick(slot, barber)}
                                disabled={!slot.isAvailable}
                                className="mobile-btn-sm ml-3"
                              >
                                Book
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
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
          date: typeof selectedSlot.date === 'string' ? selectedSlot.date : (() => {
            const d = selectedSlot.date;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })(),
          services: selectedSlot.services || []
        } : null}
        selectedBarber={selectedBarberData}
        onBookingComplete={handleBookingComplete}
      />
    </MobileLayout>
  );
};

export default Booking;
