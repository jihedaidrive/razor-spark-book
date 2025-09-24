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
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Import service image utility
import { getServiceImage } from '@/utils/serviceImages';interface ServiceCardProps {
  service: Service;
  onBookClick?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBookClick }) => {
  const { t } = useTranslation();
  
  // Get image based on service name and ID for better randomization
  const imageSrc = useMemo(() => {
    return getServiceImage(service.name, service.id);
  }, [service.name, service.id]);

  return (
    <Card className="service-card group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageSrc}
          alt={service.name}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Price badge with enhanced styling */}
        <div className="absolute top-4 right-4">
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {service.price}dt
          </div>
        </div>
        
        {/* Service type indicator */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
            Premium Service
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-secondary transition-all duration-300">
          {service.name}
        </CardTitle>
        {service.description && (
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-1 text-sm font-medium">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-foreground">{service.duration} {t('serviceCard.minutes')}</span>
          </div>
          <div className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {service.price}dt
          </div>
        </div>

        {onBookClick && (
          <Button
            onClick={() => onBookClick(service)}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            variant="default"
          >
            {t('serviceCard.bookNow')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
