import React, { useState, useEffect } from "react";
import { 
  PaymentElement, 
  useStripe, 
  useElements, 
  Elements 
} from "@stripe/react-stripe-js";
import { getStripe } from "@/integrations/stripe/client";
import { createPaymentIntent, processPayment } from "@/utils/paymentUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface StripePaymentFormProps {
  invoiceId: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Wrapper component that loads Stripe
export const StripePaymentWrapper: React.FC<StripePaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        const secret = await createPaymentIntent(props.invoiceId, props.amount);
        
        if (!secret) {
          throw new Error("Failed to initialize payment");
        }
        
        setClientSecret(secret);
      } catch (error: any) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePayment();
  }, [props.invoiceId, props.amount]);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mb-4" />
            <p className="font-medium">Failed to initialize payment</p>
            <p className="text-sm text-muted-foreground mt-2">Please try again later or contact support.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={props.onCancel}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#4f46e5',
      },
    },
  };
  
  return (
    <Elements stripe={getStripe()} options={options}>
      <StripePaymentForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
};

// Actual payment form component
const StripePaymentForm: React.FC<StripePaymentFormProps & { clientSecret: string }> = ({ 
  invoiceId, 
  amount, 
  clientSecret,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      const { success, error } = await processPayment(clientSecret, elements);
      
      if (success) {
        setIsComplete(true);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else if (error) {
        setErrorMessage(error);
        toast({
          title: "Payment Failed",
          description: error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred");
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-green-600">
            <CheckCircle2 className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-medium">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Thank you for your payment of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
            </p>
            <Button 
              className="mt-6"
              onClick={onSuccess}
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your payment of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement />
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {errorMessage}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          form="payment-form"
          type="submit"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StripePaymentWrapper;
