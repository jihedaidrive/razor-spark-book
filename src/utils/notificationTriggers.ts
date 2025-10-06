// Notification Triggers Utility
// Handles triggering push notifications for various booking events

import { Reservation } from '@/api/reservationsApi';
import { Service } from '@/api/servicesApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Trigger notification for new reservation
 */
export async function triggerNewReservationNotification(
  reservation: Reservation,
  services: Service[]
): Promise<void> {
  try {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) {
      console.warn('No auth token available for notification trigger');
      return;
    }

    // Prepare mobile-optimized notification payload (like Instagram)
    const serviceNames = services.map(s => s.name).join(', ');
    const notificationPayload = {
      type: 'new_reservation',
      title: '🆕 New Booking Request',
      body: `${reservation.clientName} wants to book ${serviceNames} with ${reservation.barberName} on ${formatDate(reservation.date)} at ${reservation.startTime}`,
      
      // Mobile-specific data
      reservationId: reservation._id || reservation.id,
      clientName: reservation.clientName,
      barberName: reservation.barberName,
      date: reservation.date,
      startTime: reservation.startTime,
      services: serviceNames,
      url: `/dashboard?tab=reservations&highlight=${reservation._id || reservation.id}&mobile=true`,
      
      // Rich notification data for mobile
      image: '/Luxury Brand Logo ADIB - Chic Monogram.png',
      icon: '/Luxury Brand Logo ADIB - Chic Monogram.png',
      badge: '/favicon.ico',
      
      // Mobile notification behavior
      tag: `new-reservation-${reservation._id || reservation.id}`,
      requireInteraction: false, // Allow auto-dismiss on mobile
      silent: false,
      vibrate: [300, 100, 300, 100, 300],
      
      // Urgency for mobile
      urgency: 'high'
    };

    // Send notification trigger to backend
    const response = await fetch(`${API_BASE_URL}/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!response.ok) {
      // If trigger endpoint doesn't exist, try the manual notification approach
      if (response.status === 404) {
        await sendManualNewReservationNotification(notificationPayload);
      } else {
        throw new Error(`Notification trigger failed: ${response.status}`);
      }
    }

    console.log('✅ New reservation notification triggered successfully');
  } catch (error) {
    console.error('❌ Failed to trigger new reservation notification:', error);
    throw error;
  }
}

/**
 * Trigger notification for reservation status change
 */
export async function triggerReservationStatusNotification(
  reservation: Reservation,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) {
      console.warn('No auth token available for notification trigger');
      return;
    }

    // Prepare status change notification
    const statusEmojis: Record<string, string> = {
      confirmed: '✅',
      cancelled: '❌',
      completed: '🎉',
      pending: '⏳'
    };

    const statusMessages: Record<string, string> = {
      confirmed: 'confirmed',
      cancelled: 'cancelled',
      completed: 'completed',
      pending: 'is now pending'
    };

    const emoji = statusEmojis[newStatus] || '📋';
    const message = statusMessages[newStatus] || `changed to ${newStatus}`;

    const notificationPayload = {
      type: 'status_change',
      title: `${emoji} Reservation ${message.charAt(0).toUpperCase() + message.slice(1)} - ADIB`,
      body: `${reservation.clientName}'s reservation with ${reservation.barberName} has been ${message}`,
      data: {
        reservationId: reservation._id || reservation.id,
        clientName: reservation.clientName,
        barberName: reservation.barberName,
        oldStatus,
        newStatus,
        url: `/dashboard?tab=reservations&highlight=${reservation._id || reservation.id}`
      }
    };

    // Send notification trigger to backend
    const response = await fetch(`${API_BASE_URL}/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!response.ok) {
      if (response.status === 404) {
        await sendManualStatusChangeNotification(notificationPayload);
      } else {
        throw new Error(`Status notification trigger failed: ${response.status}`);
      }
    }

    console.log('✅ Reservation status notification triggered successfully');
  } catch (error) {
    console.error('❌ Failed to trigger status change notification:', error);
    throw error;
  }
}

/**
 * Manual notification sending (fallback if backend doesn't have trigger endpoint)
 */
async function sendManualNewReservationNotification(payload: any): Promise<void> {
  try {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) return;

    // Use the existing test notification endpoint with custom payload
    const response = await fetch(`${API_BASE_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body
      })
    });

    if (!response.ok) {
      throw new Error(`Manual notification failed: ${response.status}`);
    }

    console.log('✅ Manual new reservation notification sent');
  } catch (error) {
    console.error('❌ Manual notification failed:', error);
    throw error;
  }
}

/**
 * Manual status change notification (fallback)
 */
async function sendManualStatusChangeNotification(payload: any): Promise<void> {
  try {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) return;

    const response = await fetch(`${API_BASE_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body
      })
    });

    if (!response.ok) {
      throw new Error(`Manual status notification failed: ${response.status}`);
    }

    console.log('✅ Manual status change notification sent');
  } catch (error) {
    console.error('❌ Manual status notification failed:', error);
    throw error;
  }
}

/**
 * Utility: Format date for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Check if user has admin role (for notification permissions)
 */
export function canTriggerNotifications(): boolean {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user.role === 'admin';
  } catch (error) {
    return false;
  }
}

/**
 * Debug function to test notification system
 */
export async function testNotificationSystem(): Promise<void> {
  console.log('🔍 Testing notification system...');
  
  try {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) {
      console.error('❌ No auth token found');
      return;
    }

    // Test with a mock reservation
    const mockReservation = {
      _id: 'test-123',
      id: 'test-123',
      clientName: 'Test Client',
      barberName: 'Test Barber',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      status: 'pending' as const
    };

    const mockServices = [
      { id: '1', name: 'Test Haircut', duration: 30, price: 25, isActive: true }
    ];

    await triggerNewReservationNotification(mockReservation, mockServices);
    console.log('✅ Test notification sent successfully');
  } catch (error) {
    console.error('❌ Test notification failed:', error);
  }
}

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testNotificationSystem = testNotificationSystem;
}