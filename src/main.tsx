
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { register } from './registerServiceWorker';
import OfflineNotice from './components/OfflineNotice';

// Register the service worker for PWA support
register();

// Create a wrapper component to include the offline notice
const AppWithOfflineSupport = () => (
  <React.StrictMode>
    <App />
    <OfflineNotice />
  </React.StrictMode>
);

createRoot(document.getElementById("root")!).render(<AppWithOfflineSupport />);
