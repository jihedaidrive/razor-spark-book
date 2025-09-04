import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/types';
import { Clock, DollarSign } from 'lucide-react';

// Import service images
import haircutImage from '@/assets/haircut-service.jpg';
import beardImage from '@/assets/beard-service.jpg';
import treatmentImage from '@/assets/treatment-service.jpg';

// Service type to image mapping
const serviceImages: Record<string, string> = {
  'haircut': haircutImage,
  'beard': beardImage,
  'treatment': treatmentImage,
};interface ServiceCardProps {
  service: Service;
  onBookClick?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBookClick }) => {
  // Get image based on service name or fallback to treatment image
  const imageSrc = useMemo(() => {
    const serviceLower = service.name.toLowerCase();
    const imageKey = Object.keys(serviceImages).find(key => serviceLower.includes(key));
    return imageKey ? serviceImages[imageKey] : treatmentImage;
  }, [service.name]);

  return (
    <Card className="service-card group overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageSrc}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
          ${service.price}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          {service.name}
        </CardTitle>
        {service.description && (
          <CardDescription className="text-muted-foreground">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{service.price}</span>
            </div>
          </div>
        </div>

        {onBookClick && (
          <Button
            onClick={() => onBookClick(service)}
            className="w-full btn-primary"
            variant="default"
          >
            Book Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
