-- Create client_users table to link clients with auth users
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- Create client_access table to track which invoices a client can access
CREATE TABLE IF NOT EXISTS client_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_one_document CHECK (
    (invoice_id IS NOT NULL AND estimate_id IS NULL) OR
    (invoice_id IS NULL AND estimate_id IS NOT NULL)
  )
);

-- Add RLS policies for client_users
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own client_users
CREATE POLICY select_own_client_users ON client_users
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

-- Policy to allow users to insert their own client_users
CREATE POLICY insert_own_client_users ON client_users
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own client_users
CREATE POLICY delete_own_client_users ON client_users
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for client_access
ALTER TABLE client_access ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own client_access
CREATE POLICY select_own_client_access ON client_access
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    ) OR
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to insert their own client_access
CREATE POLICY insert_own_client_access ON client_access
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Policy to allow users to delete their own client_access
CREATE POLICY delete_own_client_access ON client_access
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Add policy for clients to view their own invoices
CREATE POLICY client_view_own_invoices ON invoices
  FOR SELECT
  USING (
    id IN (
      SELECT invoice_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for clients to view their own estimates
CREATE POLICY client_view_own_estimates ON estimates
  FOR SELECT
  USING (
    id IN (
      SELECT estimate_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for clients to view invoice products
CREATE POLICY client_view_invoice_products ON invoice_products
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT invoice_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for clients to view estimate products
CREATE POLICY client_view_estimate_products ON estimate_products
  FOR SELECT
  USING (
    estimate_id IN (
      SELECT estimate_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for clients to add payments to their invoices
CREATE POLICY client_add_payments ON invoice_payments
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT invoice_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Add policy for clients to view their payments
CREATE POLICY client_view_payments ON invoice_payments
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT invoice_id FROM client_access WHERE client_id IN (
        SELECT client_id FROM client_users WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_client_users_client_id ON client_users(client_id);
CREATE INDEX idx_client_users_user_id ON client_users(user_id);
CREATE INDEX idx_client_access_client_id ON client_access(client_id);
CREATE INDEX idx_client_access_invoice_id ON client_access(invoice_id);
CREATE INDEX idx_client_access_estimate_id ON client_access(estimate_id);
