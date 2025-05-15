import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  value, 
  onValueChange,
  className = ''
}) => {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  
  // Use context values if props are not provided
  const currentValue = value !== undefined ? value : currency;
  const handleChange = onValueChange || setCurrency;
  
  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className={`w-[120px] ${className}`}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {supportedCurrencies.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            <div className="flex items-center">
              <span className="mr-2">{curr.symbol}</span>
              <span>{curr.code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
