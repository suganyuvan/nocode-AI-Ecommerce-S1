-- SQL Setup script for Backend-Enforced Coupon System in Supabase

-- 1. Create `coupons` table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_discount_amount NUMERIC(10, 2),
    min_cart_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_usage_count INT NOT NULL DEFAULT 0,
    max_usage_count INT,
    max_usage_per_customer INT NOT NULL DEFAULT 1,
    current_usage_count INT NOT NULL DEFAULT 0,
    customer_order_eligibility TEXT NOT NULL DEFAULT 'all' CHECK (customer_order_eligibility IN ('all', 'first_order_only', 'repeat_orders_only', 'custom_range')),
    min_previous_orders INT DEFAULT 0,
    max_previous_orders INT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create `coupon_usages` table for per-customer redemption tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    order_id TEXT,
    discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupon_usages_email ON coupon_usages(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for `coupons`
CREATE POLICY "Allow public read active coupons"
ON coupons FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated manage coupons"
ON coupons FOR ALL
TO authenticated
USING (true);

-- RLS Policies for `coupon_usages`
CREATE POLICY "Allow public read coupon_usages"
ON coupon_usages FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert coupon_usages"
ON coupon_usages FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated manage coupon_usages"
ON coupon_usages FOR ALL
TO authenticated
USING (true);

-- 3. Atomic Usage Increment Function
CREATE OR REPLACE FUNCTION record_coupon_redemption(
    p_coupon_id UUID,
    p_coupon_code TEXT,
    p_customer_email TEXT,
    p_order_id TEXT,
    p_discount_applied NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- Increment total usage count in coupons table
    UPDATE coupons 
    SET current_usage_count = current_usage_count + 1,
        updated_at = NOW()
    WHERE id = p_coupon_id;

    -- Insert redemption record into coupon_usages
    INSERT INTO coupon_usages (coupon_id, coupon_code, customer_email, order_id, discount_applied, used_at)
    VALUES (p_coupon_id, UPPER(p_coupon_code), LOWER(p_customer_email), p_order_id, p_discount_applied, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Initial Sample Coupons
INSERT INTO coupons (
    code, description, discount_type, discount_value, max_discount_amount, 
    min_cart_amount, min_usage_count, max_usage_count, max_usage_per_customer, 
    customer_order_eligibility, start_date, expiry_date, is_active
) VALUES 
(
    'WELCOME10', 
    '10% Welcome discount for first-time woodcraft collectors', 
    'percentage', 10, 5000, 
    1000, 0, 500, 1, 
    'first_order_only', NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', true
),
(
    'REPEAT15', 
    '15% Loyalty appreciation discount for repeat customers', 
    'percentage', 15, 7500, 
    2000, 0, 200, 2, 
    'repeat_orders_only', NOW() - INTERVAL '1 day', NOW() + INTERVAL '180 days', true
),
(
    'FESTIVE500', 
    'Flat ₹500 discount on royal wooden panel orders above ₹3,000', 
    'fixed', 500, NULL, 
    3000, 0, 100, 1, 
    'all', NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', true
),
(
    'SUPERVIP', 
    'Exclusive 20% discount for customers with 3+ previous orders', 
    'percentage', 20, 10000, 
    5000, 0, 50, 3, 
    'custom_range', NOW() - INTERVAL '1 day', NOW() + INTERVAL '120 days', true
),
(
    'FREESHIP3', 
    'Free Insured Shipping for loyal woodcraft collectors with 3+ past completed orders', 
    'free_shipping', 0, NULL, 
    0, 0, 500, 5, 
    'custom_range', NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', true
)
ON CONFLICT (code) DO NOTHING;
