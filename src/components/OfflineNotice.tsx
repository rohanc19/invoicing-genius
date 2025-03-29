
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg flex items-center z-50">
      <AlertTriangle className="mr-2 h-5 w-5" />
      <span>You are currently offline. Some features may be limited.</span>
    </div>
  );
};

export default OfflineNotice;
