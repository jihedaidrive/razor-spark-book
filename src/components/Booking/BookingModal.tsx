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

    try {
      const formattedDate = formatISO(new Date(selectedSlot.date), { representation: 'date' });
      
      // Send multiple service IDs to backend
      const reservation = await reservationsService.createReservation({
        clientName: user.name,
        clientPhone: user.phone,
        barberName: selectedBarber.name,
        date: formattedDate,
        startTime: selectedSlot.startTime,
        serviceIds: selectedServices.map(service => service.id), // Multiple services
        notes
      });

      const serviceNames = selectedServices.map(s => s.name).join(', ');
      toast({
        title: 'Reservation Pending',
        description: `Your appointment for ${serviceNames} has been sent and is awaiting confirmation.`
      });
      onBookingComplete(reservation);
      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Error',
        description: 'Failed to book appointment',
        variant: 'destructive'
      });
    }
  };

  if (!isOpen || !selectedSlot || !selectedBarber) return null;

  const bookingDate = selectedSlot.date;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">Confirm Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Mobile-optimized booking details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Barber
              </h4>
              <div className="text-sm text-muted-foreground font-medium">{selectedBarber.name}</div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date & Time
              </h4>
              <div className="text-sm text-muted-foreground">
                <div className="font-medium">{format(new Date(bookingDate), 'EEE, MMM d, yyyy')}</div>
                <div className="text-xs mt-1">{selectedSlot.startTime} - {selectedSlot.endTime}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center">
              <Scissors className="w-4 h-4 mr-2" />
              Services (Select one or more)
            </label>
            
            {/* Mobile-optimized service selection */}
            <div className="space-y-2 max-h-60 sm:max-h-48 overflow-y-auto">
              {services.map(service => (
                <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.some(s => s.id === service.id)}
                    onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={service.id} 
                      className="text-sm font-medium cursor-pointer block"
                    >
                      {service.name}
                    </label>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground">
                        {service.duration} minutes
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        ${service.price}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mobile-optimized summary */}
            {selectedServices.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border">
                <div className="text-sm font-medium mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Booking Summary
                </div>
                <div className="space-y-2">
                  {selectedServices.map(service => (
                    <div key={service.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground truncate pr-2">{service.name}</span>
                      <span className="font-medium">${service.price}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3 flex justify-between items-center">
                    <div className="text-sm">
                      <div className="font-medium">Total Duration</div>
                      <div className="text-xs text-muted-foreground">{totalDuration} minutes</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">${totalPrice}</div>
                      <div className="text-xs text-muted-foreground">Total Price</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Input 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Any special requests..."
              className="h-11 sm:h-10"
            />
          </div>

          {/* Mobile-optimized buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
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
                    ? 'Select Services' 
                    : `Book Now - $${totalPrice}`
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
