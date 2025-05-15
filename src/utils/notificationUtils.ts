import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Check if notifications are supported
export const isNotificationsSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if notifications are enabled
export const isNotificationsEnabled = (): boolean => {
  return Notification.permission === 'granted';
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    toast({
      title: 'Notifications Not Supported',
      description: 'Your browser does not support notifications.',
      variant: 'destructive',
    });
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) {
    return false;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // If already subscribed, return true
    if (subscription) {
      return true;
    }
    
    // Get public VAPID key from server
    const { data: { vapidPublicKey }, error } = await supabase.functions.invoke('get-vapid-key');
    
    if (error || !vapidPublicKey) {
      throw new Error('Failed to get VAPID key');
    }
    
    // Convert VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
    
    // Save subscription to server
    const { error: saveError } = await supabase.functions.invoke('save-push-subscription', {
      body: { subscription },
    });
    
    if (saveError) {
      throw saveError;
    }
    
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    return false;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get push subscription
    const subscription = await registration.pushManager.getSubscription();
    
    // If not subscribed, return true
    if (!subscription) {
      return true;
    }
    
    // Unsubscribe
    await subscription.unsubscribe();
    
    // Remove subscription from server
    const { error } = await supabase.functions.invoke('remove-push-subscription', {
      body: { endpoint: subscription.endpoint },
    });
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Send a test notification
export const sendTestNotification = async (): Promise<boolean> => {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) {
    toast({
      title: 'Notifications Not Enabled',
      description: 'Please enable notifications in your browser settings.',
      variant: 'destructive',
    });
    return false;
  }

  try {
    // Show a local notification
    const registration = await navigator.serviceWorker.ready;
    
    registration.showNotification('Invoicing Genius', {
      body: 'Notifications are working correctly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: [100, 50, 100],
      data: {
        type: 'test',
        url: window.location.origin,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Send notification for invoice due
export const sendInvoiceDueNotification = async (
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  dueDate: string,
  amount: number,
  currency: string
): Promise<boolean> => {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) {
    return false;
  }

  try {
    // Format amount
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
    
    // Show notification
    const registration = await navigator.serviceWorker.ready;
    
    registration.showNotification('Invoice Due Soon', {
      body: `Invoice #${invoiceNumber} for ${clientName} is due on ${dueDate} (${formattedAmount})`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `invoice-due-${invoiceId}`,
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100],
      data: {
        type: 'invoice-due',
        invoiceId,
        url: `${window.location.origin}/invoice/${invoiceId}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Invoice',
        },
        {
          action: 'remind-later',
          title: 'Remind Later',
        },
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Error sending invoice due notification:', error);
    return false;
  }
};

// Send notification for payment received
export const sendPaymentReceivedNotification = async (
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  currency: string
): Promise<boolean> => {
  if (!isNotificationsSupported() || !isNotificationsEnabled()) {
    return false;
  }

  try {
    // Format amount
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
    
    // Show notification
    const registration = await navigator.serviceWorker.ready;
    
    registration.showNotification('Payment Received', {
      body: `Payment of ${formattedAmount} received for Invoice #${invoiceNumber} from ${clientName}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `payment-received-${invoiceId}`,
      requireInteraction: false,
      vibrate: [100, 50, 100],
      data: {
        type: 'payment-received',
        invoiceId,
        url: `${window.location.origin}/invoice/${invoiceId}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Invoice',
        },
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Error sending payment received notification:', error);
    return false;
  }
};

// Helper function to convert base64 to Uint8Array
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};
