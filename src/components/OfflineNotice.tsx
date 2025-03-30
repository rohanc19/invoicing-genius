
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online",
        description: "Connected to the internet. All features are now available.",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Working in offline mode. Some features may be limited.",
        variant: "destructive", 
      });
    };

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
      <WifiOff className="mr-2 h-5 w-5" />
      <div>
        <p className="font-medium">You are currently offline</p>
        <p className="text-sm">You can still view cached data and create drafts</p>
      </div>
    </div>
  );
};

export default OfflineNotice;
