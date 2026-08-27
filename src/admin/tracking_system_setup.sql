-- SQL DDL setup script for Order & Lead Tracking System in Supabase

-- Add tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_name TEXT DEFAULT 'BlueDart Express',
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispatch_date TIMESTAMP WITH TIME ZONE;

-- Ensure leads table supports processing status and columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for fast tracking lookup
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
