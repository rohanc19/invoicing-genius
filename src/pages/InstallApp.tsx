
import React, { useState, useEffect } from "react";
import { Download, Smartphone, Laptop, Info, ArrowLeft, Share2, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";

const InstallApp: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "windows" | "mac" | "other">("other");
  const [browser, setBrowser] = useState<"chrome" | "safari" | "edge" | "firefox" | "other">("other");

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(checkStandalone);
    
    // Detect device and browser type
    const ua = navigator.userAgent.toLowerCase();
    
    // Detect browser
    if (ua.indexOf('chrome') > -1 && ua.indexOf('edge') === -1 && ua.indexOf('edg') === -1) {
      setBrowser("chrome");
    } else if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) {
      setBrowser("safari");
    } else if (ua.indexOf('edge') > -1 || ua.indexOf('edg') > -1) {
      setBrowser("edge");
    } else if (ua.indexOf('firefox') > -1) {
      setBrowser("firefox");
    }
    
    // Detect device
    if (/android/.test(ua)) {
      setDeviceType("android");
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType("ios");
    } else if (/win/.test(ua)) {
      setDeviceType("windows");
    } else if (/mac/.test(ua)) {
      setDeviceType("mac");
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
      
      // Clear the saved prompt
      setDeferredPrompt(null);
      
      if (outcome === 'accepted') {
        toast({
          title: "Installation Successful",
          description: "The app was successfully installed on your device."
        });
      }
    } else {
      // Show manual installation instructions based on browser/platform
      toast({
        title: "Manual Installation Required",
        description: "Please follow the instructions shown below for your device."
      });
    }
  };

  const renderInstructions = () => {
    if (isStandalone) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Already Installed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Invoicing Genius is already installed on your device and running in standalone mode.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Tabs defaultValue={deviceType === "windows" || deviceType === "mac" ? "desktop" : "mobile"}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="mobile" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Installation
          </TabsTrigger>
          <TabsTrigger value="desktop" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Desktop Installation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mobile">
          {deviceType === "android" && (
            <Card>
              <CardHeader>
                <CardTitle>Install on Android</CardTitle>
                <CardDescription>Follow these steps to install on your Android device</CardDescription>
              </CardHeader>
              <CardContent>
                {browser === "chrome" && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">1</div>
                      <p>Tap the three dots menu <Menu className="h-4 w-4 inline" /> in the upper right corner of Chrome</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">2</div>
                      <p>Select "Add to Home Screen" or "Install App"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">3</div>
                      <p>Follow the on-screen prompts to complete installation</p>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleInstallClick} 
                      disabled={!deferredPrompt}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Install App Now
                    </Button>
                  </div>
                )}
                
                {browser !== "chrome" && (
                  <p>For the best installation experience, we recommend using Chrome on Android.</p>
                )}
              </CardContent>
            </Card>
          )}
          
          {deviceType === "ios" && (
            <Card>
              <CardHeader>
                <CardTitle>Install on iOS</CardTitle>
                <CardDescription>Follow these steps to install on your iPhone or iPad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">1</div>
                    <p>Tap the share icon <Share2 className="h-4 w-4 inline" /> at the bottom of your Safari browser</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">2</div>
                    <p>Scroll down and tap "Add to Home Screen" <Plus className="h-4 w-4 inline" /></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">3</div>
                    <p>Tap "Add" in the upper right corner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="desktop">
          <Card>
            <CardHeader>
              <CardTitle>Install on {deviceType === "windows" ? "Windows" : "Mac"}</CardTitle>
              <CardDescription>Follow these steps to install on your computer</CardDescription>
            </CardHeader>
            <CardContent>
              {(browser === "chrome" || browser === "edge") && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">1</div>
                    <p>Look for the install icon <Download className="h-4 w-4 inline" /> in the address bar (right side)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">2</div>
                    <p>Click the install icon and select "Install"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">3</div>
                    <p>The app will open in its own window and be added to your start menu/dock</p>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleInstallClick} 
                    disabled={!deferredPrompt}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App Now
                  </Button>
                </div>
              )}
              
              {browser === "safari" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">1</div>
                    <p>Safari on Mac doesn't fully support app installation yet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">2</div>
                    <p>For the best experience, we recommend using Chrome on Mac</p>
                  </div>
                </div>
              )}
              
              {browser === "firefox" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">1</div>
                    <p>Firefox doesn't fully support app installation yet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary rounded-full text-white h-7 w-7 flex items-center justify-center flex-shrink-0">2</div>
                    <p>For the best experience, we recommend using Chrome or Edge</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Install Invoicing Genius</h1>
          <p className="text-gray-600 mb-8">Get better performance, offline access, and a native app experience by installing Invoicing Genius on your device.</p>
          
          {renderInstructions()}
          
          <CardFooter className="mt-8 pt-4 border-t flex flex-col items-start">
            <h3 className="text-lg font-medium mb-2">Why Install?</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Access the app even when offline</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Faster loading times and better performance</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Launch from your home screen or dock with one tap</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Native app-like experience without app store requirements</span>
              </li>
            </ul>
          </CardFooter>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
