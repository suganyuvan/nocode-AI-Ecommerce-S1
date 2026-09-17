import React, { useEffect, useState } from 'react';
import { HeroSettings, HeroLayout, HeroFontStyle, HeroBgTheme, Product } from '../../types';
import { fetchHeroSettings, saveHeroSettings, DEFAULT_HERO_SETTINGS } from '../../utils/pageContentEngine';
import { HeroSection } from '../../components/HeroSection';
import { supabase } from '../../utils/supabaseClient';
import { 
  Wand2, 
  Layout, 
  Type, 
  Palette, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Upload, 
  Check, 
  Eye,
  Sliders,
  Sparkles,
  Save,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Film,
  Layers
} from 'lucide-react';

const LAYOUT_OPTIONS: { id: HeroLayout; name: string; desc: string; icon: string }[] = [
  { id: 'animated_heritage_collage', name: '✨ Animated Heritage Collage Hero', desc: 'Cinematic multi-image layered collage with continuous subtle animation, depth & luxury craftsmanship aesthetics', icon: 'auto_awesome_mosaic' },
  { id: 'classic_split', name: '🖼️ Classic Split Hero', desc: 'Split hero with text on left & featured sculpture card on right', icon: 'splitscreen' },
  { id: 'fullscreen_bg', name: '🌌 Fullscreen Background Hero', desc: 'High-impact full-width hero image with dark luxury overlay & centered text', icon: 'fullscreen' },
  { id: 'centered_minimal', name: '🏛️ Centered Minimalist Hero', desc: 'Elegant centered typography with double heritage gold border', icon: 'center_focus_strong' },
  { id: 'floating_card', name: '🃏 Floating 3D Card Hero', desc: 'Dark obsidian theme with floating 3D sculpture frame', icon: 'card_giftcard' },
  { id: 'dual_sculpture_grid', name: '🍱 Dual Sculpture Grid', desc: 'Showcase two featured heritage sculptures side-by-side', icon: 'grid_view' },
];

const FONT_OPTIONS: { id: HeroFontStyle; name: string; preview: string }[] = [
  { id: 'serif_heritage', name: 'Playfair Heritage Serif', preview: 'Ancient Artistry for Royal Spaces' },
  { id: 'classic_roman', name: 'Classic Roman Trajan', preview: 'SACRED ARTISTRY FOR ROYAL SPACES' },
  { id: 'modern_luxury', name: 'Modern Luxury Sans', preview: 'Sacred Artistry for Royal Spaces' },
  { id: 'bold_minimal', name: 'Clean Bold Minimal', preview: 'Sacred Artistry for Royal Spaces' },
];

const BG_THEME_OPTIONS: { id: HeroBgTheme; name: string; bgClass: string }[] = [
  { id: 'royal_ebony', name: '👑 Royal Ebony Black', bgClass: 'bg-[#0f1513] text-white' },
  { id: 'sandalwood_woodgrain', name: '🪵 Sandalwood Woodgrain', bgClass: 'bg-[#1c130e] text-[#fbf5e8]' },
  { id: 'imperial_emerald', name: '🌿 Imperial Forest Emerald', bgClass: 'bg-[#0b2b1a] text-white' },
  { id: 'midnight_velvet', name: '🖤 Midnight Velvet Blue', bgClass: 'bg-[#111827] text-white' },
  { id: 'warm_amber', name: '🌅 Warm Mahogany Amber', bgClass: 'bg-[#3b1a0a] text-amber-50' },
];

const PRESET_SCULPTURE_IMAGES = [
  { name: 'Royal Heritage Temple Panel', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sandalwood Ganesha Sculpture', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
  { name: 'Craft Studio Heritage Panel', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Luxury Teak Craftwork', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Handcrafted Wooden Decor', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Traditional Artisan Workshop', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' },
];

export function PageBuilderManager() {
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'styling' | 'assets' | 'ctas'>('layout');

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      const fetchedSettings = await fetchHeroSettings();
      setSettings(fetchedSettings);

      const { data } = await supabase.from('products').select('*');
      if (data) {
        setProducts(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          priceINR: p.price_inr,
          priceUSD: p.price_usd,
          image: p.image,
          galleryImages: p.gallery_images,
          description: p.description,
          shortDescription: p.short_description,
          dimensions: p.dimensions,
          material: p.material,
          style: p.style,
          authenticity: p.authenticity,
          isNewArrival: p.is_new_arrival,
          isLimitedEdition: p.is_limited_edition,
          isBestSeller: p.is_best_seller,
          timberOptions: p.timber_options,
          weight: p.weight,
          rating: p.rating,
          reviewCount: p.review_count,
          featuredInSpotlight: p.featured_in_spotlight,
        })));
      }
      setLoading(false);
    };

    loadInit();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setNotice(null);
    const res = await saveHeroSettings(settings);
    if (res.success) {
      setNotice({ type: 'success', message: 'Hero Section settings saved & published to Storefront!' });
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to save Hero settings.' });
    }
    setSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'heroImageUrl' | 'secondaryImageUrl' = 'heroImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSettings(prev => ({ ...prev, [targetField]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const collageImages = (settings.collageImages && settings.collageImages.length >= 3)
    ? settings.collageImages
    : [
        settings.heroImageUrl || PRESET_SCULPTURE_IMAGES[0].url,
        settings.secondaryImageUrl || PRESET_SCULPTURE_IMAGES[1].url,
        PRESET_SCULPTURE_IMAGES[2].url,
        PRESET_SCULPTURE_IMAGES[3].url,
        PRESET_SCULPTURE_IMAGES[4].url,
      ];

  const handleCollageImageChange = (index: number, url: string) => {
    const current = [...collageImages];
    current[index] = url;
    setSettings(prev => ({ ...prev, collageImages: current }));
  };

  const handleCollageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          handleCollageImageChange(index, reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoveCollageImage = (fromIndex: number, toIndex: number) => {
    const current = [...collageImages];
    if (toIndex < 0 || toIndex >= current.length) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setSettings(prev => ({ ...prev, collageImages: current }));
  };

  const handleAddCollageSlot = () => {
    const current = [...collageImages];
    if (current.length < 5) {
      current.push(PRESET_SCULPTURE_IMAGES[current.length % PRESET_SCULPTURE_IMAGES.length].url);
      setSettings(prev => ({ ...prev, collageImages: current }));
    }
  };

  const handleRemoveCollageSlot = (index: number) => {
    const current = [...collageImages];
    if (current.length > 3) {
      current.splice(index, 1);
      setSettings(prev => ({ ...prev, collageImages: current }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="w-10 h-10 border-4 border-[#fed65b] border-t-[#0f1513] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500">Loading Page Builder & Advanced Controllers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Visual Page Builder & Hero Customizer</h2>
            <span className="bg-[#fed65b] text-[#0f1513] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              6 Hero Layouts
            </span>
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Customize storefront Hero layouts, typography, background themes, image uploads, and call-to-actions with real-time live preview.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:bg-[#1f2926] hover:shadow-lg cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#fed65b]" />
          <span>{saving ? 'Publishing...' : 'Publish Hero Changes'}</span>
        </button>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
          notice.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-500 hover:text-gray-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* REAL-TIME LIVE PREVIEW CANVAS */}
      <div className="bg-[#0f1513] rounded-[24px] border border-gray-800 p-4 space-y-2 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-2 py-1 text-white">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#fed65b]" />
            <span className="text-xs font-bold uppercase tracking-wider">Real-Time Live Storefront Preview Canvas</span>
          </div>
          <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-mono">
            Layout: {settings.layout} • Theme: {settings.bgTheme}
          </span>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 bg-white">
          <HeroSection settings={settings} products={products} />
        </div>
      </div>

      {/* CONTROLLER PANELS BOARD */}
      <div className="bg-white rounded-[24px] border border-[#e8e4dc] overflow-hidden shadow-2xs">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e8e4dc] bg-[#fcfaf7] px-6 gap-6 text-xs font-bold overflow-x-auto custom-scrollbar">
          {[
            { id: 'layout', label: '1. Layout Styles (6 Options)' },
            { id: 'content', label: '2. Copy & Headline' },
            { id: 'styling', label: '3. Typography & Themes' },
            { id: 'assets', label: '4. Image Upload & Assets' },
            { id: 'ctas', label: '5. CTAs & Buttons' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 text-xs">
          
          {/* TAB 1: 5 HERO LAYOUT STYLES */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Select Hero Section Layout Preset</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {LAYOUT_OPTIONS.map(layoutOpt => (
                  <div
                    key={layoutOpt.id}
                    onClick={() => setSettings(prev => ({ ...prev, layout: layoutOpt.id }))}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                      settings.layout === layoutOpt.id
                        ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md ring-2 ring-[#fed65b]'
                        : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">{layoutOpt.name}</span>
                        {settings.layout === layoutOpt.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${settings.layout === layoutOpt.id ? 'text-gray-300' : 'text-gray-500'}`}>
                        {layoutOpt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {settings.layout === 'animated_heritage_collage' && (
                <div className="mt-4 p-5 bg-gradient-to-r from-[#1c130e] via-[#0f1513] to-[#1c130e] text-white rounded-2xl border border-[#fed65b]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#fed65b] font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Animated Heritage Collage Active</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Currently using <strong>{collageImages.length} images</strong> with <strong>{settings.collageAnimationStyle || 'mixed_cinematic'}</strong> animation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assets')}
                    className="px-4 py-2 bg-[#fed65b] text-[#0f1513] font-bold text-xs rounded-xl hover:bg-white transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize 3–5 Images & Dynamics →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COPY & HEADLINE */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Headline & Description Copy</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Badge Pill Text</label>
                  <input
                    type="text"
                    value={settings.badge}
                    onChange={e => setSettings(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. Est. 1995 • Swarna Wooden Crafts Studio"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Headline Text *</label>
                  <input
                    type="text"
                    required
                    value={settings.headline}
                    onChange={e => setSettings(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="e.g. Sacred Artistry for Royal Spaces"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Subheadline / Description Story</label>
                <textarea
                  rows={3}
                  value={settings.description}
                  onChange={e => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter brand description story..."
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & THEMES */}
          {activeTab === 'styling' && (
            <div className="space-y-6">
              
              {/* Typography Options */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Typography Font Family</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONT_OPTIONS.map(font => (
                    <div
                      key={font.id}
                      onClick={() => setSettings(prev => ({ ...prev, fontStyle: font.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        settings.fontStyle === font.id
                          ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                          : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block">{font.name}</span>
                        <span className={`text-[11px] block italic ${settings.fontStyle === font.id ? 'text-gray-300' : 'text-gray-500'}`}>
                          "{font.preview}"
                        </span>
                      </div>
                      {settings.fontStyle === font.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#fed65b]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Theme */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Background Color & Gradient Theme</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BG_THEME_OPTIONS.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => setSettings(prev => ({ ...prev, bgTheme: theme.id }))}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        settings.bgTheme === theme.id
                          ? 'border-[#0f1513] ring-2 ring-[#fed65b]'
                          : 'border-[#e8e4dc] hover:border-[#0f1513]/40'
                      } ${theme.bgClass}`}
                    >
                      <span className="font-bold text-xs">{theme.name}</span>
                      {settings.bgTheme === theme.id && (
                        <Check className="w-4 h-4 text-[#fed65b]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay Opacity Slider */}
              <div className="space-y-2 pt-2 bg-[#f9f7f3] p-4 rounded-2xl border border-[#e8e4dc]">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800">Background Overlay Dimming Opacity</label>
                  <span className="font-bold text-[#ba7a1a]">{settings.overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={settings.overlayOpacity}
                  onChange={e => setSettings(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
                  className="w-full cursor-pointer"
                />
              </div>

            </div>
          )}

          {/* TAB 4: IMAGE UPLOAD & ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              
              {/* DEDICATED COLLAGE MANAGER IF ANIMATED HERITAGE COLLAGE LAYOUT */}
              {settings.layout === 'animated_heritage_collage' ? (
                <div className="space-y-6">
                  
                  {/* Collage Banner */}
                  <div className="p-4 bg-[#fcfaf7] border border-[#fed65b]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#fed65b]/20 text-[#0f1513] rounded-lg">
                        <Layers className="w-5 h-5 text-[#ba7a1a]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#111615]">Animated Heritage Collage (3–5 Images)</h4>
                        <p className="text-[11px] text-gray-500">
                          Slots 1–3 are required for the base composition. Slots 4 & 5 add floating accent depth.
                        </p>
                      </div>
                    </div>
                    {collageImages.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddCollageSlot}
                        className="px-3.5 py-1.5 bg-[#0f1513] text-white text-xs font-bold rounded-lg hover:bg-[#2b3531] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#fed65b]" />
                        <span>Add Slot {collageImages.length + 1}</span>
                      </button>
                    )}
                  </div>

                  {/* 3 to 5 Image Slots */}
                  <div className="space-y-4">
                    {collageImages.map((imgUrl, idx) => {
                      const isRequired = idx < 3;
                      const slotTitles = [
                        'Slot 1: Primary Focal Masterpiece (Center-Left Large Anchor)',
                        'Slot 2: Top-Right Floating Carving Detail',
                        'Slot 3: Bottom-Right Sandalwood / Shrine Artwork',
                        'Slot 4: Bottom-Left Chisel Heritage Texture (Optional)',
                        'Slot 5: Crown Finish Accent (Optional)',
                      ];

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-white border-2 border-[#e8e4dc] rounded-2xl space-y-3 hover:border-[#0f1513]/40 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isRequired ? 'bg-[#0f1513] text-[#fed65b]' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {isRequired ? `Image ${idx + 1} (Required)` : `Image ${idx + 1} (Optional)`}
                              </span>
                              <span className="font-bold text-xs text-gray-800 hidden sm:inline">
                                {slotTitles[idx] || `Image Slot ${idx + 1}`}
                              </span>
                            </div>

                            {/* Reordering & Remove buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveCollageImage(idx, idx - 1)}
                                className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === collageImages.length - 1}
                                onClick={() => handleMoveCollageImage(idx, idx + 1)}
                                className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              {!isRequired && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCollageSlot(idx)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer ml-1"
                                  title="Remove this slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            {/* Thumbnail */}
                            <div className="sm:col-span-2 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative">
                              <img src={imgUrl} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>

                            {/* URL and File Upload */}
                            <div className="sm:col-span-10 grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <input
                                type="text"
                                value={imgUrl}
                                onChange={e => handleCollageImageChange(idx, e.target.value)}
                                placeholder="Paste image URL..."
                                className="sm:col-span-8 px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                              />

                              <label className="sm:col-span-4 px-3 py-2 bg-[#f4f2ee] border border-[#e5e1d8] hover:bg-[#e8e4dc] rounded-xl text-xs font-bold text-[#0f1513] flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                                <Upload className="w-3.5 h-3.5 text-[#ba7a1a]" />
                                <span>Upload File</span>
                                <input type="file" accept="image/*" onChange={e => handleCollageFileUpload(e, idx)} className="hidden" />
                              </label>
                            </div>
                          </div>

                          {/* Quick Preset Selector for this slot */}
                          <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                            <span className="text-[10px] text-gray-500 font-bold shrink-0">Quick Preset:</span>
                            {PRESET_SCULPTURE_IMAGES.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleCollageImageChange(idx, preset.url)}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border shrink-0 transition-all cursor-pointer ${
                                  imgUrl === preset.url ? 'bg-[#0f1513] text-[#fed65b] border-[#0f1513] font-bold' : 'bg-[#fbfaf8] text-gray-600 border-gray-200 hover:border-black'
                                }`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collage Dynamics & Tuning Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-[#fcfaf7] border border-[#e8e4dc] rounded-2xl">
                    
                    {/* Animation Style */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-[#ba7a1a]" />
                        <span>Animation Style</span>
                      </label>
                      <select
                        value={settings.collageAnimationStyle || 'mixed_cinematic'}
                        onChange={e => setSettings(prev => ({ ...prev, collageAnimationStyle: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      >
                        <option value="mixed_cinematic">Mixed Cinematic (Parallax + Zoom + Glow)</option>
                        <option value="cinematic_fade">Cinematic Fade & Scale</option>
                        <option value="slow_zoom">Slow Majestic Zoom</option>
                        <option value="ken_burns">Ken Burns Panning</option>
                        <option value="gentle_parallax">Gentle Parallax Float</option>
                      </select>
                    </div>

                    {/* Animation Speed */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Animation Speed</label>
                      <select
                        value={settings.collageSpeed || 'normal'}
                        onChange={e => setSettings(prev => ({ ...prev, collageSpeed: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      >
                        <option value="slow">Slow & Majestic (9s cycle)</option>
                        <option value="normal">Normal Cinematic (6s cycle)</option>
                        <option value="fast">Dynamic Smooth (4s cycle)</option>
                      </select>
                    </div>

                    {/* Image Overlay Darkness */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Image Panel Overlay</label>
                      <select
                        value={settings.collageOverlay || 'none'}
                        onChange={e => setSettings(prev => ({ ...prev, collageOverlay: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      >
                        <option value="none">None (Crisp 0%)</option>
                        <option value="light">Light Dimming (20%)</option>
                        <option value="medium">Medium Luxury (40%)</option>
                        <option value="dark">Dark Velvet (60%)</option>
                      </select>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-gray-700">Border Radius</label>
                        <span className="font-bold text-[#ba7a1a]">{settings.collageBorderRadius ?? 16}px</span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={32}
                        step={2}
                        value={settings.collageBorderRadius ?? 16}
                        onChange={e => setSettings(prev => ({ ...prev, collageBorderRadius: Number(e.target.value) }))}
                        className="w-full cursor-pointer mt-1"
                      />
                    </div>

                  </div>

                </div>
              ) : (
                /* STANDARD SINGLE / DUAL IMAGE UPLOAD FOR OTHER LAYOUTS */
                <div className="space-y-6">
                  {/* Image Upload & URL */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Primary Hero Image Upload</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={settings.heroImageUrl}
                          onChange={e => setSettings(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Upload Local Image File</label>
                        <label className="w-full px-3 py-2 bg-[#f4f2ee] border border-[#e5e1d8] hover:bg-[#e8e4dc] rounded-xl text-xs font-bold text-[#0f1513] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-[#ba7a1a]" />
                          <span>Choose Image File...</span>
                          <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'heroImageUrl')} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Preset Sculpture Gallery */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-gray-600 block">Select from Sculpture Heritage Preset Gallery:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PRESET_SCULPTURE_IMAGES.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => setSettings(prev => ({ ...prev, heroImageUrl: img.url }))}
                            className={`rounded-xl overflow-hidden border-2 cursor-pointer relative h-24 transition-all ${
                              settings.heroImageUrl === img.url ? 'border-[#0f1513] ring-2 ring-[#fed65b]' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            {settings.heroImageUrl === img.url && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Check className="w-5 h-5 text-[#fed65b]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {settings.layout === 'dual_sculpture_grid' && (
                    <div className="space-y-3 pt-2">
                      <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Secondary Sculpture Image Upload (Grid Layout 2nd Panel)</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Secondary Image URL</label>
                          <input
                            type="text"
                            value={settings.secondaryImageUrl || ''}
                            onChange={e => setSettings(prev => ({ ...prev, secondaryImageUrl: e.target.value }))}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Upload Local Image File</label>
                          <label className="w-full px-3 py-2 bg-[#f4f2ee] border border-[#e5e1d8] hover:bg-[#e8e4dc] rounded-xl text-xs font-bold text-[#0f1513] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#ba7a1a]" />
                            <span>Choose 2nd Image...</span>
                            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'secondaryImageUrl')} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Featured Product Selector */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="font-bold text-sm text-[#111615]">Featured Product Card Link</h3>
                
                <select
                  value={settings.featuredProductId || ''}
                  onChange={e => setSettings(prev => ({ ...prev, featuredProductId: e.target.value }))}
                  className="w-full max-w-md px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                >
                  <option value="">Select Featured Masterpiece Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.priceINR.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          )}

          {/* TAB 5: CTAS & BUTTONS */}
          {activeTab === 'ctas' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Call-to-Action Buttons & Links</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Primary CTA Button Label</label>
                  <input
                    type="text"
                    value={settings.primaryCtaText}
                    onChange={e => setSettings(prev => ({ ...prev, primaryCtaText: e.target.value }))}
                    placeholder="e.g. Explore Collection"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Primary CTA Link Target</label>
                  <input
                    type="text"
                    value={settings.primaryCtaLink}
                    onChange={e => setSettings(prev => ({ ...prev, primaryCtaLink: e.target.value }))}
                    placeholder="e.g. #shop"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Secondary CTA Button Label (Optional)</label>
                  <input
                    type="text"
                    value={settings.secondaryCtaText || ''}
                    onChange={e => setSettings(prev => ({ ...prev, secondaryCtaText: e.target.value }))}
                    placeholder="e.g. Request Custom Commission"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Secondary CTA Link Target</label>
                  <input
                    type="text"
                    value={settings.secondaryCtaLink || ''}
                    onChange={e => setSettings(prev => ({ ...prev, secondaryCtaLink: e.target.value }))}
                    placeholder="e.g. #bespoke"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
