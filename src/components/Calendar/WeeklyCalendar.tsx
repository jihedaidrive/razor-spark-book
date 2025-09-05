import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UiTimeSlot, UiBarber } from '@/types';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isToday, isPast, isFuture, parseISO, set } from 'date-fns';

interface WeeklyCalendarProps {
  timeSlots: UiTimeSlot[];
  barbers: UiBarber[];
  selectedBarber?: string;
  onSlotClick: (slot: UiTimeSlot, barber: UiBarber) => void;
  isLoading?: boolean;
  busySlots?: Array<{ date: string; startTime: string; barberId: string }>;
}

const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18, // 6 PM
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  timeSlots,
  barbers,
  selectedBarber,
  onSlotClick,
  isLoading = false,
  busySlots = [],
}) => {
  const now = new Date();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Filter out Sundays and only show next 6 days
  const workingDays = weekDays.slice(0, 6);
  
  const filteredBarbers = selectedBarber 
    ? barbers.filter(b => b.id === selectedBarber)
    : barbers;

  const getSlotForDateTime = (barberId: string, date: Date, startTime: string) => {
    // First check if the date is in the past
    const slotDate = set(date, {
      hours: parseInt(startTime.split(':')[0]),
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    });

    if (isPast(slotDate) && !isToday(slotDate)) {
      return {
        id: `${barberId}-${date.toISOString()}-${startTime}`,
        barberId,
        date,
        startTime,
        endTime: `${startTime.split(':')[0]}:59`,
        isAvailable: false,
        status: 'past' as const,
        services: []
      };
    }

    // Check for existing reservation first
    const existingSlot = timeSlots.find(slot => 
      slot.barberId === barberId &&
      isSameDay(slot.date, date) &&
      slot.startTime === startTime
    );

    if (existingSlot) {
      // If the slot has any active reservation (not cancelled), mark it as reserved
      if (existingSlot.status === 'confirmed' || 
          existingSlot.status === 'pending' || 
          existingSlot.status === 'completed') {
        return {
          ...existingSlot,
          isAvailable: false,
          status: 'reserved' as const
        };
      }
      
      // If cancelled, treat as available
      if (existingSlot.status === 'cancelled') {
        return {
          ...existingSlot,
          isAvailable: true,
          status: 'available' as const
        };
      }
      
      return existingSlot;
    }

    // Then check if the slot is busy (from busySlots prop)
    const isBusy = busySlots.some(
      busySlot => 
        busySlot.barberId === barberId &&
        isSameDay(parseISO(busySlot.date), date) &&
        busySlot.startTime === startTime
    );

    if (isBusy) {
      return {
        id: `${barberId}-${date.toISOString()}-${startTime}`,
        barberId,
        date,
        startTime,
        endTime: `${startTime.split(':')[0]}:59`,
        isAvailable: false,
        status: 'reserved' as const,
        services: []
      };
    }

    // If no slot exists and not busy, create a new available slot
    return {
      id: `${barberId}-${date.toISOString()}-${startTime}`,
      barberId,
      date,
      startTime,
      endTime: `${startTime.split(':')[0]}:59`,
      isAvailable: true,
      status: 'available' as const,
      services: []
    };
  };

  const workingHours = Array.from(
    { length: BUSINESS_HOURS.end - BUSINESS_HOURS.start }, 
    (_, i) => `${(i + BUSINESS_HOURS.start).toString().padStart(2, '0')}:00`
  );

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Calendar...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader className="px-3 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="w-5 h-5" />
            <span className="hidden sm:inline">Weekly Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </CardTitle>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="h-9 px-3"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </Button>
            <span className="text-xs sm:text-sm font-medium px-2 sm:px-4 text-center">
              <div className="sm:hidden">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 5), 'MMM d')}</div>
              <div className="hidden sm:block">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 5), 'MMM d, yyyy')}</div>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="h-9 px-3"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-1 sm:px-6">
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <div className="w-full min-w-0 px-1 sm:px-0">
            {/* Header with days - Mobile optimized */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-2 sm:mb-4">
              <div className="font-medium text-xs sm:text-sm text-muted-foreground p-0.5 sm:p-2 text-center">
                <span className="hidden sm:inline">Time</span>
                <span className="sm:hidden">T</span>
              </div>
              {workingDays.map(day => (
                <div key={day.toISOString()} className="text-center p-0.5 sm:p-2">
                  <div className="font-medium text-xs sm:text-sm">
                    <span className="hidden sm:inline">{format(day, 'EEE')}</span>
                    <span className="sm:hidden">{format(day, 'EEEEE')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {format(day, 'MMM d')}
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-4">
              {filteredBarbers.map(barber => (
                <div key={barber.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">{barber.name}</span>
                  </div>
                  
                  {workingHours.map(hour => (
                    <div key={hour} className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-1 sm:mb-2">
                      <div className="text-xs sm:text-sm text-muted-foreground p-0.5 sm:p-2 flex items-center justify-center">
                        <span className="transform -rotate-90 sm:rotate-0 whitespace-nowrap text-xs">
                          {hour.replace(':00', '')}
                        </span>
                      </div>
                      {workingDays.map(day => {
                        const slot = getSlotForDateTime(barber.id, day, hour);
                        
                        let buttonVariant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" = "outline";
                        let buttonText = "Available";
                        let isDisabled = false;
                        let buttonClass = "border-success text-success hover:bg-success hover:text-success-foreground";

                        // Log slot status for debugging
                        console.log('Rendering slot:', {
                          date: format(slot.date, 'yyyy-MM-dd'),
                          time: slot.startTime,
                          status: slot.status,
                          isAvailable: slot.isAvailable
                        });

                        switch (slot.status) {
                          case 'confirmed':
                            buttonVariant = "destructive";
                            buttonText = "Confirmed";
                            isDisabled = true;
                            buttonClass = "bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-not-allowed";
                            break;
                          case 'completed':
                            buttonVariant = "ghost";
                            buttonText = "Completed";
                            isDisabled = true;
                            buttonClass = "opacity-70 cursor-not-allowed text-muted-foreground";
                            break;
                          case 'pending':
                            buttonVariant = "secondary";
                            buttonText = "Pending";
                            isDisabled = true;
                            buttonClass = "text-warning border-warning cursor-not-allowed";
                            break;
                          case 'cancelled':
                            // Show cancelled slots as available
                            buttonVariant = "outline";
                            buttonText = "Available";
                            buttonClass = "border-success text-success hover:bg-success/10";
                            isDisabled = false;
                            break;
                          case 'past':
                            buttonVariant = "ghost";
                            buttonText = "Past";
                            isDisabled = true;
                            buttonClass = "opacity-30 cursor-not-allowed text-muted-foreground";
                            break;
                          case 'available':
                            buttonVariant = "outline";
                            buttonText = "Available";
                            buttonClass = "border-success text-success hover:bg-success/10";
                            isDisabled = false;
                            break;
                          default:
                            // For any unknown status, check isAvailable flag
                            if (!slot.isAvailable) {
                              buttonVariant = "destructive";
                              buttonText = "Reserved";
                              isDisabled = true;
                              buttonClass = "bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-not-allowed";
                            }
                            break;
                        }
                        
                        return (
                          <div key={`${day.toISOString()}-${hour}`} className="p-0 sm:p-1">
                            <Button
                              variant={buttonVariant}
                              size="sm"
                              className={`w-full h-6 sm:h-8 text-xs calendar-slot ${buttonClass} touch-manipulation px-1`}
                              onClick={() => !isDisabled && onSlotClick(slot, barber)}
                              disabled={isDisabled}
                            >
                              {buttonText}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyCalendar;