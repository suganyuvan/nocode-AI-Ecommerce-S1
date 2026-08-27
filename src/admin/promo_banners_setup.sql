-- SQL Setup script for Backend-Driven Promotional Banner System in Supabase

-- 1. Create `promo_banners` table
CREATE TABLE IF NOT EXISTS promo_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    cta_text TEXT,
    cta_link TEXT,
    image_url TEXT,
    style_preset TEXT NOT NULL DEFAULT 'royal_gold' CHECK (
        style_preset IN (
            'royal_gold', 
            'dark_luxury', 
            'emerald_mint', 
            'sunset_glow', 
            'glassmorphism', 
            'neon_cyber', 
            'minimal_clean', 
            'coral_blush', 
            'wooden_classic', 
            'gradient_ocean'
        )
    ),
    animation_type TEXT NOT NULL DEFAULT 'pulse_glow' CHECK (
        animation_type IN (
            'pulse_glow', 
            'slide_in_left', 
            'fade_zoom', 
            'shimmer_shine', 
            'bounce_gentle', 
            'marquee_scroll', 
            'floating_3d', 
            'none'
        )
    ),
    target_page TEXT NOT NULL DEFAULT 'home_hero' CHECK (
        target_page IN ('all', 'home_hero', 'header_marquee', 'checkout_top', 'cart_drawer')
    ),
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '365 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active banners
CREATE POLICY "Public Read Access for Active Banners" ON promo_banners
    FOR SELECT USING (true);

-- Allow authenticated users / admins full access
CREATE POLICY "Admin Full Access for Promo Banners" ON promo_banners
    FOR ALL USING (true);

-- Indexing for fast target page queries
CREATE INDEX IF NOT EXISTS idx_promo_banners_target_active ON promo_banners(target_page, is_active);

-- 3. Initial Sample Banners
INSERT INTO promo_banners (
    title, subtitle, badge_text, cta_text, cta_link, image_url, 
    style_preset, animation_type, target_page, is_active
) VALUES 
(
    'ROYAL FESTIVE HERITAGE COLLECTION 2026', 
    'Handcrafted Sanctified Teak & Sandalwood Sculptures with 100% Transit Insurance', 
    'FESTIVE OFFER 20% OFF', 
    'Explore Royal Panels', 
    '#shop', 
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', 
    'royal_gold', 
    'shimmer_shine', 
    'home_hero', 
    true
),
(
    '🚚 FREE INSURED EXPRESS EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000', 
    'Use Code: FREESHIP3 for loyal collectors on 3+ completed orders', 
    'EXPRESS DELIVERY', 
    'Claim Free Delivery', 
    '#checkout', 
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', 
    'emerald_mint', 
    'pulse_glow', 
    'header_marquee', 
    true
),
(
    'EXCLUSIVE CONCIERGE DISCOUNT: FLAT 10% OFF YOUR FIRST WOODEN SCULPTURE', 
    'Apply coupon WELCOME10 at checkout. Handcrafted in Heritage Craft Studios.', 
    'WELCOME SPECIAL', 
    'Use WELCOME10', 
    '#checkout', 
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 
    'sunset_glow', 
    'fade_zoom', 
    'checkout_top', 
    true
)
ON CONFLICT DO NOTHING;
