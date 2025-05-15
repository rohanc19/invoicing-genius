// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from 'https://esm.sh/stripe@12.4.0?dts';

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "No signature provided" }),
      { status: 400 }
    );
  }
  
  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  const { metadata, amount, id } = paymentIntent;
  
  if (!metadata || !metadata.invoiceId) {
    console.error('No invoice ID in metadata');
    return;
  }
  
  const invoiceId = metadata.invoiceId;
  const paymentAmount = amount / 100; // Convert from cents
  
  try {
    // Record payment in the database
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        method: 'card',
        notes: `Stripe Payment (ID: ${id})`,
        payment_intent_id: id
      })
      .select()
      .single();
      
    if (paymentError) throw paymentError;
    
    // Check if invoice is fully paid
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Calculate total amount
    const { data: products, error: productsError } = await supabase
      .from('invoice_products')
      .select('*')
      .eq('invoice_id', invoiceId);
      
    if (productsError) throw productsError;
    
    let totalAmount = 0;
    for (const product of products || []) {
      const lineTotal = product.quantity * product.price;
      const lineTax = lineTotal * (product.tax / 100);
      const lineDiscount = lineTotal * (product.discount / 100);
      totalAmount += lineTotal + lineTax - lineDiscount;
    }
    
    // Fetch all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);
      
    if (paymentsError) throw paymentsError;
    
    // Calculate total paid
    const totalPaid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
    
    // Update invoice status if fully paid
    if (totalPaid >= totalAmount) {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId);
        
      if (updateError) throw updateError;
    }
    
    // Send payment receipt email
    if (invoice.client_email) {
      // Call the send-email function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invoice.client_email,
          templateId: 'payment_received',
          data: {
            invoiceNumber: invoice.invoice_number,
            amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(paymentAmount),
            date: new Date().toLocaleDateString(),
            businessName: invoice.your_company || 'Our Company',
            viewUrl: `${Deno.env.get("PUBLIC_URL") || ''}/client/invoice/${invoiceId}`
          }
        }
      });
      
      if (emailError) {
        console.error('Error sending payment receipt email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  const { metadata, id, last_payment_error } = paymentIntent;
  
  if (!metadata || !metadata.invoiceId) {
    console.error('No invoice ID in metadata');
    return;
  }
  
  const invoiceId = metadata.invoiceId;
  
  try {
    // Log the failed payment
    const { error } = await supabase
      .from('payment_logs')
      .insert({
        invoice_id: invoiceId,
        payment_intent_id: id,
        status: 'failed',
        error_message: last_payment_error?.message || 'Payment failed',
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // Notify the invoice owner
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, profiles(email)')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) throw invoiceError;
    
    if (invoice.profiles?.email) {
      // Call the send-email function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invoice.profiles.email,
          templateId: 'payment_failed',
          data: {
            invoiceNumber: invoice.invoice_number,
            clientName: invoice.client_name,
            errorMessage: last_payment_error?.message || 'Payment failed',
            viewUrl: `${Deno.env.get("PUBLIC_URL") || ''}/invoice/${invoiceId}`
          }
        }
      });
      
      if (emailError) {
        console.error('Error sending payment failure email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}
