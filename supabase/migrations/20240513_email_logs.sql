-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT NOT NULL,
  data_json JSONB NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- Add RLS policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to insert email logs
CREATE POLICY insert_email_logs ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow users to view their own email logs
CREATE POLICY select_own_email_logs ON email_logs
  FOR SELECT
  USING (
    recipient IN (
      SELECT client_email FROM clients WHERE user_id = auth.uid()
    ) OR
    recipient = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
