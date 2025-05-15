// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import webpush from "https://esm.sh/web-push@3.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:example@example.com";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { userId, title, body, icon, badge, tag, data, requireInteraction, actions } = await req.json();
    
    if (!userId || !title || !body) {
      throw new Error("Missing required parameters");
    }
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Set VAPID details
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    
    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);
    
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found for user" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Get user's notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (preferencesError && preferencesError.code !== 'PGRST116') {
      throw preferencesError;
    }
    
    // Check if notification type is enabled
    if (preferences && data && data.type) {
      const type = data.type;
      
      if (
        (type === 'invoice-due' && !preferences.invoice_due) ||
        (type === 'payment-received' && !preferences.payment_received) ||
        (type === 'estimate-accepted' && !preferences.estimate_accepted) ||
        (type === 'sync-completed' && !preferences.sync_completed)
      ) {
        return new Response(
          JSON.stringify({ message: "Notification type disabled by user" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
    }
    
    // Send push notification to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          };
          
          const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/icons/icon-192x192.png',
            badge: badge || '/icons/badge-72x72.png',
            tag,
            data,
            requireInteraction: requireInteraction || false,
            actions
          });
          
          await webpush.sendNotification(pushSubscription, payload);
          
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Error sending notification:', error);
          
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );
    
    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        title,
        body,
        data: data || {},
        sent_at: new Date().toISOString(),
        success_count: results.filter(r => r.success).length,
        failure_count: results.filter(r => !r.success).length
      });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        results
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
