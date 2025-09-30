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

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (!event.data) {
    console.warn('Service Worker: Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Service Worker: Push data:', data);

    const options = {
      body: data.body || 'New notification from ADIB Barber Shop',
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        reservationId: data.reservationId,
        type: data.type || 'general',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ],
      requireInteraction: true,
      silent: false,
      tag: data.tag || 'barber-notification',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'ADIB Barber Shop',
        options
      )
    );
  } catch (error) {
    console.error('Service Worker: Error processing push event:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('ADIB Barber Shop', {
        body: 'You have a new notification',
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
        data: { url: '/' }
      })
    );
  }
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'dismiss') {
    console.log('Service Worker: Notification dismissed');
    return;
  }

  // Determine target URL based on notification type and action
  let targetUrl = '/';
  
  if (action === 'view' || !action) {
    if (data.url) {
      targetUrl = data.url;
    } else if (data.reservationId) {
      targetUrl = `/dashboard?tab=reservations&highlight=${data.reservationId}`;
    } else if (data.type === 'reservation') {
      targetUrl = '/dashboard?tab=reservations';
    } else {
      targetUrl = '/dashboard';
    }
  }

  console.log('Service Worker: Opening URL:', targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus existing window and navigate
          return client.focus().then(() => {
            return client.postMessage({
              type: 'NAVIGATE',
              url: targetUrl,
              notificationData: data
            });
          });
        }
      }
      
      // No existing window, open new one
      return clients.openWindow(targetUrl);
    }).catch((error) => {
      console.error('Service Worker: Error handling notification click:', error);
      // Fallback: try to open new window
      return clients.openWindow(targetUrl);
    })
  );
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