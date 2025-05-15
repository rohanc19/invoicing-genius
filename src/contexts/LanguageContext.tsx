import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguageState] = useState<string>(i18n.language || 'en');
  
  // Change language
  const setLanguage = async (lang: string) => {
    try {
      // Change i18n language
      await i18n.changeLanguage(lang);
      
      // Update state
      setLanguageState(lang);
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', lang);
      
      // If user is logged in, save to profile
      if (user) {
        await supabase
          .from('profiles')
          .update({ default_language: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };
  
  // Load user's preferred language from profile
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('default_language')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data && data.default_language && data.default_language !== language) {
          setLanguage(data.default_language);
        }
      } catch (error) {
        console.error('Error loading user language preference:', error);
      }
    };
    
    loadUserLanguage();
  }, [user]);
  
  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        supportedLanguages: SUPPORTED_LANGUAGES 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
