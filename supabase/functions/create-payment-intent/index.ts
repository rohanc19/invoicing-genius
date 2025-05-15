// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from 'https://esm.sh/stripe@12.4.0?dts';

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { invoiceId, amount, currency, customerId, description, metadata } = await req.json();
    
    // Validate required fields
    if (!invoiceId || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch invoice details to verify the amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (invoiceError) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Calculate total amount from invoice products
    const { data: products, error: productsError } = await supabase
      .from('invoice_products')
      .select('*')
      .eq('invoice_id', invoiceId);
      
    if (productsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch invoice products" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    let totalAmount = 0;
    for (const product of products || []) {
      const lineTotal = product.quantity * product.price;
      const lineTax = lineTotal * (product.tax / 100);
      const lineDiscount = lineTotal * (product.discount / 100);
      totalAmount += lineTotal + lineTax - lineDiscount;
    }
    
    // Fetch existing payments
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId);
      
    if (paymentsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch existing payments" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Calculate remaining amount
    const paidAmount = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = totalAmount - paidAmount;
    
    // Verify the requested amount doesn't exceed the remaining amount
    if (amount > remainingAmount) {
      return new Response(
        JSON.stringify({ 
          error: "Payment amount exceeds the remaining invoice balance",
          remainingAmount
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description: description || `Payment for Invoice #${invoice.invoice_number}`,
      metadata: {
        invoiceId,
        ...metadata
      },
      ...(customerId && { customer: customerId })
    });
    
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
