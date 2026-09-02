-- Setup SQL for SEO & GEO Settings Table in Supabase
CREATE TABLE IF NOT EXISTS seo_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_title TEXT NOT NULL DEFAULT 'Swarna Wooden Crafts | Sanctified Temple Architecture & Handcrafted Wood Sculptures',
    title_template TEXT NOT NULL DEFAULT '%s | Swarna Wooden Crafts',
    meta_description TEXT NOT NULL DEFAULT 'India’s premier atelier for handcrafted wooden temple doors, sacred god sculptures, bespoke home mandapams, and heritage rosewood & teakwood wall panels. Certified authentic artisan craftsmanship shipped worldwide with museum-grade crating.',
    keywords TEXT[] DEFAULT ARRAY[
        'Wooden Crafts India',
        'Handcrafted Wood Sculptures',
        'Wooden Temple Doors',
        'Temple Mandapam Shrine',
        'Lord Ganesha Wooden Statue',
        'Lord Nataraja Wall Mount',
        'Teak Wood Carvings',
        'Mysore Heritage Wood Crafts',
        'Sanctified Pooja Mandir',
        'Rosewood Wall Panels'
    ],
    canonical_base_url TEXT NOT NULL DEFAULT 'https://swarnawoodencrafts.com',
    og_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    geo_placename TEXT DEFAULT 'Mysore',
    geo_region TEXT DEFAULT 'IN-KA',
    geo_country TEXT DEFAULT 'IN',
    geo_latitude NUMERIC(10, 6) DEFAULT 12.295810,
    geo_longitude NUMERIC(10, 6) DEFAULT 76.639380,
    geo_postal_code TEXT DEFAULT '570001',
    geo_street_address TEXT DEFAULT 'Craft Studio Rd, Mysore Heritage Zone, Karnataka - 570001',
    business_phone TEXT DEFAULT '+91 98765 43210',
    business_email TEXT DEFAULT 'contact@irisjev.com',
    google_site_verification TEXT DEFAULT '',
    bing_site_verification TEXT DEFAULT '',
    enable_ai_crawlers BOOLEAN DEFAULT true,
    custom_robots_txt TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to SEO settings
DROP POLICY IF EXISTS "Allow public read on seo_settings" ON seo_settings;
CREATE POLICY "Allow public read on seo_settings"
ON seo_settings FOR SELECT
TO public
USING (true);

-- Allow authenticated (admin) users to update and insert SEO settings
DROP POLICY IF EXISTS "Allow authenticated upsert on seo_settings" ON seo_settings;
CREATE POLICY "Allow authenticated upsert on seo_settings"
ON seo_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert initial default record if row 1 does not exist
INSERT INTO seo_settings (
    id,
    site_title,
    title_template,
    meta_description,
    canonical_base_url,
    og_image_url,
    geo_placename,
    geo_region,
    geo_country,
    geo_latitude,
    geo_longitude,
    geo_postal_code,
    geo_street_address,
    business_phone,
    business_email,
    enable_ai_crawlers
)
VALUES (
    1,
    'Swarna Wooden Crafts | Sanctified Temple Architecture & Handcrafted Wood Sculptures',
    '%s | Swarna Wooden Crafts',
    'India’s premier atelier for handcrafted wooden temple doors, sacred god sculptures, bespoke home mandapams, and heritage rosewood & teakwood wall panels. Certified authentic artisan craftsmanship shipped worldwide with museum-grade crating.',
    'https://swarnawoodencrafts.com',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'Mysore',
    'IN-KA',
    'IN',
    12.295810,
    76.639380,
    '570001',
    'Craft Studio Rd, Mysore Heritage Zone, Karnataka - 570001',
    '+91 98765 43210',
    'contact@irisjev.com',
    true
)
ON CONFLICT (id) DO NOTHING;
