import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeSlot, Barber } from '@/types';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';

interface WeeklyCalendarProps {
  timeSlots: TimeSlot[];
  barbers: Barber[];
  selectedBarber?: string;
  onSlotClick: (slot: TimeSlot, barber: Barber) => void;
  isLoading?: boolean;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  timeSlots,
  barbers,
  selectedBarber,
  onSlotClick,
  isLoading = false,
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Filter out Sundays and only show next 6 days
  const workingDays = weekDays.slice(0, 6);
  
  const filteredBarbers = selectedBarber 
    ? barbers.filter(b => b.id === selectedBarber)
    : barbers;

  const getSlotForDateTime = (barberId: string, date: Date, startTime: string) => {
    return timeSlots.find(slot => 
      slot.barberId === barberId &&
      isSameDay(new Date(slot.date), date) &&
      slot.startTime === startTime &&
      slot.isAvailable
    );
  };

  const workingHours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Weekly Schedule</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-4">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 5), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              <div className="font-medium text-sm text-muted-foreground p-2">
                Time
              </div>
              {workingDays.map(day => (
                <div key={day.toISOString()} className="text-center p-2">
                  <div className="font-medium text-sm">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'MMM d')}
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
                    <Badge variant="secondary">
                      {barber.specialties.join(', ')}
                    </Badge>
                  </div>
                  
                  {workingHours.map(hour => (
                    <div key={hour} className="grid grid-cols-7 gap-2 mb-2">
                      <div className="text-sm text-muted-foreground p-2 flex items-center">
                        {hour}
                      </div>
                      {workingDays.map(day => {
                        const slot = getSlotForDateTime(barber.id, day, hour);
                        const isAvailable = Boolean(slot);
                        
                        return (
                          <div key={`${day.toISOString()}-${hour}`} className="p-1">
                            <Button
                              variant={isAvailable ? "outline" : "ghost"}
                              size="sm"
                              className={`w-full h-8 text-xs calendar-slot ${
                                isAvailable 
                                  ? 'border-success text-success hover:bg-success hover:text-success-foreground' 
                                  : 'opacity-30 cursor-not-allowed'
                              }`}
                              onClick={() => slot && onSlotClick(slot, barber)}
                              disabled={!isAvailable}
                            >
                              {isAvailable ? 'Free' : 'Busy'}
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