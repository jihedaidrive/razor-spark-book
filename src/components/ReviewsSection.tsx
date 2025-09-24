import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewModal from './ReviewModal';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useReviews } from '@/hooks/useReviews';

interface ReviewsSectionProps {
    className?: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ className }) => {
    const { t } = useTranslation();
    const { reviews, stats, isLoading, submitReview } = useReviews();
    const [showAllReviews, setShowAllReviews] = useState(false);

    const handleSubmitReview = async (reviewData: {
        rating: number;
        comment: string;
        clientName: string;
    }) => {
        try {
            await submitReview(reviewData);
        } catch (error) {
            console.error('Failed to submit review:', error);
            throw error; // Re-throw to let the modal handle the error
        }
    };

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

    // Show loading state
    if (isLoading) {
        return (
            <section className={cn('py-12 sm:py-24 bg-muted/5', className)}>
                <div className="space-y-8 sm:space-y-16">
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                            {t('reviews.title')}
                        </h2>
                        <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
                            {t('reviews.subtitle')}
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={cn('py-12 sm:py-24 bg-muted/5', className)}>
            <div className="space-y-8 sm:space-y-16">
                {/* Info Banner - Remove in production */}

                {/* Header */}
                <div className="text-center">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                        {t('reviews.title')}
                    </h2>
                    <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
                        {t('reviews.subtitle')}
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                    <Card className="mobile-card">
                        <CardContent className="mobile-card-content text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 mr-2" />
                                <span className="text-3xl font-bold">{stats.averageRating}</span>
                            </div>
                            <StarRating rating={stats.averageRating} className="justify-center mb-2" />
                            <p className="text-sm text-muted-foreground">{t('reviews.averageRating')}</p>
                        </CardContent>
                    </Card>

                    <Card className="mobile-card">
                        <CardContent className="mobile-card-content text-center">
                            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="text-3xl font-bold mb-2">{stats.totalReviews}</div>
                            <p className="text-sm text-muted-foreground">{t('reviews.totalReviews')}</p>
                        </CardContent>
                    </Card>

                    <Card className="mobile-card">
                        <CardContent className="mobile-card-content text-center">
                            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold mb-2">
                                {Math.round((stats.ratingDistribution[5] / stats.totalReviews) * 100)}%
                            </div>
                            <p className="text-sm text-muted-foreground">{t('reviews.fiveStarReviews')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Rating Distribution */}
                <Card className="max-w-2xl mx-auto">
                    <CardContent className="mobile-card-content">
                        <h3 className="font-semibold mb-4 text-center">{t('reviews.ratingDistribution')}</h3>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-16">
                                            <span className="text-sm">{rating}</span>
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        </div>
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews Grid */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {displayedReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>

                    {/* Show More/Less Button */}
                    {reviews.length > 3 && (
                        <div className="text-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="mobile-btn"
                            >
                                {showAllReviews ? t('reviews.showLess') : `${t('reviews.showAll')} ${reviews.length} ${t('reviews.totalReviews')}`}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Add Review CTA */}
                <Card className="mobile-card max-w-md mx-auto">
                    <CardContent className="mobile-card-content text-center">
                        <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('reviews.shareExperience')}</h3>
                        <p className="text-muted-foreground mb-4 text-sm">
                            {t('reviews.shareExperienceDesc')}
                        </p>
                        <ReviewModal onSubmitReview={handleSubmitReview}>
                            <Button className="mobile-btn w-full">
                                <Star className="w-4 h-4 mr-2" />
                                {t('reviews.writeReview')}
                            </Button>
                        </ReviewModal>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};

export default ReviewsSection;