import { useState, useEffect } from 'react';
import { Review, ReviewStats } from '@/types';
import { reviewsApi } from '@/api/reviewsApi';

export const useReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load reviews and stats
    const loadReviews = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const [reviewsData, statsData] = await Promise.all([
                reviewsApi.getReviews(),
                reviewsApi.getReviewStats()
            ]);
            
            setReviews(reviewsData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    };

    // Submit a new review
    const submitReview = async (reviewData: {
        rating: number;
        comment: string;
        clientName: string;
        serviceId?: string;
        barberId?: string;
    }) => {
        try {
            const newReview = await reviewsApi.submitReview(reviewData);
            
            // Update local state
            setReviews(prev => [newReview, ...prev]);
            
            // Recalculate stats
            const updatedStats = await reviewsApi.getReviewStats();
            setStats(updatedStats);
            
            return newReview;
        } catch (err) {
            console.error('Failed to submit review:', err);
            throw new Error('Failed to submit review');
        }
    };

    // Delete a review
    const deleteReview = async (reviewId: string) => {
        try {
            await reviewsApi.deleteReview(reviewId);
            
            // Update local state
            setReviews(prev => prev.filter(review => review.id !== reviewId));
            
            // Recalculate stats
            const updatedStats = await reviewsApi.getReviewStats();
            setStats(updatedStats);
        } catch (err) {
            console.error('Failed to delete review:', err);
            throw new Error('Failed to delete review');
        }
    };

    // Clear all reviews
    const clearAllReviews = async () => {
        try {
            await reviewsApi.clearAllReviews();
            setReviews([]);
            setStats({
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            });
        } catch (err) {
            console.error('Failed to clear reviews:', err);
            throw new Error('Failed to clear reviews');
        }
    };

    // Load reviews on mount
    useEffect(() => {
        loadReviews();
    }, []);

    return {
        reviews,
        stats,
        isLoading,
        error,
        submitReview,
        deleteReview,
        clearAllReviews,
        refreshReviews: loadReviews
    };
};