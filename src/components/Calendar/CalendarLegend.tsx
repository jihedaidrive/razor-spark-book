import React from 'react';

interface LegendItem {
  label: string;
  color: string;
  description: string;
}

const legendItems: LegendItem[] = [
  { label: 'Available', color: 'bg-success/10 text-success border-success', description: 'Open for booking' },
  { label: 'Reserved', color: 'bg-destructive/10 text-destructive', description: 'Already booked' },
  { label: 'Pending', color: 'text-warning border-warning', description: 'Awaiting confirmation' },
  { label: 'Past', color: 'opacity-30 text-muted-foreground', description: 'Time slot has passed' },
  { label: 'Completed', color: 'opacity-70 text-muted-foreground', description: 'Appointment completed' }
];

const CalendarLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/10 rounded-lg mb-4">
      {legendItems.map(({ label, color, description }) => (
        <div key={label} className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded ${color.split(' ')[0]}`} />
          <div>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground ml-1">({description})</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarLegend;
