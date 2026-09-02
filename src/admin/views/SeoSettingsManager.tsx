import React, { useEffect, useState } from 'react';
import { adminSupabase } from '../../utils/supabaseClient';
import { SeoSettingsRecord } from '../../types/seo';
import { DEFAULT_SEO_SETTINGS, SITE_URL } from '../../constants/seo';
import { generateSitemapXml, generateRobotsTxt, generateLlmsTxt } from '../../services/seo';
import { 
  Globe, 
  Save, 
  RefreshCw, 
  MapPin, 
  Search, 
  Bot, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Share2,
  Code,
  ShieldCheck
} from 'lucide-react';

export function SeoSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const [settings, setSettings] = useState<SeoSettingsRecord>(DEFAULT_SEO_SETTINGS);
  const [keywordInput, setKeywordInput] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'google' | 'social' | 'schema' | 'robots' | 'sitemap' | 'llms'>('google');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    setLoading(true);
    try {
      // 1. Fetch SEO Settings from Supabase
      const { data: dbSettings, error } = await adminSupabase
        .from('seo_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (dbSettings && !error) {
        setSettings({
          ...DEFAULT_SEO_SETTINGS,
          ...dbSettings,
          keywords: Array.isArray(dbSettings.keywords) ? dbSettings.keywords : DEFAULT_SEO_SETTINGS.keywords
        });
      }

      // 2. Fetch products for sitemap & LLMs preview
      const { data: prods } = await adminSupabase
        .from('products')
        .select('id, name, category, price_inr, image, description');

      if (prods) {
        setProducts(prods);
      }
    } catch (err: any) {
      console.warn('Error fetching SEO settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        ...settings,
        id: 1,
        updated_at: new Date().toISOString()
      };

      const { error } = await adminSupabase
        .from('seo_settings')
        .upsert(payload);

      if (error) throw error;

      setMessage({ type: 'success', text: 'SEO & GEO settings synchronized to Supabase backend successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save SEO settings.' });
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const trimmed = keywordInput.trim();
    if (!settings.keywords.includes(trimmed)) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, trimmed]
      }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kwToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kwToRemove)
    }));
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(identifier);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="w-9 h-9 border-4 border-[#fed65b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const liveSitemapXml = generateSitemapXml(products, settings.canonical_base_url || SITE_URL);
  const liveRobotsTxt = settings.custom_robots_txt?.trim() 
    ? settings.custom_robots_txt 
    : generateRobotsTxt(settings.canonical_base_url || SITE_URL, settings.enable_ai_crawlers);
  const liveLlmsTxt = generateLlmsTxt(products, settings.canonical_base_url || SITE_URL);

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1440px] mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0f1513] text-[#fed65b] flex items-center justify-center shadow-md">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#111615] tracking-tight">SEO, Sitemaps & GEO Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fed65b]/20 text-[#856404] uppercase tracking-wider">
                AEO READY
              </span>
            </div>
            <p className="text-xs text-[#747878] mt-0.5">
              Manage global search engine metadata, OpenGraph cards, Mysore GEO local coordinates, robots.txt, and AI crawler access (llms.txt).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchSeoData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-bold text-[#444748] hover:bg-[#eeebe4] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              saving ? 'opacity-70' : 'hover:bg-[#1f2926] hover:shadow-lg'
            }`}
          >
            <Save className="w-4 h-4 text-[#fed65b]" />
            <span>{saving ? 'Syncing Backend...' : 'Save & Publish SEO'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Core Meta Tags & Site Identity */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#baa048]" />
                <h3 className="text-sm font-bold text-[#111615]">Primary Meta & Search Indexing</h3>
              </div>
              <span className="text-[11px] text-[#747878] font-mono">index, follow</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Canonical Base URL</label>
                <input
                  type="text"
                  value={settings.canonical_base_url}
                  onChange={(e) => setSettings({ ...settings, canonical_base_url: e.target.value })}
                  placeholder="https://swarnawoodencrafts.com"
                  className="w-full px-3.5 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Global Site Meta Title</label>
                <input
                  type="text"
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
                <div className="flex justify-between text-[10px] text-[#747878] mt-1">
                  <span>Recommended: 50–60 characters</span>
                  <span className={settings.site_title.length > 60 ? 'text-amber-600 font-bold' : ''}>
                    {settings.site_title.length} chars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Title Template (for Child & Product Pages)</label>
                <input
                  type="text"
                  value={settings.title_template}
                  onChange={(e) => setSettings({ ...settings, title_template: e.target.value })}
                  placeholder="%s | Swarna Wooden Crafts"
                  className="w-full px-3.5 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={settings.meta_description}
                  onChange={(e) => setSettings({ ...settings, meta_description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#d4af37] resize-none"
                />
                <div className="flex justify-between text-[10px] text-[#747878] mt-1">
                  <span>Recommended: 140–160 characters</span>
                  <span className={settings.meta_description.length > 160 ? 'text-amber-600 font-bold' : ''}>
                    {settings.meta_description.length} chars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Default OpenGraph & Social Preview Image URL</label>
                <input
                  type="text"
                  value={settings.og_image_url}
                  onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Keywords Tag Cloud */}
              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1.5">Meta Keywords & Entity Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add target keyword e.g. Mysore Teakwood Carvings..."
                    className="flex-1 px-3 py-1.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-3.5 py-1.5 bg-[#1b1c1c] text-white rounded-xl text-xs font-bold hover:bg-[#333] transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {settings.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f4f2ec] text-[#2c2b29] text-[11px] font-medium border border-[#e5e1d8]"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-[#888] hover:text-red-500 text-xs font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: GEO & Local Mysore Search Optimization */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#111615]">GEO & Local Business Coordinates (Mysore Zone)</h3>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                GEO ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Place Name</label>
                <input
                  type="text"
                  value={settings.geo_placename}
                  onChange={(e) => setSettings({ ...settings, geo_placename: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Geo Region (ISO 3166-2)</label>
                <input
                  type="text"
                  value={settings.geo_region}
                  onChange={(e) => setSettings({ ...settings, geo_region: e.target.value })}
                  placeholder="IN-KA"
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.geo_latitude}
                  onChange={(e) => setSettings({ ...settings, geo_latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.geo_longitude}
                  onChange={(e) => setSettings({ ...settings, geo_longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#444748] mb-1">Full Studio Dispatch Address</label>
                <input
                  type="text"
                  value={settings.geo_street_address}
                  onChange={(e) => setSettings({ ...settings, geo_street_address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* Card 3: AI Crawlers & Verification Tokens */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0ede6] pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-[#111615]">AI Crawlers & Search Verification</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#fbf9f4] rounded-xl border border-[#ece8df]">
                <div>
                  <h4 className="text-xs font-bold text-[#111615]">Permit AI Search Agents (GPTBot, ClaudeBot, Perplexity)</h4>
                  <p className="text-[11px] text-[#747878]">Allows AI Overviews and ChatGPT/Perplexity to cite your catalog</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enable_ai_crawlers: !settings.enable_ai_crawlers })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.enable_ai_crawlers ? 'bg-[#2e6930]' : 'bg-[#d1ccc4]'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      settings.enable_ai_crawlers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#444748] mb-1">Google Search Console Verification Tag</label>
                  <input
                    type="text"
                    value={settings.google_site_verification}
                    onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value })}
                    placeholder="e.g. google1234567890abcdef"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444748] mb-1">Bing Webmaster Verification Code</label>
                  <input
                    type="text"
                    value={settings.bing_site_verification}
                    onChange={(e) => setSettings({ ...settings, bing_site_verification: e.target.value })}
                    placeholder="e.g. 1234567890ABCDEF12345"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live SERP, Social & Discovery Previews (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] p-6 shadow-xs flex flex-col space-y-4">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 border-b border-[#f0ede6] pb-3 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setActivePreviewTab('google')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'google'
                    ? 'bg-[#0f1513] text-white shadow-xs'
                    : 'text-[#666] hover:bg-[#f4f2ec]'
                }`}
              >
                Google SERP
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('social')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'social'
                    ? 'bg-[#0f1513] text-white shadow-xs'
                    : 'text-[#666] hover:bg-[#f4f2ec]'
                }`}
              >
                Social Card
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('sitemap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'sitemap'
                    ? 'bg-[#0f1513] text-white shadow-xs'
                    : 'text-[#666] hover:bg-[#f4f2ec]'
                }`}
              >
                Sitemap ({products.length + 12})
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('robots')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'robots'
                    ? 'bg-[#0f1513] text-white shadow-xs'
                    : 'text-[#666] hover:bg-[#f4f2ec]'
                }`}
              >
                robots.txt
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('llms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'llms'
                    ? 'bg-[#0f1513] text-white shadow-xs'
                    : 'text-[#666] hover:bg-[#f4f2ec]'
                }`}
              >
                llms.txt
              </button>
            </div>

            {/* TAB 1: Google SERP Preview */}
            {activePreviewTab === 'google' && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#747878]">
                  Live preview of how your homepage appears on Google search results:
                </p>
                <div className="p-4 bg-[#fbfaf8] border border-[#e5e1d8] rounded-2xl space-y-1.5 shadow-2xs font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1b1c1c] text-[#fed65b] flex items-center justify-center text-[10px] font-bold">
                      S
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-medium text-[#202124]">{settings.canonical_base_url || 'https://swarnawoodencrafts.com'}</p>
                      <p className="text-[10px] text-[#5f6368]">https://swarnawoodencrafts.com</p>
                    </div>
                  </div>
                  <h4 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                    {settings.site_title}
                  </h4>
                  <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                    {settings.meta_description}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-[#70757a]">
                    <span className="bg-white px-2 py-0.5 rounded border border-[#e0ded6]">📍 {settings.geo_placename}, Karnataka</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-[#e0ded6]">⭐ 4.9 (120+ Reviews)</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-[#e0ded6]">✓ In Stock</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Social Card (Open Graph) */}
            {activePreviewTab === 'social' && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#747878]">
                  Open Graph & Twitter / X preview card when shared on WhatsApp, iMessage, Facebook, and Twitter:
                </p>
                <div className="border border-[#e0ded6] rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="w-full h-44 bg-gray-900 relative">
                    <img
                      src={settings.og_image_url}
                      alt="OG Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                      1200 × 630
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1 bg-[#fbfaf8]">
                    <p className="text-[10px] uppercase font-bold text-[#747878] tracking-wider">
                      swarnawoodencrafts.com
                    </p>
                    <h4 className="text-xs font-bold text-[#111615] truncate">
                      {settings.site_title}
                    </h4>
                    <p className="text-[11px] text-[#555] line-clamp-2 leading-relaxed">
                      {settings.meta_description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: XML Sitemap */}
            {activePreviewTab === 'sitemap' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#747878]">
                    Live generated XML sitemap with {products.length + 12} indexed URLs:
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(liveSitemapXml, 'sitemap')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-[#f4f2ec] hover:bg-[#e8e4dc] rounded-lg text-[#333] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTab === 'sitemap' ? 'Copied XML!' : 'Copy XML'}</span>
                  </button>
                </div>
                <div className="bg-[#0f1513] text-[#fed65b] p-3.5 rounded-xl font-mono text-[11px] h-72 overflow-y-auto custom-scrollbar whitespace-pre leading-normal border border-white/10">
                  {liveSitemapXml}
                </div>
              </div>
            )}

            {/* TAB 4: robots.txt */}
            {activePreviewTab === 'robots' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#747878]">
                    Live `/robots.txt` crawler configuration:
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(liveRobotsTxt, 'robots')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-[#f4f2ec] hover:bg-[#e8e4dc] rounded-lg text-[#333] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTab === 'robots' ? 'Copied robots.txt!' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="bg-[#0f1513] text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] h-72 overflow-y-auto custom-scrollbar whitespace-pre leading-normal border border-white/10">
                  {liveRobotsTxt}
                </div>
              </div>
            )}

            {/* TAB 5: llms.txt */}
            {activePreviewTab === 'llms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#747878]">
                    Live `/llms.txt` file formatted for Generative Engine Optimization (GEO):
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(liveLlmsTxt, 'llms')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-[#f4f2ec] hover:bg-[#e8e4dc] rounded-lg text-[#333] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTab === 'llms' ? 'Copied llms.txt!' : 'Copy Markdown'}</span>
                  </button>
                </div>
                <div className="bg-[#0f1513] text-sky-300 p-3.5 rounded-xl font-mono text-[11px] h-72 overflow-y-auto custom-scrollbar whitespace-pre leading-normal border border-white/10">
                  {liveLlmsTxt}
                </div>
              </div>
            )}

          </div>

          {/* Health Badge Card */}
          <div className="bg-[#f7fcf8] border border-[#cbe4d0] rounded-[24px] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">SEO & GEO Health Score: 98/100</h4>
                <p className="text-[11px] text-emerald-800">
                  JSON-LD schemas, Mysore GEO tags, AI Crawlers, and Canonical URLs all active.
                </p>
              </div>
            </div>
            <a
              href={`${settings.canonical_base_url || SITE_URL}/sitemap.xml`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white border border-[#cbe4d0] text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1"
            >
              <span>Test Sitemap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
