import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeSlot, Barber, Service, Reservation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { servicesService, reservationsService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar, Clock, User, Scissors, Loader2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: TimeSlot | null;
  selectedBarber: Barber | null;
  onBookingComplete: (reservation: Reservation) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  selectedBarber,
  onBookingComplete,
}) => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    clientName: user?.name || '',
    clientPhone: user?.phone || '',
    serviceId: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      setFormData({
        clientName: user?.name || '',
        clientPhone: user?.phone || '',
        serviceId: '',
        description: '',
      });
    }
  }, [isOpen, user]);

  const fetchServices = async () => {
    try {
      const fetchedServices = await servicesService.getServices();
      setServices(fetchedServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !selectedBarber || !formData.serviceId || !formData.clientName || !formData.clientPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) {
      toast({
        title: "Invalid Service",
        description: "Please select a valid service",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: user?.id || 'guest',
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: new Date(selectedSlot.date),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'pending',
        description: formData.description,
      };

      const createdReservation = await reservationsService.createReservation(reservation);
      
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment with ${selectedBarber.name} has been booked for ${format(new Date(selectedSlot.date), 'MMM d, yyyy')} at ${selectedSlot.startTime}`,
      });

      onBookingComplete(createdReservation);
      onClose();
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Book Appointment</span>
          </DialogTitle>
          <DialogDescription>
            Complete your booking details below
          </DialogDescription>
        </DialogHeader>

        {selectedSlot && selectedBarber && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium">{selectedBarber.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{format(new Date(selectedSlot.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
              </div>
              {selectedService && (
                <div className="flex items-center space-x-2">
                  <Scissors className="w-4 h-4 text-primary" />
                  <span>${selectedService.price}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Full Name *</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Enter your name"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Phone Number *</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="+1234567890"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            {loadingServices ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : (
              <Select
                value={formData.serviceId}
                onValueChange={(value) => handleInputChange('serviceId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ${service.price} • {service.duration}min
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Special Requests (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Any specific requests or notes..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || loadingServices}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;