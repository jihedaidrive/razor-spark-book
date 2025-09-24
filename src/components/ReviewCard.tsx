import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from './StarRating';
import { Review } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ReviewCardProps {
  review: Review;
  className?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  const { t } = useTranslation();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={cn('mobile-card hover:shadow-md transition-all duration-200', className)}>
      <CardContent className="mobile-card-content">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{review.clientName}</h4>
                {review.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('reviews.verified')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(review.date)}</p>
            </div>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>

        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          "{review.comment}"
        </p>

        {(review.serviceName || review.barberName) && (
          <div className="flex flex-wrap gap-2">
            {review.serviceName && (
              <Badge variant="outline" className="text-xs">
                {review.serviceName}
              </Badge>
            )}
            {review.barberName && (
              <Badge variant="outline" className="text-xs">
                {review.barberName}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;