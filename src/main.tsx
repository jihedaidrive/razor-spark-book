import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Register service worker for push notifications (Enhanced for production debugging)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    console.log('🔧 Attempting to register service worker...');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        console.log('SW Scope:', registration.scope);
        console.log('SW State:', registration.active?.state);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });
      })
      .catch((registrationError) => {
        console.error('❌ Service Worker registration failed:', registrationError);
        console.error('Error details:', {
          message: registrationError.message,
          stack: registrationError.stack,
          name: registrationError.name
        });
      });
  });
} else {
  console.log('🔧 Service Worker registration skipped:', {
    hasServiceWorker: 'serviceWorker' in navigator,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE
  });
}

createRoot(document.getElementById("root")!).render(<App />);
