import { supabase } from './supabaseClient';
import { PromoBanner } from '../types';

const LOCAL_STORAGE_BANNERS_KEY = 'irisjev_promo_banners_cache';

export const INITIAL_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'banner-1',
    title: 'ROYAL FESTIVE HERITAGE COLLECTION 2026',
    subtitle: 'Handcrafted Sanctified Teak & Sandalwood Sculptures with 100% Transit Insurance',
    badge_text: 'FESTIVE OFFER 20% OFF',
    cta_text: 'Explore Royal Panels',
    cta_link: '#shop',
    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    style_preset: 'royal_gold',
    animation_type: 'shimmer_shine',
    target_page: 'home_hero',
    is_active: true,
  },
  {
    id: 'banner-2',
    title: '🚚 FREE INSURED EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000',
    subtitle: 'Use Code: FREESHIP3 for loyal collectors on 3+ completed orders',
    badge_text: 'EXPRESS DELIVERY',
    cta_text: 'Claim Free Delivery',
    cta_link: '#checkout',
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    style_preset: 'emerald_mint',
    animation_type: 'pulse_glow',
    target_page: 'header_marquee',
    is_active: true,
  },
  {
    id: 'banner-3',
    title: 'EXCLUSIVE CONCIERGE DISCOUNT: FLAT 10% OFF YOUR FIRST WOODEN SCULPTURE',
    subtitle: 'Apply coupon WELCOME10 at checkout. Handcrafted in Heritage Craft Studios.',
    badge_text: 'WELCOME SPECIAL',
    cta_text: 'Use WELCOME10',
    cta_link: '#checkout',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    style_preset: 'sunset_glow',
    animation_type: 'fade_zoom',
    target_page: 'checkout_top',
    is_active: true,
  }
];

const getLocalBanners = (): PromoBanner[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BANNERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local promo banners cache:', e);
  }
  return INITIAL_PROMO_BANNERS;
};

const saveLocalBanners = (banners: PromoBanner[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_BANNERS_KEY, JSON.stringify(banners));
  } catch (e) {
    console.warn('Failed to save local promo banners:', e);
  }
};

/**
 * Check if a banner is currently within its active date/time window
 */
export function isBannerScheduleActive(banner: PromoBanner, nowStr?: string): boolean {
  if (!banner.is_active) return false;
  const now = nowStr ? new Date(nowStr).getTime() : Date.now();
  
  if (banner.start_date) {
    const start = new Date(banner.start_date).getTime();
    if (now < start) return false;
  }

  if (banner.expiry_date) {
    const expiry = new Date(banner.expiry_date).getTime();
    if (now > expiry) return false;
  }

  return true;
}

/**
 * Fetch all promotional banners from Supabase DB or LocalStorage fallback
 */
export async function fetchPromoBanners(targetPage?: string): Promise<PromoBanner[]> {
  const nowIso = new Date().toISOString();
  try {
    let query = supabase.from('promo_banners').select('*').order('created_at', { ascending: false });
    
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const local = getLocalBanners();
      if (targetPage && targetPage !== 'all') {
        return local.filter(b => isBannerScheduleActive(b, nowIso) && (b.target_page === 'all' || b.target_page === targetPage));
      }
      return local;
    }

    const formatted: PromoBanner[] = data.map((item: any) => ({
      ...item,
      is_active: Boolean(item.is_active),
    }));

    saveLocalBanners(formatted);

    if (targetPage && targetPage !== 'all') {
      return formatted.filter(b => isBannerScheduleActive(b, nowIso) && (b.target_page === 'all' || b.target_page === targetPage));
    }
    return formatted;
  } catch (e) {
    console.warn('Using offline promo banners cache:', e);
    const local = getLocalBanners();
    if (targetPage && targetPage !== 'all') {
      return local.filter(b => isBannerScheduleActive(b, nowIso) && (b.target_page === 'all' || b.target_page === targetPage));
    }
    return local;
  }
}

/**
 * Save or update a promotional banner
 */
export async function savePromoBanner(banner: Partial<PromoBanner>): Promise<{ success: boolean; data?: PromoBanner; error?: string }> {
  const isNew = !banner.id || banner.id.startsWith('banner-');
  const nowStr = new Date().toISOString();
  const defaultExpiryStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const payload: any = {
    title: banner.title || 'HERITAGE PROMOTIONAL BANNER',
    subtitle: banner.subtitle || '',
    badge_text: banner.badge_text || '',
    cta_text: banner.cta_text || 'Explore Collection',
    cta_link: banner.cta_link || '#shop',
    image_url: banner.image_url || '',
    style_preset: banner.style_preset || 'royal_gold',
    animation_type: banner.animation_type || 'pulse_glow',
    target_page: banner.target_page || 'home_hero',
    is_active: banner.is_active ?? true,
    start_date: banner.start_date || nowStr,
    expiry_date: banner.expiry_date || defaultExpiryStr,
    updated_at: nowStr,
  };


  try {
    if (isNew) {
      const { data, error } = await supabase
        .from('promo_banners')
        .insert([{ ...payload, created_at: nowStr }])
        .select()
        .single();

      if (error) {
        // LocalStorage fallback
        const local = getLocalBanners();
        const newBanner: PromoBanner = {
          ...payload,
          id: `banner-${Date.now()}`,
          created_at: nowStr,
        };
        const updated = [newBanner, ...local];
        saveLocalBanners(updated);
        return { success: true, data: newBanner };
      }
      return { success: true, data: data as PromoBanner };
    } else {
      const { data, error } = await supabase
        .from('promo_banners')
        .update(payload)
        .eq('id', banner.id)
        .select()
        .single();

      if (error) {
        const local = getLocalBanners();
        const updated = local.map(b => (b.id === banner.id ? { ...b, ...payload } : b));
        saveLocalBanners(updated);
        return { success: true, data: { ...payload, id: banner.id } as PromoBanner };
      }
      return { success: true, data: data as PromoBanner };
    }
  } catch (e: any) {
    // Local fallback
    const local = getLocalBanners();
    if (isNew) {
      const newBanner: PromoBanner = {
        ...payload,
        id: `banner-${Date.now()}`,
        created_at: nowStr,
      };
      saveLocalBanners([newBanner, ...local]);
      return { success: true, data: newBanner };
    } else {
      const updated = local.map(b => (b.id === banner.id ? { ...b, ...payload } : b));
      saveLocalBanners(updated);
      return { success: true, data: { ...payload, id: banner.id } as PromoBanner };
    }
  }
}

/**
 * Toggle active status of a banner
 */
export async function togglePromoBannerActive(id: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  try {
    const { error } = await supabase
      .from('promo_banners')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) console.warn('Supabase banner active toggle error:', error);
  } catch (e) {
    console.warn('Network error toggling banner active:', e);
  }

  // Update local cache
  const local = getLocalBanners();
  const updated = local.map(b => (b.id === id ? { ...b, is_active: newStatus } : b));
  saveLocalBanners(updated);

  return newStatus;
}

/**
 * Delete a banner
 */
export async function deletePromoBanner(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('promo_banners').delete().eq('id', id);
    if (error) console.warn('Supabase banner delete notice:', error);
  } catch (e) {
    console.warn('Network error deleting banner:', e);
  }

  const local = getLocalBanners();
  const updated = local.filter(b => b.id !== id);
  saveLocalBanners(updated);

  return true;
}
