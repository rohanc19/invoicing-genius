// Register the Electron-specific service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if we're in Electron
    const isElectron = window.electron || navigator.userAgent.indexOf('Electron') >= 0;
    
    if (isElectron) {
      // Use our Electron-specific service worker
      navigator.serviceWorker.register('./electron-service-worker.js')
        .then(registration => {
          console.log('Electron Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Electron Service Worker registration failed:', error);
        });
    } else {
      // Use the regular service worker for web
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('Web Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Web Service Worker registration failed:', error);
        });
    }
  });
}
