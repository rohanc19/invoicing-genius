import { supabase } from "@/integrations/supabase/client";
import { getStripe } from "@/integrations/stripe/client";
import { toast } from "@/hooks/use-toast";

/**
 * Create a payment intent for an invoice
 * @param invoiceId Invoice ID
 * @param amount Payment amount
 * @param currency Currency code (e.g., 'USD')
 * @param metadata Additional metadata
 * @returns Client secret for the payment intent
 */
export const createPaymentIntent = async (
  invoiceId: string,
  amount: number,
  currency: string = 'USD',
  metadata: Record<string, any> = {}
): Promise<string | null> => {
  try {
    // Call Supabase Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        invoiceId,
        amount,
        currency,
        description: `Payment for Invoice`,
        metadata: {
          ...metadata
        }
      }
    });
    
    if (error) throw error;
    
    if (!data || !data.clientSecret) {
      throw new Error('Failed to create payment intent');
    }
    
    return data.clientSecret;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    toast({
      title: "Payment Error",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Process a payment using Stripe Elements
 * @param clientSecret Client secret from payment intent
 * @param elements Stripe Elements instance
 * @returns Success status and any error message
 */
export const processPayment = async (
  clientSecret: string,
  elements: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw submitError;
    }
    
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });
    
    if (confirmError) {
      throw confirmError;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return { 
      success: false, 
      error: error.message || 'Payment failed' 
    };
  }
};

/**
 * Check the status of a payment intent
 * @param clientSecret Client secret from payment intent
 * @returns Payment status
 */
export const checkPaymentStatus = async (
  clientSecret: string
): Promise<{ status: string; success: boolean }> => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }
    
    return {
      status: paymentIntent.status,
      success: paymentIntent.status === 'succeeded'
    };
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return { 
      status: 'error', 
      success: false 
    };
  }
};
