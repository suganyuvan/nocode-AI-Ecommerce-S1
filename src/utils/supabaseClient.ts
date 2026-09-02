import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://kimkttzdxnkekcoeuvop.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWt0dHpkeG5rZWtjb2V1dm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODQxOTgsImV4cCI6MjEwMjU2MDE5OH0.OyadTTtuEA12OichfOtJQ543eY1Jp8zLwuqm0dUoMj8';

/**
 * 1. Customer Storefront Supabase Client
 * Uses isolated storageKey so customer login never leaks into or disrupts Admin sessions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'irisjev_customer_auth_token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

/**
 * 2. Admin Dedicated Supabase Client
 * Uses completely separate storageKey so Admin credentials stay private in the Admin Panel
 * and cannot be overridden or logged out by customer storefront activity.
 */
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'irisjev_admin_auth_token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});
