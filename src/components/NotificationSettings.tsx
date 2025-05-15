import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Bell, BellOff, BellRing, Check, RefreshCw } from 'lucide-react';
import { 
  isNotificationsSupported, 
  isNotificationsEnabled, 
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification
} from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreferences {
  invoiceDue: boolean;
  paymentReceived: boolean;
  estimateAccepted: boolean;
  syncCompleted: boolean;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [notificationsSupported, setNotificationsSupported] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    invoiceDue: true,
    paymentReceived: true,
    estimateAccepted: true,
    syncCompleted: false,
  });

  // Check if notifications are supported and enabled
  useEffect(() => {
    const checkNotifications = async () => {
      setIsLoading(true);
      
      const supported = isNotificationsSupported();
      setNotificationsSupported(supported);
      
      if (supported) {
        const enabled = isNotificationsEnabled();
        setNotificationsEnabled(enabled);
        
        if (enabled && user) {
          await loadPreferences();
        }
      }
      
      setIsLoading(false);
    };
    
    checkNotifications();
  }, [user]);

  // Load notification preferences from the database
  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setPreferences({
          invoiceDue: data.invoice_due,
          paymentReceived: data.payment_received,
          estimateAccepted: data.estimate_accepted,
          syncCompleted: data.sync_completed,
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Save notification preferences to the database
  const savePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          invoice_due: preferences.invoiceDue,
          payment_received: preferences.paymentReceived,
          estimate_accepted: preferences.estimateAccepted,
          sync_completed: preferences.syncCompleted,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      
      toast({
        title: 'Error Saving Preferences',
        description: 'There was an error saving your notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Enable notifications
  const enableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Request permission
      const permissionGranted = await requestNotificationPermission();
      
      if (!permissionGranted) {
        toast({
          title: 'Permission Denied',
          description: 'You need to allow notifications in your browser settings.',
          variant: 'destructive',
        });
        return;
      }
      
      // Subscribe to push notifications
      const subscribed = await subscribeToPushNotifications();
      
      if (!subscribed) {
        throw new Error('Failed to subscribe to push notifications');
      }
      
      setNotificationsEnabled(true);
      
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive notifications for important events.',
      });
      
      // Save preferences
      await savePreferences();
    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      toast({
        title: 'Error Enabling Notifications',
        description: 'There was an error enabling notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disable notifications
  const disableNotifications = async () => {
    setIsLoading(true);
    
    try {
      // Unsubscribe from push notifications
      const unsubscribed = await unsubscribeFromPushNotifications();
      
      if (!unsubscribed) {
        throw new Error('Failed to unsubscribe from push notifications');
      }
      
      setNotificationsEnabled(false);
      
      toast({
        title: 'Notifications Disabled',
        description: 'You will no longer receive notifications.',
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      
      toast({
        title: 'Error Disabling Notifications',
        description: 'There was an error disabling notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test notifications
  const testNotification = async () => {
    const success = await sendTestNotification();
    
    if (!success) {
      toast({
        title: 'Test Failed',
        description: 'There was an error sending the test notification.',
        variant: 'destructive',
      });
    }
  };

  // Handle preference change
  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when you receive notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!notificationsSupported ? (
          <div className="flex items-center p-4 border rounded-md bg-amber-50 border-amber-200">
            <BellOff className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-amber-700">
              Your browser does not support notifications. Please use a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for important events
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={checked => checked ? enableNotifications() : disableNotifications()}
                disabled={isLoading}
              />
            </div>
            
            {notificationsEnabled && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Invoice Due Reminders</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when invoices are due soon
                        </p>
                      </div>
                      <Switch
                        checked={preferences.invoiceDue}
                        onCheckedChange={checked => handlePreferenceChange('invoiceDue', checked)}
                        disabled={isSaving}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Payment Received</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when you receive payments
                        </p>
                      </div>
                      <Switch
                        checked={preferences.paymentReceived}
                        onCheckedChange={checked => handlePreferenceChange('paymentReceived', checked)}
                        disabled={isSaving}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Estimate Accepted</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when clients accept estimates
                        </p>
                      </div>
                      <Switch
                        checked={preferences.estimateAccepted}
                        onCheckedChange={checked => handlePreferenceChange('estimateAccepted', checked)}
                        disabled={isSaving}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sync Completed</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified when data syncs between devices
                        </p>
                      </div>
                      <Switch
                        checked={preferences.syncCompleted}
                        onCheckedChange={checked => handlePreferenceChange('syncCompleted', checked)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotification}
                    className="flex items-center gap-2"
                  >
                    <BellRing className="h-4 w-4" />
                    Send Test Notification
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      
      {notificationsEnabled && (
        <CardFooter className="flex justify-end">
          <Button onClick={savePreferences} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default NotificationSettings;
