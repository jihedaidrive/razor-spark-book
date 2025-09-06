import React, { useState, useEffect } from 'react';
import { TimeSlot, Barber, Reservation, reservationsService } from '@/api/reservationsApi';
import { Service } from '@/api/reservationsApi';
import { servicesApi } from '@/api/servicesApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatISO } from 'date-fns';
import { User, Calendar, Scissors } from 'lucide-react';
import { sanitizeNotes, sanitizeHtml } from '@/utils/security';
import { useTranslation } from 'react-i18next';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: TimeSlot | null;
  selectedBarber: Barber | null;
  onBookingComplete: (reservation?: Reservation) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedSlot,
  selectedBarber,
  onBookingComplete
}: BookingModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchServices();
    // Reset selected services when modal opens
    setSelectedServices([]);
    setNotes('');
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const fetchedServices = await servicesApi.getServices();
      setServices(fetchedServices);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch services',
        variant: 'destructive',
      });
    }
  };

  const { user } = useAuth();

  // Handle service selection (multiple services)
  const handleServiceToggle = (service: Service, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, service]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    }
  };

  // Calculate totals for selected services
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

  const handleConfirm = async () => {
    // Enhanced validation
    if (!selectedSlot || !selectedBarber || selectedServices.length === 0 || !user) {
      toast({
        title: 'Error',
        description: selectedServices.length === 0 
          ? 'Please select at least one service' 
          : 'Please login to book an appointment',
        variant: 'destructive',
      });
      return;
    }

    // Validate selected date is not in the past
    const selectedDate = new Date(`${selectedSlot.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'Cannot book appointments for past dates',
        variant: 'destructive',
      });
      return;
    }

    // Validate service selection limits
    if (selectedServices.length > 5) {
      toast({
        title: 'Too Many Services',
        description: 'Maximum 5 services can be selected per appointment',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formattedDate = formatISO(selectedDate, { representation: 'date' });
      const sanitizedNotes = sanitizeNotes(notes);
      
      // Validate service IDs
      const validServiceIds = selectedServices
        .map(service => service.id)
        .filter(id => id && typeof id === 'string' && id.length > 0);
      
      if (validServiceIds.length !== selectedServices.length) {
        throw new Error('Invalid service selection');
      }

      // Calculate end time based on selected services duration
      const totalDurationMinutes = selectedServices.reduce((sum, service) => sum + service.duration, 0);
      const startTimeDate = new Date(`2000-01-01T${selectedSlot.startTime}:00`);
      const endTimeDate = new Date(startTimeDate.getTime() + totalDurationMinutes * 60000);
      const endTime = endTimeDate.toTimeString().slice(0, 5); // Format as HH:MM

      // Create reservation data (let axios client handle sanitization)
      const reservationData = {
        clientName: user.name, // Don't double-sanitize
        clientPhone: user.phone,
        barberName: selectedBarber.name, // Don't double-sanitize
        date: formattedDate,
        startTime: selectedSlot.startTime,
        endTime: endTime, // Add the missing endTime field
        serviceIds: validServiceIds,
        notes: sanitizedNotes
      };

      if (import.meta.env.DEV) {
        console.log('Creating reservation with data:', reservationData);
      }

      const reservation = await reservationsService.createReservation(reservationData);

      const serviceNames = selectedServices
        .map(s => sanitizeHtml(s.name))
        .join(', ');
        
      toast({
        title: 'Reservation Pending',
        description: `Your appointment for ${serviceNames} has been sent and is awaiting confirmation.`
      });
      
      onBookingComplete(reservation);
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      console.error('Error response data:', error?.response?.data);
      console.error('Error response status:', error?.response?.status);
      console.error('Error response headers:', error?.response?.headers);
      
      // Log the full error object for debugging
      if (import.meta.env.DEV) {
        console.error('Full error object:', JSON.stringify(error?.response?.data, null, 2));
      }
      
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error ||
                          error?.response?.data?.details ||
                          error?.message || 
                          'Failed to book appointment';
      
      // Show detailed error in development
      const detailedError = import.meta.env.DEV 
        ? `${errorMessage} (Status: ${error?.response?.status}) - Check console for details`
        : errorMessage;
      
      toast({
        title: 'Booking Error',
        description: detailedError,
        variant: 'destructive'
      });
    }
  };

  if (!isOpen || !selectedSlot || !selectedBarber) return null;

  const bookingDate = selectedSlot.date;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl fixed bottom-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto mx-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold text-center">{t('bookingModal.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mobile-First Booking Details Card */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedBarber.name}</h4>
                  <p className="text-sm text-muted-foreground">Your Barber</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">{format(new Date(`${bookingDate}T00:00:00`), 'EEE, MMM d, yyyy')}</h4>
                  <p className="text-sm text-muted-foreground">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-First Service Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Scissors className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('bookingModal.selectServices')}</h3>
            </div>
            
            {/* Service Cards */}
            <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
              {services.map(service => (
                <div 
                  key={service.id} 
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer touch-manipulation min-h-[60px] ${
                    selectedServices.some(s => s.id === service.id)
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => handleServiceToggle(service, !selectedServices.some(s => s.id === service.id))}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.some(s => s.id === service.id)}
                      onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                      className="pointer-events-none flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{service.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {service.duration} min
                        </span>
                        <span className="text-base sm:text-lg font-bold text-primary">
                          ${service.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile-First Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Booking Summary
                </h4>
                <div className="space-y-2">
                  {selectedServices.map(service => (
                    <div key={service.id} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate pr-2">{service.name}</span>
                      <span className="font-medium">${service.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-primary/20 pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Total Duration</span>
                      <span className="text-sm text-muted-foreground">{totalDuration} min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total Price</span>
                      <span className="text-xl font-bold text-primary">${totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('bookingModal.notes')}</label>
            <Input 
              value={notes} 
              onChange={e => {
                const value = e.target.value;
                // Limit input length and prevent potentially dangerous characters
                if (value.length <= 500) {
                  setNotes(value.replace(/[<>]/g, ''));
                }
              }}
              placeholder={t('bookingModal.notesPlaceholder')}
              className="h-12 px-4 rounded-xl border-2 focus:border-primary"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">
              {notes.length}/500 {t('bookingModal.characters')}
            </div>
          </div>

          {/* Mobile-optimized buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {t('bookingModal.cancel')}
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedServices.length === 0}
              className="w-full sm:w-auto order-1 sm:order-2 h-11 sm:h-10"
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {selectedServices.length === 0 
                    ? t('bookingModal.selectServicesButton') 
                    : `${t('bookingModal.bookNowButton')} - $${totalPrice}`
                  }
                </span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
