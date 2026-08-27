import { supabase } from './supabaseClient';
import { ShippingLabelSettings } from '../types';

const SHIPPING_LABEL_STORAGE_KEY = 'irisjev_shipping_label_settings';

export const DEFAULT_SHIPPING_LABEL_SETTINGS: ShippingLabelSettings = {
  id: 1,
  paper_size: 'A4',
  slips_per_sheet: 4,
  show_barcode: true,
  show_qr_code: true,
  show_fragile_warning: true,
  show_return_address: true,
  show_order_items: true,
  show_cod_badge: true,
  custom_declaration_note: 'FRAGILE - Sanctified Heritage Wooden Sculptures • 100% Insured Transit',
  brand_logo_url: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
  dispatch_hub_name: 'Irisjev Heritage Craft Studios',
  dispatch_hub_address: 'Craft Studio Rd, Mysore Heritage Zone, Karnataka - 570001, India',
  dispatch_hub_phone: '+91 98765 43210',
};

export const getLocalShippingLabelSettings = (): ShippingLabelSettings => {
  try {
    const raw = localStorage.getItem(SHIPPING_LABEL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local shipping label settings:', e);
  }
  return DEFAULT_SHIPPING_LABEL_SETTINGS;
};

export const saveLocalShippingLabelSettings = (settings: ShippingLabelSettings) => {
  try {
    localStorage.setItem(SHIPPING_LABEL_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save local shipping label settings:', e);
  }
};

/**
 * Fetch Shipping Label Settings from Supabase `shipping_label_settings` table or LocalStorage fallback
 */
export async function fetchShippingLabelSettings(): Promise<ShippingLabelSettings> {
  try {
    const { data, error } = await supabase
      .from('shipping_label_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return getLocalShippingLabelSettings();
    }

    const merged: ShippingLabelSettings = {
      ...DEFAULT_SHIPPING_LABEL_SETTINGS,
      ...data,
    };

    saveLocalShippingLabelSettings(merged);
    return merged;
  } catch (e) {
    console.warn('Network error fetching shipping label settings, using local cache:', e);
    return getLocalShippingLabelSettings();
  }
}

/**
 * Save Shipping Label Settings to Supabase `shipping_label_settings` table and LocalStorage
 */
export async function saveShippingLabelSettings(settings: ShippingLabelSettings): Promise<{ success: boolean; data?: ShippingLabelSettings; error?: string }> {
  try {
    const payload = {
      id: 1,
      paper_size: settings.paper_size,
      slips_per_sheet: settings.slips_per_sheet,
      show_barcode: settings.show_barcode,
      show_qr_code: settings.show_qr_code,
      show_fragile_warning: settings.show_fragile_warning,
      show_return_address: settings.show_return_address,
      show_order_items: settings.show_order_items,
      show_cod_badge: settings.show_cod_badge,
      custom_declaration_note: settings.custom_declaration_note,
      brand_logo_url: settings.brand_logo_url,
      dispatch_hub_name: settings.dispatch_hub_name,
      dispatch_hub_address: settings.dispatch_hub_address,
      dispatch_hub_phone: settings.dispatch_hub_phone,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('shipping_label_settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('shipping_label_settings')
        .update(payload)
        .eq('id', 1);

      if (error) console.warn('Supabase shipping label settings update error:', error);
    } else {
      const { error } = await supabase
        .from('shipping_label_settings')
        .insert([payload]);

      if (error) console.warn('Supabase shipping label settings insert error:', error);
    }

    saveLocalShippingLabelSettings(settings);
    return { success: true, data: settings };
  } catch (e: any) {
    console.warn('Fallback saving shipping label settings to local cache:', e);
    saveLocalShippingLabelSettings(settings);
    return { success: true, data: settings };
  }
}
