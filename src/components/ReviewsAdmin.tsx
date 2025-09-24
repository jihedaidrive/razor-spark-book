import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ReviewsAdmin: React.FC = () => {
  const { user } = useAuth();
  const { reviews, stats, clearAllReviews, deleteReview, refreshReviews } = useReviews();
  const [isClearing, setIsClearing] = useState(false);

  // Only show to admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleClearAllReviews = async () => {
    try {
      setIsClearing(true);
      await clearAllReviews();
      toast.success('All reviews have been cleared');
    } catch (error) {
      toast.error('Failed to clear reviews');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteReview = async (reviewId: string, clientName: string) => {
    try {
      await deleteReview(reviewId);
      toast.success(`Review by ${clientName} has been deleted`);
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleRefreshReviews = async () => {
    try {
      await refreshReviews();
      toast.success('Reviews refreshed');
    } catch (error) {
      toast.error('Failed to refresh reviews');
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Reviews Administration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.ratingDistribution[5]}</div>
            <div className="text-sm text-muted-foreground">5-Star Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {reviews.filter(r => !r.isVerified).length}
            </div>
            <div className="text-sm text-muted-foreground">Unverified</div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshReviews}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Reviews
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
                disabled={reviews.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Clear All Reviews
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Clear All Reviews
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all {stats.totalReviews} reviews from localStorage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllReviews}
                  disabled={isClearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isClearing ? 'Clearing...' : 'Clear All Reviews'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          <h4 className="font-semibold">Recent Reviews</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {reviews.slice(0, 10).map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.clientName}</span>
                    <div className="flex">
                      {Array.from({ length: review.rating }, (_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    {review.isVerified ? (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unverified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {review.comment}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                    {review.serviceName && <span>• {review.serviceName}</span>}
                    {review.barberName && <span>• {review.barberName}</span>}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the review by {review.clientName}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteReview(review.id, review.clientName)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Review
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewsAdmin;