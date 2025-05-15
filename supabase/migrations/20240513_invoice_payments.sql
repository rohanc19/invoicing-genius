-- Create invoice_payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own invoice payments
CREATE POLICY select_own_invoice_payments ON invoice_payments
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own invoice payments
CREATE POLICY insert_own_invoice_payments ON invoice_payments
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to update their own invoice payments
CREATE POLICY update_own_invoice_payments ON invoice_payments
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own invoice payments
CREATE POLICY delete_own_invoice_payments ON invoice_payments
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
