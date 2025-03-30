
import React from "react";
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

  const handleInstallClick = () => {
    console.log("Manual install button clicked");
    
    // Check if running in standalone mode already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      toast({
        title: "Already Installed",
        description: "This app is already installed on your device.",
      });
      return;
    }
    
    // Show installation instructions based on browser
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isChrome = ua.indexOf('chrome') > -1;
    const isSafari = ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1;
    const isEdge = ua.indexOf('edge') > -1 || ua.indexOf('edg') > -1;
    
    let message = "";
    if (isMobile) {
      if (isSafari && /iphone|ipad|ipod/.test(ua)) {
        message = "Tap the share icon and select 'Add to Home Screen'";
      } else if (isChrome) {
        message = "Tap the menu button and select 'Add to Home Screen'";
      } else {
        message = "Use your browser's menu to add this app to your home screen";
      }
    } else {
      if (isChrome || isEdge) {
        message = "Click the install icon in the address bar or open the menu and select 'Install'";
      } else if (isSafari) {
        message = "Use Safari's File menu and select 'Add to Dock'";
      } else {
        message = "Use your browser's menu options to install this application";
      }
    }
    
    toast({
      title: "Install App",
      description: message,
    });
  };

  return (
    <div className="bg-primary text-white p-4 mb-8">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ReceiptText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Invoicing Genius</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Install App Button - Always visible */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInstallClick}
            className="bg-white text-primary hover:bg-gray-100"
          >
            <Download className="h-5 w-5 mr-2" />
            <span className="hidden md:inline">Install App</span>
          </Button>
          
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
