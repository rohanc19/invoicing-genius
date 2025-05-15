-- Add currency column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to estimates table
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to recurring_invoices table
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to profiles table for default currency
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';

-- Create exchange_rates table to cache exchange rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  rates JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for exchange_rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to select exchange rates
CREATE POLICY select_exchange_rates ON exchange_rates
  FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_exchange_rates_base_currency ON exchange_rates(base_currency);
CREATE INDEX idx_exchange_rates_updated_at ON exchange_rates(updated_at);
