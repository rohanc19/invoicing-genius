
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, User, Settings, LogOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface AppHeaderProps {
  userProfile?: {
    full_name?: string;
  } | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ userProfile }) => {
  const { user, signOut } = useAuth();
  // Force showing the install button in development for testing
  const [showInstallButton, setShowInstallButton] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isAppInstalled) {
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the beforeinstallprompt event
      toast({
        title: "Installation",
        description: "To install, use your browser's 'Add to Home Screen' or 'Install' option in the menu.",
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt regardless of outcome
    setDeferredPrompt(null);
    setShowInstallButton(false);
    
    if (outcome === 'accepted') {
      toast({
        title: "Installation Successful",
        description: "The app was successfully installed on your device.",
      });
    }
  };

  return (
    <div className="bg-primary text-white p-4 mb-8">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ReceiptText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Invoicing Genius</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {showInstallButton && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInstallClick}
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white hover:text-white hover:bg-primary/80"
          >
            <Link to="/profile" className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span className="hidden md:inline">Profile Settings</span>
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="text-sm hidden md:inline">{userProfile?.full_name || user?.email}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-white hover:text-white hover:bg-primary/80"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
