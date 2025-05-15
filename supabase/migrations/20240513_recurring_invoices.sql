-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE,
  next_date DATE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  your_company TEXT,
  your_email TEXT,
  your_address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring_invoice_products table
CREATE TABLE IF NOT EXISTS recurring_invoice_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_invoice_id UUID NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0
);

-- Add RLS policies for recurring_invoices
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own recurring invoices
CREATE POLICY select_own_recurring_invoices ON recurring_invoices
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy to allow users to insert their own recurring invoices
CREATE POLICY insert_own_recurring_invoices ON recurring_invoices
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to update their own recurring invoices
CREATE POLICY update_own_recurring_invoices ON recurring_invoices
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own recurring invoices
CREATE POLICY delete_own_recurring_invoices ON recurring_invoices
  FOR DELETE
  USING (user_id = auth.uid());

-- Add RLS policies for recurring_invoice_products
ALTER TABLE recurring_invoice_products ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own recurring invoice products
CREATE POLICY select_own_recurring_invoice_products ON recurring_invoice_products
  FOR SELECT
  USING (
    recurring_invoice_id IN (
      SELECT id FROM recurring_invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own recurring invoice products
CREATE POLICY insert_own_recurring_invoice_products ON recurring_invoice_products
  FOR INSERT
  WITH CHECK (
    recurring_invoice_id IN (
      SELECT id FROM recurring_invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to update their own recurring invoice products
CREATE POLICY update_own_recurring_invoice_products ON recurring_invoice_products
  FOR UPDATE
  USING (
    recurring_invoice_id IN (
      SELECT id FROM recurring_invoices WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own recurring invoice products
CREATE POLICY delete_own_recurring_invoice_products ON recurring_invoice_products
  FOR DELETE
  USING (
    recurring_invoice_id IN (
      SELECT id FROM recurring_invoices WHERE user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX idx_recurring_invoices_next_date ON recurring_invoices(next_date);
CREATE INDEX idx_recurring_invoice_products_recurring_invoice_id ON recurring_invoice_products(recurring_invoice_id);
