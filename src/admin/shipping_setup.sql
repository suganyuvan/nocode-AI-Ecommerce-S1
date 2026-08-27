-- SQL to run in Supabase SQL Editor to support dynamic shipping rules
-- This script creates the shipping_rules table and inserts sample data

-- 1. Create the `shipping_rules` table
CREATE TABLE IF NOT EXISTS shipping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_type TEXT NOT NULL CHECK (rule_type IN ('pincode', 'state', 'default')),
    rule_value TEXT NOT NULL, -- e.g. '560001' or 'Karnataka' or '*'
    prepaid_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cod_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_cod_allowed BOOLEAN NOT NULL DEFAULT true,
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10, 2),
    priority INT NOT NULL DEFAULT 0, -- Higher number = higher priority
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;

-- Allow public read access to shipping rules (needed for checkout)
CREATE POLICY "Allow public read on shipping_rules" 
ON shipping_rules FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Allow authenticated full access on shipping_rules" 
ON shipping_rules FOR ALL 
TO authenticated 
USING (true);


-- 2. Insert Default Sample Data
-- Priority 0: Default Pan-India (Fallback)
INSERT INTO shipping_rules (rule_type, rule_value, prepaid_charge, cod_charge, is_cod_allowed, priority)
VALUES ('default', '*', 200.00, 350.00, true, 0);

-- Priority 1: State Specific (e.g. Karnataka is cheaper because warehouse is there)
INSERT INTO shipping_rules (rule_type, rule_value, prepaid_charge, cod_charge, is_cod_allowed, priority)
VALUES ('state', 'Karnataka', 100.00, 200.00, true, 10);

-- Priority 2: Pincode Specific (e.g. 560001 - CBD area, very fast/cheap)
INSERT INTO shipping_rules (rule_type, rule_value, prepaid_charge, cod_charge, is_cod_allowed, priority)
VALUES ('pincode', '560001', 50.00, 100.00, true, 20);

-- Priority 2: Remote Pincode (e.g. 793001 - Meghalaya, no COD allowed)
INSERT INTO shipping_rules (rule_type, rule_value, prepaid_charge, cod_charge, is_cod_allowed, priority)
VALUES ('pincode', '793001', 500.00, 0.00, false, 20);
