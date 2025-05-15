import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// In a real app, this would be an environment variable
const stripePublishableKey = 'pk_test_51NxSampleKeyForDemoPurposesOnly';

// Create a singleton to avoid loading Stripe multiple times
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};
