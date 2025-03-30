
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // At this point, the updated precached content has been fetched,
                  // but the previous service worker will still serve the older
                  // content until all client tabs are closed.
                  console.log('New content is available and will be used when all tabs for this page are closed.');
                  
                  // Show a notification to the user
                  toast({
                    title: 'Update Available',
                    description: 'A new version of the app is available. Please refresh to update.',
                    action: <ToastAction altText="Refresh Now" onClick={() => window.location.reload()}>Refresh Now</ToastAction>,
                    duration: 10000, // Show for 10 seconds
                  });
                } else {
                  // At this point, everything has been precached.
                  console.log('Content is cached for offline use.');
                  
                  // If this is the first install, let the user know the app is ready for offline use
                  toast({
                    title: 'App Ready for Offline Use',
                    description: 'This app has been installed on your device and is now available offline.',
                    duration: 5000,
                  });
                }
              }
            };
          };
          
          // Periodically check for updates (every 30 minutes)
          setInterval(() => {
            registration.update();
            console.log('Checking for service worker updates...');
          }, 30 * 60 * 1000);
        })
        .catch(error => {
          console.error('Error registering Service Worker:', error);
        });
        
      // Add support for handling offline/online events at the application level
      window.addEventListener('online', () => {
        console.log('Application is online');
      });
      
      window.addEventListener('offline', () => {
        console.log('Application is offline');
      });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Helper function to update service worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.update();
      })
      .catch(error => {
        console.error('Error updating Service Worker:', error);
      });
  }
}
