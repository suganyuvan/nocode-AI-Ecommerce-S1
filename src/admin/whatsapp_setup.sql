-- SQL Migration Script for Meta WhatsApp Cloud API Integration
-- Table for tracking WhatsApp message logs, delivery receipts, and automated customer notifications

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT,
  message_type TEXT,
  status TEXT,
  message_id TEXT,
  error_details TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Allow public insert access for logging notifications
CREATE POLICY "Allow public insert to whatsapp_logs" ON whatsapp_logs
  FOR INSERT WITH CHECK (true);

-- Allow select access
CREATE POLICY "Allow public select on whatsapp_logs" ON whatsapp_logs
  FOR SELECT USING (true);
