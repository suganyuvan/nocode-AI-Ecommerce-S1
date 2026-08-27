import React, { useEffect, useState } from 'react';
import { PromoBanner, PromoBannerStylePreset, PromoBannerAnimation, PromoBannerTargetPage } from '../../types';
import { fetchPromoBanners, savePromoBanner, togglePromoBannerActive, deletePromoBanner, isBannerScheduleActive } from '../../utils/promoBannerEngine';
import { PromotionalBanner } from '../../components/PromotionalBanner';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Image as ImageIcon, 
  Zap, 
  Layout, 
  Eye,
  Sliders,
  Check,
  Upload,
  Calendar,
  Clock
} from 'lucide-react';


const PRESET_GALLERY_IMAGES = [
  { name: 'Royal Heritage Temple Panel', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sandalwood Ganesha Sculpture', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80' },
  { name: 'Craft Studio Heritage Panel', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Luxury Teak Craftwork', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
];

const STYLE_OPTIONS: { id: PromoBannerStylePreset; name: string; desc: string; colorBg: string; textCol: string }[] = [
  { id: 'royal_gold', name: '👑 Royal Gold & Ebony', desc: 'Luxury dark theme with metallic 24K gold foil border', colorBg: '#0f1513', textCol: '#fed65b' },
  { id: 'dark_luxury', name: '🖤 Dark Luxury Velvet', desc: 'Deep charcoal velvet card with subtle glass effect', colorBg: '#18181b', textCol: '#ffffff' },
  { id: 'emerald_mint', name: '🌿 Emerald Royal Mint', desc: 'Deep forest green with gold accents & mint glow', colorBg: '#14472c', textCol: '#34d399' },
  { id: 'sunset_glow', name: '🌅 Sunset Amber Glow', desc: 'Warm amber & mahogany gradient with golden sparkles', colorBg: '#5c2a12', textCol: '#fbbf24' },
  { id: 'glassmorphism', name: '🔮 Frosted Glassmorphism', desc: 'Ultra-modern glassmorphic blur with white border', colorBg: 'rgba(255,255,255,0.2)', textCol: '#ffffff' },
  { id: 'neon_cyber', name: '⚡ Neon Cyber Amber', desc: 'High contrast dark mode with glowing electric outline', colorBg: '#09090b', textCol: '#fbbf24' },
  { id: 'minimal_clean', name: '📄 Minimalist Royal Clean', desc: 'Clean off-white ivory card with dark serif typography', colorBg: '#fcfaf7', textCol: '#111615' },
  { id: 'coral_blush', name: '🌸 Coral Heritage Blush', desc: 'Soft warm rosewood & coral blush gradient', colorBg: '#5c2429', textCol: '#fca5a5' },
  { id: 'wooden_classic', name: '🪵 Classic Sandalwood Grain', desc: 'Textured sandalwood woodgrain with carved gold trim', colorBg: '#1c130e', textCol: '#ba7a1a' },
  { id: 'gradient_ocean', name: '🌊 Gradient Ocean Wave', desc: 'Deep peacock teal & navy shimmer wave', colorBg: '#093554', textCol: '#22d3ee' },
];

const ANIMATION_OPTIONS: { id: PromoBannerAnimation; name: string; desc: string }[] = [
  { id: 'pulse_glow', name: '💫 Pulse Glow', desc: 'Breathing aura glow animation' },
  { id: 'slide_in_left', name: '➡️ Slide In Entrance', desc: 'Smooth left-to-right slide entrance' },
  { id: 'fade_zoom', name: '🔍 Fade & Scale Zoom', desc: 'Gentle scale zoom animation on hover' },
  { id: 'shimmer_shine', name: '✨ Shimmer Metallic Shine', desc: 'Light sweep animation across banner' },
  { id: 'bounce_gentle', name: '🎈 Gentle Float Bounce', desc: 'Subtle vertical floating motion' },
  { id: 'floating_3d', name: '🧊 3D Tilt Perspective', desc: 'Subtle 3D floating perspective tilt' },
  { id: 'marquee_scroll', name: '📜 Marquee Ticker', desc: 'Continuous marquee scrolling text' },
  { id: 'none', name: '⏸️ Static Clean', desc: 'Static clean card without animation' },
];

const TARGET_PAGE_OPTIONS: { id: PromoBannerTargetPage; name: string; desc: string }[] = [
  { id: 'home_hero', name: '🏠 Homepage Hero Banner', desc: 'Prominent banner on top of Homepage' },
  { id: 'header_marquee', name: '📢 Storefront Header Announcement Bar', desc: 'Top ticker bar across all storefront pages' },
  { id: 'checkout_top', name: '🛒 Checkout Order Summary Top', desc: 'Banner on top of Checkout sidebar' },
  { id: 'cart_drawer', name: '🛍️ Cart Drawer Top', desc: 'Banner displayed inside sliding Cart Drawer' },
  { id: 'all', name: '🌐 All Storefront Placements', desc: 'Displays across all placement slots' },
];

export function PromoBannersManager() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [placementFilter, setPlacementFilter] = useState('all');

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal drawer states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<PromoBanner> | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'animation' | 'placement' | 'schedule'>('content');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchPromoBanners();
    setBanners(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    const now = new Date();
    const future14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setEditingBanner({
      title: 'HERITAGE ROYAL FESTIVE COLLECTION',
      subtitle: 'Sanctified Handcrafted Wooden Sculptures with 100% Transit Insurance',
      badge_text: 'LIMITED FESTIVE OFFER 20% OFF',
      cta_text: 'Explore Collection',
      cta_link: '#shop',
      image_url: PRESET_GALLERY_IMAGES[0].url,
      style_preset: 'royal_gold',
      animation_type: 'shimmer_shine',
      target_page: 'home_hero',
      is_active: true,
      start_date: now.toISOString().slice(0, 16),
      expiry_date: future14Days.toISOString().slice(0, 16),
    });
    setActiveTab('content');
    setIsModalOpen(true);
  };

  const applyQuickDurationPreset = (days: number) => {
    if (!editingBanner) return;
    const startDate = editingBanner.start_date ? new Date(editingBanner.start_date) : new Date();
    const expiryDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    setEditingBanner({
      ...editingBanner,
      start_date: startDate.toISOString().slice(0, 16),
      expiry_date: expiryDate.toISOString().slice(0, 16),
    });
  };


  const handleOpenEditModal = (banner: PromoBanner) => {
    setEditingBanner({ ...banner });
    setActiveTab('content');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const updatedStatus = await togglePromoBannerActive(id, currentStatus);
    setBanners(prev => prev.map(b => (b.id === id ? { ...b, is_active: updatedStatus } : b)));
    setNotice({
      type: 'success',
      message: `Banner ${updatedStatus ? 'enabled & activated' : 'disabled'}.`
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    await deletePromoBanner(id);
    setBanners(prev => prev.filter(b => b.id !== id));
    setNotice({ type: 'success', message: 'Promotional banner deleted successfully.' });
  };

  const handleSaveBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title?.trim()) {
      setNotice({ type: 'error', message: 'Banner Title is required.' });
      return;
    }

    setSaving(true);
    setNotice(null);

    const res = await savePromoBanner(editingBanner);
    if (res.success) {
      setNotice({ type: 'success', message: `Promotional Banner "${editingBanner.title}" saved successfully.` });
      setIsModalOpen(false);
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to save promotional banner.' });
    }
    setSaving(false);
  };

  // Image File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (editingBanner && reader.result) {
          setEditingBanner({ ...editingBanner, image_url: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering
  const filteredBanners = banners.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.badge_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlacement = placementFilter === 'all' || b.target_page === placementFilter;
    return matchesSearch && matchesPlacement;
  });

  const activeCount = banners.filter(b => b.is_active).length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="w-10 h-10 border-4 border-[#fed65b] border-t-[#0f1513] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500">Loading Promotional Banners Engine & 10 Style Options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Promotional Banners & Style Engine</h2>
            <span className="bg-[#fed65b] text-[#0f1513] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              10 Style Presets
            </span>
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Create high-converting luxury promotional banners with 10 visual style themes, image upload, and animation controls.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:bg-[#1f2926] hover:shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#fed65b]" />
          <span>Create New Promo Banner</span>
        </button>
      </div>

      {notice && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
          notice.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-500 hover:text-gray-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Total Banners</p>
            <h3 className="text-2xl font-bold text-[#111615]">{banners.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Active & Live Banners</p>
            <h3 className="text-2xl font-bold text-emerald-700">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Style Options</p>
            <h3 className="text-2xl font-bold text-purple-900">10 Luxury Presets</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#e8e4dc]">
        <div className="relative flex-1 w-full sm:w-auto max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search banner title, badge text, or subtitle..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:border-[#0f1513] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', name: 'All Placements' },
            { id: 'home_hero', name: 'Homepage Hero' },
            { id: 'header_marquee', name: 'Header Marquee' },
            { id: 'checkout_top', name: 'Checkout Top' },
            { id: 'cart_drawer', name: 'Cart Drawer' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPlacementFilter(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                placementFilter === p.id ? 'bg-[#0f1513] text-white shadow-xs' : 'bg-[#f4f2ee] text-[#444748] hover:bg-[#e8e4dc]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Banners Grid Directory */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-12 text-center space-y-3">
          <Layout className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-base text-gray-700">No promotional banners found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Create your first promotional banner to display high-converting offers across storefront placements.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBanners.map(banner => {
            const styleOpt = STYLE_OPTIONS.find(s => s.id === banner.style_preset) || STYLE_OPTIONS[0];
            const animOpt = ANIMATION_OPTIONS.find(a => a.id === banner.animation_type) || ANIMATION_OPTIONS[0];
            const targetOpt = TARGET_PAGE_OPTIONS.find(t => t.id === banner.target_page) || TARGET_PAGE_OPTIONS[0];

            return (
              <div key={banner.id} className="bg-white rounded-2xl border border-[#e8e4dc] p-5 space-y-4 shadow-2xs hover:shadow-md transition-shadow relative">
                
                {/* Banner Directory Item Header */}
                <div className="flex justify-between items-center gap-4 pb-3 border-b border-[#f0ede6]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs bg-[#f4f2ee] px-3 py-1 rounded-lg text-[#0f1513] border border-[#e5e1d8]">
                      {targetOpt.name}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                      {styleOpt.name}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {animOpt.name}
                    </span>

                    {/* Schedule Status Badge */}
                    {!banner.is_active ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                        🚫 Disabled
                      </span>
                    ) : isBannerScheduleActive(banner) ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live Now</span>
                      </span>
                    ) : banner.start_date && new Date(banner.start_date).getTime() > Date.now() ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        ⏰ Scheduled
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        ⌛ Campaign Expired
                      </span>
                    )}
                  </div>

                  {/* Active Toggle Switch & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${banner.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {banner.is_active ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          banner.is_active ? 'bg-[#0f1513]' : 'bg-[#e5e1d8]'
                        }`}
                        title={banner.is_active ? 'Disable Banner' : 'Enable Banner'}
                      >
                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          banner.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>


                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-1.5 text-gray-500 hover:text-[#0f1513] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Real-time Rendered Storefront Banner Preview */}
                <div>
                  <span className="text-[10px] font-bold text-[#747878] uppercase tracking-wider block mb-2">Live Component Preview:</span>
                  <PromotionalBanner targetPage={banner.target_page} customBanner={banner} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL DRAWER */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e8e4dc] flex justify-between items-center bg-[#0f1513] text-white">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#fed65b]" />
                <div>
                  <h3 className="font-bold text-base">
                    {editingBanner.id ? 'Edit Promotional Banner & Style Theme' : 'Create New Promotional Banner'}
                  </h3>
                  <p className="text-[11px] text-[#fed65b]/80">Configure copy, 10 visual presets, image uploads, and animation effects</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-[#e8e4dc] bg-[#fcfaf7] px-6 gap-6 text-xs font-bold overflow-x-auto custom-scrollbar">
              {[
                { id: 'content', label: '1. Copy & Content' },
                { id: 'style', label: '2. 10 Style Presets' },
                { id: 'animation', label: '3. Animation Controls' },
                { id: 'placement', label: '4. Placement & Assets' },
                { id: 'schedule', label: '5. Schedule (7-14 Days)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 border-b-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === tab.id ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>


            {/* Modal Form Content */}
            <form onSubmit={handleSaveBannerSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 text-xs">
              
              {/* LIVE PREVIEW DRAWER AT TOP OF FORM */}
              <div className="space-y-2 p-4 bg-[#f4f2ee] rounded-2xl border border-[#e4e0d5]">
                <span className="text-[11px] font-bold text-[#0f1513] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#ba7a1a]" />
                  <span>Real-Time Live Component Preview:</span>
                </span>
                <PromotionalBanner targetPage={editingBanner.target_page || 'home_hero'} customBanner={editingBanner as PromoBanner} />
              </div>

              {/* TAB 1: COPY & CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Banner Copy & Call to Action</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Banner Title *</label>
                      <input
                        type="text"
                        required
                        value={editingBanner.title || ''}
                        onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        placeholder="e.g. ROYAL FESTIVE HERITAGE COLLECTION 2026"
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Badge Pill Text (Optional)</label>
                      <input
                        type="text"
                        value={editingBanner.badge_text || ''}
                        onChange={e => setEditingBanner({ ...editingBanner, badge_text: e.target.value })}
                        placeholder="e.g. FESTIVE OFFER 20% OFF"
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={editingBanner.subtitle || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      placeholder="e.g. Handcrafted Sanctified Teak & Sandalwood Sculptures with 100% Transit Insurance"
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Button CTA Label</label>
                      <input
                        type="text"
                        value={editingBanner.cta_text || ''}
                        onChange={e => setEditingBanner({ ...editingBanner, cta_text: e.target.value })}
                        placeholder="e.g. Explore Royal Collection"
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Button CTA Link / Hash</label>
                      <input
                        type="text"
                        value={editingBanner.cta_link || ''}
                        onChange={e => setEditingBanner({ ...editingBanner, cta_link: e.target.value })}
                        placeholder="e.g. #shop or /checkout"
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 10 VISUAL STYLE PRESETS */}
              {activeTab === 'style' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Select Visual Style Preset (10 Options)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STYLE_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setEditingBanner({ ...editingBanner, style_preset: opt.id })}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          editingBanner.style_preset === opt.id
                            ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                            : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-xs block">{opt.name}</span>
                          <span className={`text-[11px] block ${editingBanner.style_preset === opt.id ? 'text-gray-300' : 'text-gray-500'}`}>
                            {opt.desc}
                          </span>
                        </div>
                        {editingBanner.style_preset === opt.id && (
                          <CheckCircle2 className="w-5 h-5 text-[#fed65b] shrink-0 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ANIMATION CONTROLS */}
              {activeTab === 'animation' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Animation Control Settings (8 Modes)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ANIMATION_OPTIONS.map(anim => (
                      <div
                        key={anim.id}
                        onClick={() => setEditingBanner({ ...editingBanner, animation_type: anim.id })}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          editingBanner.animation_type === anim.id
                            ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                            : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs block">{anim.name}</span>
                          <span className={`text-[11px] block ${editingBanner.animation_type === anim.id ? 'text-gray-300' : 'text-gray-500'}`}>
                            {anim.desc}
                          </span>
                        </div>
                        {editingBanner.animation_type === anim.id && (
                          <CheckCircle2 className="w-5 h-5 text-[#fed65b] shrink-0 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PLACEMENT & ASSETS */}
              {activeTab === 'placement' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Target Storefront Placement</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TARGET_PAGE_OPTIONS.map(target => (
                        <div
                          key={target.id}
                          onClick={() => setEditingBanner({ ...editingBanner, target_page: target.id })}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            editingBanner.target_page === target.id
                              ? 'border-[#0f1513] bg-[#0f1513] text-white shadow-md'
                              : 'border-[#e8e4dc] bg-white hover:border-[#0f1513]/40'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs block">{target.name}</span>
                            <span className={`text-[10px] block ${editingBanner.target_page === target.id ? 'text-gray-300' : 'text-gray-500'}`}>
                              {target.desc}
                            </span>
                          </div>
                          {editingBanner.target_page === target.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#fed65b] shrink-0 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload & Asset Selector */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Banner Image Upload & Gallery Assets</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={editingBanner.image_url || ''}
                          onChange={e => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Upload Local Image File</label>
                        <label className="w-full px-3 py-2 bg-[#f4f2ee] border border-[#e5e1d8] hover:bg-[#e8e4dc] rounded-xl text-xs font-bold text-[#0f1513] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-[#ba7a1a]" />
                          <span>Choose Image File...</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Preset Image Gallery */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-gray-600 block">Or select from Sculpture Heritage Preset Gallery:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PRESET_GALLERY_IMAGES.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => setEditingBanner({ ...editingBanner, image_url: img.url })}
                            className={`rounded-xl overflow-hidden border-2 cursor-pointer relative h-20 transition-all ${
                              editingBanner.image_url === img.url ? 'border-[#0f1513] ring-2 ring-[#fed65b]' : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            {editingBanner.image_url === img.url && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Check className="w-5 h-5 text-[#fed65b]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CAMPAIGN SCHEDULE & EXPIRY PRESETS */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">Campaign Active Schedule & Expiry Window</h4>
                    <p className="text-xs text-gray-500">
                      Banners will automatically activate on storefronts at the Start Date and automatically expire at the Expiry Date.
                    </p>
                  </div>

                  {/* Quick Schedule Duration Presets */}
                  <div className="space-y-2 bg-[#f9f7f3] p-4 rounded-2xl border border-[#e8e4dc]">
                    <span className="text-[11px] font-bold text-[#0f1513] uppercase tracking-wider block">
                      ⚡ 1-Click Quick Campaign Presets:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: 7, label: '⚡ +7 Days Campaign' },
                        { days: 14, label: '🔥 +14 Days Campaign' },
                        { days: 30, label: '📅 +30 Days Campaign' },
                        { days: 60, label: '🗓️ +60 Days Campaign' },
                        { days: 90, label: '✨ +90 Days Campaign' },
                        { days: 36500, label: '♾️ Never Expire' },
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => applyQuickDurationPreset(preset.days)}
                          className="px-3.5 py-1.5 bg-white border border-[#e5e1d8] hover:border-[#0f1513] hover:bg-[#0f1513] hover:text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Time Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#ba7a1a]" />
                        <span>Start Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={editingBanner.start_date ? editingBanner.start_date.slice(0, 16) : ''}
                        onChange={e => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Expiry Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={editingBanner.expiry_date ? editingBanner.expiry_date.slice(0, 16) : ''}
                        onChange={e => setEditingBanner({ ...editingBanner, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e4dc]">

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#e8e4dc] rounded-xl font-bold text-gray-600 hover:bg-[#fbfaf8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#0f1513] text-white font-bold rounded-xl hover:bg-[#1f2926] cursor-pointer shadow-md"
                >
                  {saving ? 'Saving Banner...' : 'Save & Publish Banner'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
