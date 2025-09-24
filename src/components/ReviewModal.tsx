import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StarRating from './StarRating';
import { Star, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ReviewModalProps {
  children: React.ReactNode;
  onSubmitReview?: (review: {
    rating: number;
    comment: string;
    clientName: string;
  }) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ children, onSubmitReview }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      setClientName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error(t('reviews.selectRating'));
      return;
    }
    
    if (!comment.trim()) {
      toast.error(t('reviews.writeComment'));
      return;
    }
    
    if (!clientName.trim()) {
      toast.error(t('reviews.enterName'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmitReview) {
        await onSubmitReview({
          rating,
          comment: comment.trim(),
          clientName: clientName.trim()
        });
      }
      
      toast.success(t('reviews.thankYou'));
      setIsOpen(false);
      setRating(0);
      setComment('');
      if (!user) setClientName('');
    } catch (error) {
      toast.error(t('reviews.reviewFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    if (!user) setClientName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            {t('reviews.leaveReview')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>{t('reviews.yourRating')}</Label>
            <div className="flex items-center gap-2">
              <StarRating
                rating={rating}
                interactive
                onRatingChange={setRating}
                size="lg"
              />
              <span className="text-sm text-muted-foreground">
                {rating > 0 && `${rating} ${rating !== 1 ? t('reviews.stars') : t('reviews.star')}`}
              </span>
            </div>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="clientName">{t('reviews.yourName')}</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={t('forms.namePlaceholder')}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">{t('reviews.yourReview')}</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('reviews.reviewPlaceholder')}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                t('reviews.submitting')
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('reviews.submitReview')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;