
import React, { useEffect, useState } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    const checkIfInstalled = window.matchMedia('(display-mode: standalone)').matches;
    setIsAppInstalled(checkIfInstalled);
    
    if (checkIfInstalled) {
      return; // Don't show install prompt if already installed
    }

    // Check if running on Windows
    const userAgent = navigator.userAgent.toLowerCase();
    setIsWindows(userAgent.includes('windows'));

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

  const handleWindowsInstall = () => {
    // Guide users through PWA installation on Windows
    const domain = window.location.hostname;
    const installSteps = [
      `1. Click the "..." or Settings menu in your browser`,
      `2. Select "Apps" or "Install this site as an app"`,
      `3. Follow the browser prompts to complete installation`
    ];
    
    alert(`To install on Windows:\n${installSteps.join('\n')}`);
  };

  if (isAppInstalled || !showPrompt) {
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
            
            <Tabs defaultValue={isWindows ? "windows" : "mobile"} className="w-full">
              <TabsList className="w-full mb-2">
                <TabsTrigger value="mobile" className="flex-1">
                  <MonitorSmartphone className="w-4 h-4 mr-1" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="windows" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Windows
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="mobile">
                <Button 
                  size="sm" 
                  onClick={handleInstallClick}
                  className="w-full"
                  disabled={!deferredPrompt}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install on Device
                </Button>
                {!deferredPrompt && (
                  <p className="text-xs text-gray-500 mt-1">
                    For Android: Please use Chrome browser to install.
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="windows">
                <Button 
                  size="sm" 
                  onClick={handleWindowsInstall}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install on Windows
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Works best with Chrome or Edge browsers.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstallPrompt;
