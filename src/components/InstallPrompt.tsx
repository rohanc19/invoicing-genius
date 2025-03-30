
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isAppInstalled) {
      return; // Don't show install prompt if already installed
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt regardless of outcome
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    // Log the outcome
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 max-w-sm border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-medium mb-1">Install Invoicing Genius</h3>
            <p className="text-sm text-gray-600 mb-3">
              Install this app on your device for offline access and a better experience.
            </p>
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
