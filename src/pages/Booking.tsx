import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import WeeklyCalendar from '@/components/Calendar/WeeklyCalendar';
import BookingModal from '@/components/Booking/BookingModal';
import { TimeSlot, Barber, Service, Reservation, CalendarView } from '@/types';
import { timeSlotsService, barbersService, servicesService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, List, User, Scissors, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';

const Booking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [isLoading, setIsLoading] = useState(true);
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedBarberData, setSelectedBarberData] = useState<Barber | null>(null);

  useEffect(() => {
    // Check for service parameter from URL
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      setSelectedService(serviceParam);
    }
    
    fetchInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (selectedBarber || selectedService) {
      fetchTimeSlots();
    }
  }, [selectedBarber, selectedService]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [fetchedBarbers, fetchedServices] = await Promise.all([
        barbersService.getBarbers(),
        servicesService.getServices(),
      ]);
      
      setBarbers(fetchedBarbers);
      setServices(fetchedServices);
      
      // Auto-select first barber if none selected
      if (!selectedBarber && fetchedBarbers.length > 0) {
        setSelectedBarber(fetchedBarbers[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load booking data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 14); // Next 2 weeks
      
      const fetchedSlots = await timeSlotsService.getSlotsByDateRange(
        startDate,
        endDate,
        selectedBarber || undefined
      );
      
      setTimeSlots(fetchedSlots);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive",
      });
    }
  };

  const handleSlotClick = (slot: TimeSlot, barber: Barber) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book an appointment",
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot(slot);
    setSelectedBarberData(barber);
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = (reservation: Reservation) => {
    // Update time slots to reflect the booking
    setTimeSlots(prev => prev.map(slot => 
      slot.id === selectedSlot?.id 
        ? { ...slot, isAvailable: false }
        : slot
    ));
    
    toast({
      title: "Success!",
      description: "Your appointment has been booked successfully",
    });
  };

  const filteredTimeSlots = timeSlots.filter(slot => {
    if (selectedBarber && slot.barberId !== selectedBarber) return false;
    return true;
  });

  const selectedServiceData = services.find(s => s.id === selectedService);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to access the booking system.
            </p>
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Book Your Appointment
          </h1>
          <p className="text-muted-foreground">
            Choose your preferred barber and time slot
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Barber</label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger>
                <SelectValue placeholder="Any barber" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{barber.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {barber.specialties.slice(0, 2).join(', ')}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Service (Optional)</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Any service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Scissors className="w-4 h-4" />
                        <span>{service.name}</span>
                      </div>
                      <span className="text-muted-foreground ml-2">
                        ${service.price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">View</label>
            <Select value={calendarView} onValueChange={(value: CalendarView) => setCalendarView(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Week View</span>
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center space-x-2">
                    <List className="w-4 h-4" />
                    <span>List View</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Service Info */}
        {selectedServiceData && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Scissors className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{selectedServiceData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedServiceData.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">${selectedServiceData.price}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedServiceData.duration} min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {calendarView === 'week' ? (
          <WeeklyCalendar
            timeSlots={filteredTimeSlots}
            barbers={selectedBarber ? barbers.filter(b => b.id === selectedBarber) : barbers}
            selectedBarber={selectedBarber}
            onSlotClick={handleSlotClick}
            isLoading={isLoading}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <List className="w-5 h-5" />
                <span>Available Slots</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTimeSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No available slots found. Try adjusting your filters.
                  </p>
                ) : (
                  filteredTimeSlots.slice(0, 20).map((slot) => {
                    const barber = barbers.find(b => b.id === slot.barberId);
                    if (!barber) return null;
                    
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">{barber.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {barber.specialties.join(', ')}
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(slot.date), 'EEE, MMM d')}
                            </div>
                            <div className="text-muted-foreground">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSlotClick(slot, barber)}
                          disabled={!slot.isAvailable}
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

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedSlot={selectedSlot}
          selectedBarber={selectedBarberData}
          onBookingComplete={handleBookingComplete}
        />
      </div>
    </div>
  );
};

export default Booking;