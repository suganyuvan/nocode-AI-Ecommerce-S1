-- SQL DDL setup script for Page View Analytics Tracking in Supabase

CREATE TABLE IF NOT EXISTS page_view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL DEFAULT 'page_view',
    page_name TEXT NOT NULL,
    page_path TEXT,
    product_id TEXT,
    product_name TEXT,
    category TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    session_id TEXT,
    user_email TEXT,
    duration_seconds INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_view_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_event_type ON page_view_events(event_type);
CREATE INDEX IF NOT EXISTS idx_page_views_page_name ON page_view_events(page_name);
CREATE INDEX IF NOT EXISTS idx_page_views_product_id ON page_view_events(product_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_view_events(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_email ON page_view_events(user_email);

-- Enable Row Level Security (RLS)
ALTER TABLE page_view_events ENABLE ROW LEVEL SECURITY;

-- Allow public insert (tracking from storefront)
DROP POLICY IF EXISTS "Allow public insert on page_view_events" ON page_view_events;
CREATE POLICY "Allow public insert on page_view_events"
ON page_view_events FOR INSERT
TO public
WITH CHECK (true);

-- Allow public read (for fallback storefront & admin fetching)
DROP POLICY IF EXISTS "Allow public read on page_view_events" ON page_view_events;
CREATE POLICY "Allow public read on page_view_events"
ON page_view_events FOR SELECT
TO public
USING (true);

-- Allow authenticated users (admin) to delete events
DROP POLICY IF EXISTS "Allow authenticated delete on page_view_events" ON page_view_events;
CREATE POLICY "Allow authenticated delete on page_view_events"
ON page_view_events FOR DELETE
TO authenticated
USING (true);
