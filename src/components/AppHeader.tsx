
import React from "react";
import { Link } from "react-router-dom";
import { ReceiptText, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  userProfile?: {
    full_name?: string;
  } | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ userProfile }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="bg-primary text-white p-4 mb-8">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ReceiptText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Invoicing Genius</h1>
        </Link>
        
        <div className="flex items-center gap-4">
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
