-- Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  payment_intent_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment_intent_id column to invoice_payments
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add RLS policies for payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to insert payment logs
CREATE POLICY insert_payment_logs ON payment_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow users to view their own payment logs
CREATE POLICY select_own_payment_logs ON payment_logs
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_payment_logs_invoice_id ON payment_logs(invoice_id);
CREATE INDEX idx_payment_logs_payment_intent_id ON payment_logs(payment_intent_id);
CREATE INDEX idx_invoice_payments_payment_intent_id ON invoice_payments(payment_intent_id);
