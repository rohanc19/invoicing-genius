import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { checkPaymentStatus } from "@/utils/paymentUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
        const paymentIntentId = searchParams.get('payment_intent');
        
        if (!paymentIntentClientSecret || !paymentIntentId) {
          setStatus('error');
          return;
        }
        
        // Check payment status
        const { success } = await checkPaymentStatus(paymentIntentClientSecret);
        
        if (!success) {
          setStatus('error');
          return;
        }
        
        // Find the invoice associated with this payment
        if (user) {
          const { data: paymentData, error: paymentError } = await supabase
            .from('invoice_payments')
            .select('invoice_id')
            .eq('payment_intent_id', paymentIntentId)
            .single();
            
          if (paymentError || !paymentData) {
            // Try to find in payment logs
            const { data: logData, error: logError } = await supabase
              .from('payment_logs')
              .select('invoice_id')
              .eq('payment_intent_id', paymentIntentId)
              .single();
              
            if (!logError && logData) {
              setInvoiceId(logData.invoice_id);
              
              // Get invoice number
              const { data: invoiceData } = await supabase
                .from('invoices')
                .select('invoice_number')
                .eq('id', logData.invoice_id)
                .single();
                
              if (invoiceData) {
                setInvoiceNumber(invoiceData.invoice_number);
              }
            }
          } else {
            setInvoiceId(paymentData.invoice_id);
            
            // Get invoice number
            const { data: invoiceData } = await supabase
              .from('invoices')
              .select('invoice_number')
              .eq('id', paymentData.invoice_id)
              .single();
              
            if (invoiceData) {
              setInvoiceNumber(invoiceData.invoice_number);
            }
          }
        }
        
        setStatus('success');
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };
    
    verifyPayment();
  }, [searchParams, user]);
  
  const handleContinue = () => {
    if (invoiceId) {
      navigate(`/invoice/${invoiceId}`);
    } else {
      navigate('/invoices');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-medium mb-2">Verifying Payment</h2>
              <p className="text-sm text-muted-foreground">Please wait while we verify your payment...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-green-600">
              <CheckCircle2 className="h-16 w-16 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              {invoiceNumber ? (
                <p className="text-center text-muted-foreground mb-6">
                  Your payment for Invoice #{invoiceNumber} has been processed successfully.
                </p>
              ) : (
                <p className="text-center text-muted-foreground mb-6">
                  Your payment has been processed successfully.
                </p>
              )}
              <Button onClick={handleContinue} size="lg">
                Continue
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 text-destructive">
              <AlertCircle className="h-16 w-16 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payment Verification Failed</h2>
              <p className="text-center text-muted-foreground mb-6">
                We couldn't verify your payment. If you believe this is an error, please contact support.
              </p>
              <Button onClick={() => navigate('/invoices')} size="lg">
                Return to Invoices
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
