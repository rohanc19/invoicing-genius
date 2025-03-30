
import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface InstallButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const InstallButton: React.FC<InstallButtonProps> = ({ 
  className = "bg-green-600 hover:bg-green-700 text-white", 
  size = "default",
  variant = "default"
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      console.log("Install prompt captured and ready");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log("Install button clicked", { deferredPrompt });
    
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
    
    if (outcome === 'accepted') {
      toast({
        title: "Installation Successful",
        description: "The app was successfully installed on your device.",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstallClick}
      className={className}
    >
      <Download className="h-5 w-5 mr-2" />
      Install App
    </Button>
  );
};

export default InstallButton;
