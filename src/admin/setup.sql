-- SQL to run in Supabase SQL Editor to support the Admin Dashboard

-- 1. Create a `leads` table for newsletter subscriptions
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'subscribed',
    source TEXT DEFAULT 'newsletter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a lead (e.g. from the website)
CREATE POLICY "Allow public insert on leads" 
ON leads FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow authenticated users (admin) to read leads
CREATE POLICY "Allow authenticated read on leads" 
ON leads FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users (admin) to update leads
CREATE POLICY "Allow authenticated update on leads" 
ON leads FOR UPDATE 
TO authenticated 
USING (true);

-- Allow authenticated users (admin) to delete leads
CREATE POLICY "Allow authenticated delete on leads" 
ON leads FOR DELETE 
TO authenticated 
USING (true);

-- Note: In a production app, you would likely want to restrict `authenticated` 
-- specifically to an `admin` role or check against a `profiles.role` column, 
-- but this basic policy works assuming only admins are logging into this Supabase project.

-- 2. Ensure `orders` table exists (if not already created)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'INR',
    payment_status TEXT DEFAULT 'unpaid',
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Ensure appropriate RLS policies for `orders` similarly.
