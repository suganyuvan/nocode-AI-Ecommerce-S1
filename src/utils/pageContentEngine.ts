import { supabase } from './supabaseClient';
import { HeroSettings } from '../types';

const HERO_LOCAL_STORAGE_KEY = 'irisjev_hero_settings_cache';

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  headline: 'Sacred Artistry for Royal Spaces',
  description: 'At Irisjev Wooden Crafts, every piece is hand-carved by 8th-generation master sculptors using centuries-old temple traditions. We preserve sacred heritage through ethically sourced aged teak, red sandalwood, and Indian rosewood.',
  badge: 'Est. 1995 • Irisjev Heritage Craft Studio',
  primaryCtaText: 'Explore Collection',
  primaryCtaLink: '#shop',
  secondaryCtaText: 'Request Custom Commission',
  secondaryCtaLink: '#bespoke',
  layout: 'classic_split',
  heroImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  secondaryImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  featuredProductId: 'ganesha-sculpture-01',
  fontStyle: 'serif_heritage',
  bgTheme: 'royal_ebony',
  overlayOpacity: 30,
  textAlign: 'left',
};

export const getLocalHeroSettings = (): HeroSettings => {
  try {
    const raw = localStorage.getItem(HERO_LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local hero settings cache:', e);
  }
  return DEFAULT_HERO_SETTINGS;
};

export const saveLocalHeroSettings = (settings: HeroSettings) => {
  try {
    localStorage.setItem(HERO_LOCAL_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('irisjev_hero_updated', { detail: settings }));
  } catch (e) {
    console.warn('Failed to save local hero settings:', e);
  }
};


/**
 * Fetch Hero Settings from Supabase `page_content` table or LocalStorage fallback
 */
export async function fetchHeroSettings(): Promise<HeroSettings> {
  try {
    const { data, error } = await supabase
      .from('page_content')
      .select('content')
      .eq('section', 'hero')
      .maybeSingle();

    if (error || !data || !data.content) {
      return getLocalHeroSettings();
    }

    const merged: HeroSettings = {
      ...DEFAULT_HERO_SETTINGS,
      ...data.content,
    };

    saveLocalHeroSettings(merged);
    return merged;
  } catch (e) {
    console.warn('Network error fetching hero settings, using local cache:', e);
    return getLocalHeroSettings();
  }
}

/**
 * Save Hero Settings to Supabase `page_content` table and LocalStorage
 */
export async function saveHeroSettings(settings: HeroSettings): Promise<{ success: boolean; data?: HeroSettings; error?: string }> {
  try {
    const payload = {
      section: 'hero',
      content: settings,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('page_content')
      .select('id')
      .eq('section', 'hero')
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('page_content')
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.warn('Supabase update error:', error);
      }
    } else {
      const { error } = await supabase
        .from('page_content')
        .insert([payload]);

      if (error) {
        console.warn('Supabase insert error:', error);
      }
    }

    saveLocalHeroSettings(settings);
    return { success: true, data: settings };
  } catch (e: any) {
    console.warn('Fallback saving hero settings to local cache:', e);
    saveLocalHeroSettings(settings);
    return { success: true, data: settings };
  }
}

