import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  value, 
  onValueChange,
  className = ''
}) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  
  // Use context values if props are not provided
  const currentValue = value !== undefined ? value : language;
  const handleChange = onValueChange || setLanguage;
  
  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className={`w-[120px] ${className}`}>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center">
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
