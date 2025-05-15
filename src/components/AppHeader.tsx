
import React from "react";
import { Link } from "react-router-dom";
import { ReceiptText, User, Settings, LogOut, Download, Moon, Sun, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSelector from "@/components/LanguageSelector";
import { toast } from "@/hooks/use-toast";

interface AppHeaderProps {
  userProfile?: {
    full_name?: string;
  } | null;
}

const AppHeader: React.FC<AppHeaderProps> = ({ userProfile }) => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency } = useCurrency();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="bg-primary text-white p-4 mb-8 dark:bg-gray-800">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-4 sm:mb-0">
          <ReceiptText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Invoicing Genius</h1>
        </Link>

        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end w-full sm:w-auto">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <CurrencySelector className="bg-primary/20 text-white border-primary/30 hover:bg-primary/30 dark:bg-gray-700/50 dark:border-gray-600" />

            <LanguageSelector className="bg-primary/20 text-white border-primary/30 hover:bg-primary/30 dark:bg-gray-700/50 dark:border-gray-600" />

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-white hover:text-white hover:bg-primary/80 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Install App Link - Made very prominent */}
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="bg-white text-primary hover:bg-gray-100 font-semibold order-first sm:order-none w-full sm:w-auto dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <Link to="/install-app" className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              <span>Install App</span>
            </Link>
          </Button>

          {user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white hover:text-white hover:bg-primary/80 dark:hover:bg-gray-700"
              >
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <span className="hidden md:inline">Settings</span>
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
                className="text-white hover:text-white hover:bg-primary/80 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
