// Service Worker for Push Notifications
// Handles incoming push notifications and notification clicks

const CACHE_NAME = 'barber-booking-v1';
const NOTIFICATION_ICON = '/Luxury Brand Logo ADIB - Chic Monogram.png';
const NOTIFICATION_BADGE = '/favicon.ico';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        NOTIFICATION_ICON,
        NOTIFICATION_BADGE
      ]).catch((error) => {
        console.error('Service Worker: Cache addAll failed:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications (Mobile Optimized)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    console.warn('Service Worker: Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Service Worker: Push data:', data);

    // Mobile-optimized notification options (like Instagram/Messenger)
    const options = {
      body: data.body || 'New reservation request received',
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      
      // Mobile-specific optimizations
      vibrate: [300, 100, 300, 100, 300], // More noticeable vibration pattern
      silent: false,
      requireInteraction: false, // Allow auto-dismiss on mobile
      
      // Rich notification data
      data: {
        url: data.url || '/dashboard?tab=reservations',
        reservationId: data.reservationId,
        type: data.type || 'new_reservation',
        timestamp: Date.now(),
        clientName: data.clientName,
        barberName: data.barberName,
        services: data.services
      },
      
      // Mobile-friendly actions
      actions: [
        {
          action: 'view',
          title: '👀 View',
          icon: NOTIFICATION_ICON
        },
        {
          action: 'dismiss',
          title: '✖️ Dismiss',
          icon: NOTIFICATION_BADGE
        }
      ],
      
      // Notification behavior
      tag: `reservation-${data.reservationId || Date.now()}`, // Unique tag per reservation
      renotify: true,
      
      // Mobile display enhancements
      image: data.image || NOTIFICATION_ICON, // Large image for rich notifications
      
      // Urgency and priority (mobile-specific)
      urgency: 'high', // Ensures notification shows immediately
      
      // Custom styling for mobile
      dir: 'ltr',
      lang: 'en'
    };

    // Show notification with mobile-optimized title
    const title = data.title || '🆕 New Reservation - ADIB Barber Shop';
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
    
    // Log for debugging
    console.log('Service Worker: Mobile notification displayed:', title);
    
  } catch (error) {
    console.error('Service Worker: Error processing push event:', error);
    
    // Fallback notification for mobile
    event.waitUntil(
      self.registration.showNotification('🔔 ADIB Barber Shop', {
        body: 'You have a new reservation notification',
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
        vibrate: [300, 100, 300],
        data: { url: '/dashboard' },
        tag: 'fallback-notification',
        requireInteraction: false
      })
    );
  }
});

// Notification click event - Mobile optimized (like Instagram/Messenger)
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Mobile notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  
  // Handle dismiss action
  if (action === 'dismiss') {
    console.log('Service Worker: Notification dismissed by user');
    return;
  }

  // Determine target URL (mobile-optimized routing)
  let targetUrl = '/dashboard';
  
  if (action === 'view' || !action) {
    if (data.reservationId) {
      // Direct link to specific reservation (like Instagram message)
      targetUrl = `/dashboard?tab=reservations&highlight=${data.reservationId}&mobile=true`;
    } else if (data.type === 'new_reservation') {
      // Go to reservations tab
      targetUrl = '/dashboard?tab=reservations&mobile=true';
    } else if (data.url) {
      targetUrl = data.url;
    }
  }

  console.log('Service Worker: Opening mobile URL:', targetUrl);

  // Mobile-optimized window handling
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      
      // For mobile: prefer to focus existing app if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          console.log('Service Worker: Focusing existing mobile app');
          return client.focus().then(() => {
            // Send navigation message to existing app
            return client.postMessage({
              type: 'MOBILE_NAVIGATE',
              url: targetUrl,
              notificationData: data,
              timestamp: Date.now()
            });
          });
        }
      }
      
      // No existing window - open new one (mobile browser)
      console.log('Service Worker: Opening new mobile window');
      return clients.openWindow(targetUrl);
      
    }).catch((error) => {
      console.error('Service Worker: Mobile navigation error:', error);
      // Fallback for mobile
      return clients.openWindow('/dashboard');
    })
  );
  
  // Track notification interaction (for analytics)
  console.log('Service Worker: Mobile notification interaction tracked', {
    action: action || 'click',
    type: data.type,
    reservationId: data.reservationId,
    timestamp: Date.now()
  });
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline functionality (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Global error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('Service Worker: Script loaded successfully');