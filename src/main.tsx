
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { register } from './registerServiceWorker';
import OfflineNotice from './components/OfflineNotice';
import InstallPrompt from './components/InstallPrompt';

// Register the service worker for PWA support
register();

// Create a wrapper component to include the offline notice and install prompt
const AppWithOfflineSupport = () => (
  <React.StrictMode>
    <App />
    <OfflineNotice />
    <InstallPrompt />
  </React.StrictMode>
);

createRoot(document.getElementById("root")!).render(<AppWithOfflineSupport />);
