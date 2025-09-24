import { Review, ReviewStats } from '@/types';

const REVIEWS_STORAGE_KEY = 'barber_shop_reviews';
const INITIAL_REVIEWS_KEY = 'barber_shop_initial_reviews_loaded';

export const reviewsApi = {
    // Get all reviews from localStorage
    getReviews: async (): Promise<Review[]> => {
        try {
            // Initialize with mock data if first time
            if (!localStorage.getItem(INITIAL_REVIEWS_KEY)) {
                const mockReviews = getMockReviews();
                localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(mockReviews));
                localStorage.setItem(INITIAL_REVIEWS_KEY, 'true');
                return mockReviews;
            }

            const storedReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
            if (storedReviews) {
                return JSON.parse(storedReviews);
            }
            
            return getMockReviews();
        } catch (error) {
            console.error('Failed to fetch reviews from localStorage:', error);
            return getMockReviews();
        }
    },

    // Get review statistics
    getReviewStats: async (): Promise<ReviewStats> => {
        try {
            const reviews = await reviewsApi.getReviews();
            return calculateStats(reviews);
        } catch (error) {
            console.error('Failed to calculate review stats:', error);
            return getMockStats();
        }
    },

    // Submit a new review
    submitReview: async (reviewData: {
        rating: number;
        comment: string;
        clientName: string;
        serviceId?: string;
        barberId?: string;
    }): Promise<Review> => {
        try {
            const existingReviews = await reviewsApi.getReviews();
            
            const newReview: Review = {
                id: Date.now().toString(),
                ...reviewData,
                date: new Date().toISOString(),
                isVerified: false // New reviews are not verified by default
            };

            const updatedReviews = [newReview, ...existingReviews];
            localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updatedReviews));
            
            return newReview;
        } catch (error) {
            console.error('Failed to submit review:', error);
            throw new Error('Failed to submit review');
        }
    },

    // Get reviews for a specific service
    getServiceReviews: async (serviceId: string): Promise<Review[]> => {
        try {
            const allReviews = await reviewsApi.getReviews();
            return allReviews.filter(review => review.serviceId === serviceId);
        } catch (error) {
            console.error('Failed to fetch service reviews:', error);
            return [];
        }
    },

    // Get reviews for a specific barber
    getBarberReviews: async (barberId: string): Promise<Review[]> => {
        try {
            const allReviews = await reviewsApi.getReviews();
            return allReviews.filter(review => review.barberId === barberId);
        } catch (error) {
            console.error('Failed to fetch barber reviews:', error);
            return [];
        }
    },

    // Delete a review (for admin purposes)
    deleteReview: async (reviewId: string): Promise<void> => {
        try {
            const existingReviews = await reviewsApi.getReviews();
            const updatedReviews = existingReviews.filter(review => review.id !== reviewId);
            localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updatedReviews));
        } catch (error) {
            console.error('Failed to delete review:', error);
            throw new Error('Failed to delete review');
        }
    },

    // Clear all reviews (for testing purposes)
    clearAllReviews: async (): Promise<void> => {
        try {
            localStorage.removeItem(REVIEWS_STORAGE_KEY);
            localStorage.removeItem(INITIAL_REVIEWS_KEY);
        } catch (error) {
            console.error('Failed to clear reviews:', error);
        }
    }
};

// Helper function to calculate stats from reviews
function calculateStats(reviews: Review[]): ReviewStats {
    if (reviews.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = reviews.reduce((acc, review) => {
        acc[review.rating as keyof typeof acc]++;
        return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution
    };
}

// Mock data functions
function getMockReviews(): Review[] {
    return [
        {
            id: '1',
            clientName: 'Ahmed Ben Ali',
            rating: 5,
            comment: 'Excellent service! The barber was very professional and gave me exactly the haircut I wanted. The atmosphere is great and the staff is friendly.',
            date: '2024-01-15',
            serviceName: 'Premium Haircut',
            barberName: 'Mohamed',
            isVerified: true
        },
        {
            id: '2',
            clientName: 'Youssef Mansouri',
            rating: 5,
            comment: 'Best barber shop in town! Clean, modern, and the attention to detail is amazing. Highly recommend!',
            date: '2024-01-12',
            serviceName: 'Beard Trim',
            barberName: 'Karim',
            isVerified: true
        },
        {
            id: '3',
            clientName: 'Omar Trabelsi',
            rating: 4,
            comment: 'Great experience overall. The haircut was good and the price is reasonable. Will definitely come back.',
            date: '2024-01-10',
            serviceName: 'Classic Haircut',
            isVerified: false
        },
        {
            id: '4',
            clientName: 'Sami Bouazizi',
            rating: 5,
            comment: 'Amazing service! The barber took time to understand what I wanted and delivered perfectly. The shop is very clean and modern.',
            date: '2024-01-08',
            serviceName: 'Hair Treatment',
            barberName: 'Ali',
            isVerified: true
        },
        {
            id: '5',
            clientName: 'Nabil Khelifi',
            rating: 5,
            comment: 'Professional service, great atmosphere, and excellent results. This is now my go-to barber shop!',
            date: '2024-01-05',
            serviceName: 'Premium Haircut',
            barberName: 'Mohamed',
            isVerified: true
        },
        {
            id: '6',
            clientName: 'Karim Sassi',
            rating: 5,
            comment: 'Outstanding experience! The attention to detail is incredible and the final result exceeded my expectations.',
            date: '2024-01-03',
            serviceName: 'Beard Styling',
            barberName: 'Karim',
            isVerified: true
        },
        {
            id: '7',
            clientName: 'Mehdi Gharbi',
            rating: 4,
            comment: 'Very good service and friendly staff. The haircut was exactly what I asked for. Will come back!',
            date: '2024-01-01',
            serviceName: 'Classic Haircut',
            barberName: 'Ali',
            isVerified: false
        }
    ];
}

function getMockStats(): ReviewStats {
    const reviews = getMockReviews();
    return calculateStats(reviews);
}