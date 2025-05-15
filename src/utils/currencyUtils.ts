// List of supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
];

// Default currency
export const DEFAULT_CURRENCY = 'USD';

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currencyCode Currency code (e.g., 'USD')
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

/**
 * Get currency symbol for a currency code
 * @param currencyCode Currency code (e.g., 'USD')
 * @returns Currency symbol (e.g., '$')
 */
export const getCurrencySymbol = (currencyCode: string = DEFAULT_CURRENCY): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '$';
};

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param exchangeRates Exchange rates object
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Convert to USD first (as base currency)
  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / exchangeRates[fromCurrency];
  
  // Convert from USD to target currency
  return toCurrency === 'USD' 
    ? amountInUSD 
    : amountInUSD * exchangeRates[toCurrency];
};

/**
 * Fetch latest exchange rates from API
 * @returns Exchange rates with USD as base
 */
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    // In a real app, you would use a proper API like Open Exchange Rates or Fixer.io
    // For this demo, we'll use a mock response
    
    // Simulated API response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock exchange rates (USD as base)
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.52,
      JPY: 150.23,
      CNY: 7.24,
      INR: 83.12,
      BRL: 5.05,
      MXN: 16.73,
      SGD: 1.34,
      CHF: 0.90,
      NZD: 1.64,
      ZAR: 18.45,
      HKD: 7.82,
      SEK: 10.42,
      NOK: 10.58,
      DKK: 6.87,
      PLN: 3.94,
      RUB: 91.25,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return default rates in case of error
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      AUD: 1.52,
      JPY: 150.23,
      CNY: 7.24,
    };
  }
};
