-- SQL DDL setup script for Backend Shipping Label Settings in Supabase

CREATE TABLE IF NOT EXISTS shipping_label_settings (
    id INT PRIMARY KEY DEFAULT 1,
    paper_size TEXT NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4', 'A5', 'Thermal_4x6', 'Letter')),
    slips_per_sheet INT NOT NULL DEFAULT 4 CHECK (slips_per_sheet IN (1, 2, 4, 6)),
    show_barcode BOOLEAN NOT NULL DEFAULT true,
    show_qr_code BOOLEAN NOT NULL DEFAULT true,
    show_fragile_warning BOOLEAN NOT NULL DEFAULT true,
    show_return_address BOOLEAN NOT NULL DEFAULT true,
    show_order_items BOOLEAN NOT NULL DEFAULT true,
    show_cod_badge BOOLEAN NOT NULL DEFAULT true,
    custom_declaration_note TEXT DEFAULT 'FRAGILE - Sanctified Heritage Wooden Sculptures • 100% Insured Transit',
    brand_logo_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
    dispatch_hub_name TEXT DEFAULT 'Irisjev Heritage Craft Studios',
    dispatch_hub_address TEXT DEFAULT 'Craft Studio Rd, Mysore Heritage Zone, Karnataka - 570001, India',
    dispatch_hub_phone TEXT DEFAULT '+91 98765 43210',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE shipping_label_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on shipping_label_settings" ON shipping_label_settings;
CREATE POLICY "Allow public read access on shipping_label_settings" ON shipping_label_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write access on shipping_label_settings" ON shipping_label_settings;
CREATE POLICY "Allow public write access on shipping_label_settings" ON shipping_label_settings FOR ALL USING (true);

-- Insert Default Row
INSERT INTO shipping_label_settings (id, paper_size, slips_per_sheet)
VALUES (1, 'A4', 4)
ON CONFLICT (id) DO NOTHING;
