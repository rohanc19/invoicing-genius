-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_due BOOLEAN DEFAULT TRUE,
  payment_received BOOLEAN DEFAULT TRUE,
  estimate_accepted BOOLEAN DEFAULT TRUE,
  sync_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0
);

-- Add RLS policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own push subscriptions
CREATE POLICY select_own_push_subscriptions ON push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own push subscriptions
CREATE POLICY insert_own_push_subscriptions ON push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own push subscriptions
CREATE POLICY update_own_push_subscriptions ON push_subscriptions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own push subscriptions
CREATE POLICY delete_own_push_subscriptions ON push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Add RLS policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own notification preferences
CREATE POLICY select_own_notification_preferences ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own notification preferences
CREATE POLICY insert_own_notification_preferences ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own notification preferences
CREATE POLICY update_own_notification_preferences ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Add RLS policies for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own notification logs
CREATE POLICY select_own_notification_logs ON notification_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
