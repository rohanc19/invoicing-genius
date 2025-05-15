import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  DEFAULT_CURRENCY, 
  SUPPORTED_CURRENCIES, 
  fetchExchangeRates 
} from '@/utils/currencyUtils';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  supportedCurrencies: typeof SUPPORTED_CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(() => {
    // Get currency from localStorage or use default
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency || DEFAULT_CURRENCY;
  });
  
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch exchange rates on mount
  useEffect(() => {
    const getExchangeRates = async () => {
      try {
        setIsLoading(true);
        const rates = await fetchExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getExchangeRates();
    
    // Refresh exchange rates every hour
    const intervalId = setInterval(getExchangeRates, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Save currency preference to localStorage
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);
  
  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        exchangeRates, 
        isLoading,
        supportedCurrencies: SUPPORTED_CURRENCIES
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
