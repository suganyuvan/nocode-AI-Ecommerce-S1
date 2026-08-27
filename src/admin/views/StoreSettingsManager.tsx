import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Save, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Product, StoreSettings } from '../../types';

export function StoreSettingsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [settings, setSettings] = useState<StoreSettings>({
    id: 1,
    minimum_order_amount: 500000,
    gift_product_ids: [],
    is_minimum_order_rule_active: false,
    minimum_order_for_checkout: 0,
    free_shipping_threshold: 0,
    is_free_gift_active: true,
    promotion_title: 'Complimentary Handcrafted Gift',
    promotion_teaser: 'Unlock an exclusive artisanal gift on orders above',
    allow_customer_gift_selection: true
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // Live Preview State
  const [simulatedCartTotal, setSimulatedCartTotal] = useState(1500);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (settingsData) {
      setSettings(prev => ({
        ...prev,
        ...settingsData
      }));
    }

    // Fetch Products for Gift Selection
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price_inr, image, category');
      
    if (productsData) {
      setProducts(productsData.map((p: any) => ({
        ...p,
        priceINR: p.price_inr
      })));
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 1,
        ...settings
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    }
    setSaving(false);
  };

  const toggleGift = (productId: string) => {
    if (settings.gift_product_ids.includes(productId)) {
      setSettings({
        ...settings,
        gift_product_ids: settings.gift_product_ids.filter(id => id !== productId)
      });
    } else {
      setSettings({
        ...settings,
        gift_product_ids: [...settings.gift_product_ids, productId]
      });
    }
  };

  const categories = ['All Categories', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    const isEligiblePrice = product.priceINR <= 50000;
    return matchesSearch && matchesCategory && isEligiblePrice;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-[#fed65b] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Live Preview Logic
  const minOrderForGift = settings.minimum_order_amount || 0;
  const isGiftUnlocked = simulatedCartTotal >= minOrderForGift;
  const amountToGift = minOrderForGift - simulatedCartTotal;
  const progressPercentage = minOrderForGift > 0 ? Math.min(100, (simulatedCartTotal / minOrderForGift) * 100) : 100;

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[24px] border border-[#e8e4dc] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4f1] flex items-center justify-center text-[#2e6930]">
            <span className="material-symbols-outlined">redeem</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111615] tracking-tight">Promotions & Gift Rules</h2>
            <p className="text-xs text-[#747878] mt-0.5">
              Configure backend-enforced minimum order thresholds, free gift tiers, and live promotional incentive rules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e4dc] rounded-xl text-xs font-bold text-[#444748] hover:bg-[#fbfaf8] transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${saving ? 'opacity-70' : 'hover:bg-[#1f2926] hover:shadow-lg'}`}
          >
            <Save className="w-4 h-4 text-[#fed65b]" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Rules Configuration */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Minimum Order Rule Card */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0f1513] flex items-center justify-center text-[#fed65b]">
                  <span className="material-symbols-outlined text-sm">attach_money</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#111615] text-sm">Minimum Order Rule</h3>
                  <p className="text-[11px] text-[#747878]">Enforce minimum checkout subtotal</p>
                </div>
              </div>
              {/* Custom Toggle */}
              <button 
                onClick={() => setSettings({...settings, is_minimum_order_rule_active: !settings.is_minimum_order_rule_active})}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.is_minimum_order_rule_active ? 'bg-[#1b1c1c]' : 'bg-[#e5e1d8]'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.is_minimum_order_rule_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`space-y-4 ${!settings.is_minimum_order_rule_active ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1.5">Minimum Order Amount (₹) for Checkout</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-sm">₹</span>
                  <input
                    type="number"
                    value={settings.minimum_order_for_checkout}
                    onChange={(e) => setSettings({...settings, minimum_order_for_checkout: Number(e.target.value)})}
                    className="w-full pl-7 pr-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] text-sm"
                  />
                </div>
                <p className="text-[10px] text-[#747878] mt-1.5">
                  When enabled, customers must have a cart subtotal of at least ₹{settings.minimum_order_for_checkout} to place an order.
                </p>
              </div>
            </div>
          </div>

          {/* Free Gift Promotion Card */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4f1] flex items-center justify-center text-[#2e6930]">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#111615] text-sm">Free Gift Promotion</h3>
                  <p className="text-[11px] text-[#747878]">Unlock complimentary gifts at spending tiers</p>
                </div>
              </div>
              <button 
                onClick={() => setSettings({...settings, is_free_gift_active: !settings.is_free_gift_active})}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.is_free_gift_active ? 'bg-[#2e6930]' : 'bg-[#e5e1d8]'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.is_free_gift_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`space-y-4 ${!settings.is_free_gift_active ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1.5">Gift Unlock Order Value (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-sm">₹</span>
                  <input
                    type="number"
                    value={settings.minimum_order_amount}
                    onChange={(e) => setSettings({...settings, minimum_order_amount: Number(e.target.value)})}
                    className="w-full pl-7 pr-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] text-sm"
                  />
                </div>
                <p className="text-[10px] text-[#747878] mt-1.5">
                  When cart subtotal reaches ₹{settings.minimum_order_amount}, customer unlocks a free gift.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1.5">Promotion Title / Banner Header</label>
                <input
                  type="text"
                  value={settings.promotion_title}
                  onChange={(e) => setSettings({...settings, promotion_title: e.target.value})}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444748] mb-1.5">Promotional Teaser Description</label>
                <textarea
                  value={settings.promotion_teaser}
                  onChange={(e) => setSettings({...settings, promotion_teaser: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dc]">
                <div>
                  <h4 className="text-xs font-bold text-[#444748]">Allow Customer Gift Selection</h4>
                  <p className="text-[10px] text-[#747878]">Let shoppers pick from eligible gifts in cart drawer</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, allow_customer_gift_selection: !settings.allow_customer_gift_selection})}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${settings.allow_customer_gift_selection ? 'bg-[#2e6930]' : 'bg-[#e5e1d8]'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.allow_customer_gift_selection ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Eligible Gifts Card (Bottom Left) */}
          <div className="bg-[#0f1513] rounded-[24px] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2e6930]/20 flex items-center justify-center text-[#2e6930]">
                  <span className="material-symbols-outlined text-sm">redeem</span>
                </div>
                <h3 className="font-bold text-white text-sm">Active Eligible Gifts ({settings.gift_product_ids.length})</h3>
              </div>
              <span className="text-[10px] font-bold text-[#2e6930] bg-[#2e6930]/10 px-2 py-1 rounded-md uppercase tracking-wider">
                Active
              </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
              {settings.gift_product_ids.length === 0 ? (
                <p className="text-[11px] text-[#747878] italic w-full text-center py-4">No gifts selected yet.</p>
              ) : (
                products
                  .filter(p => settings.gift_product_ids.includes(p.id))
                  .map(gift => (
                    <div key={gift.id} className="flex gap-3 p-2.5 rounded-xl border border-white/10 bg-white/5 items-center shrink-0 w-48">
                      <img src={gift.image} alt={gift.name} className="w-10 h-10 rounded-lg object-cover bg-black/20" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-bold text-white truncate">{gift.name}</h4>
                        <p className="text-[11px] font-bold text-[#2e6930] mt-0.5">₹{gift.priceINR.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Product Selection & Live Preview */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Select Eligible Gift Products Card */}
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-sm p-6 flex flex-col flex-1 h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#e6f4f1] flex items-center justify-center text-[#2e6930]">
                  <span className="material-symbols-outlined text-xs">category</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#111615] text-sm">Select Eligible Gift Products</h3>
                  <p className="text-[11px] text-[#747878]">Choose which products from your inventory can be awarded as free gifts (Max ₹50,000)</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#2e6930] bg-[#e6f4f1] px-2 py-1 rounded-md">
                {settings.gift_product_ids.length} Selected
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input 
                  type="text"
                  placeholder="Search catalog by product title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-40 px-3 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37]"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
              {filteredProducts.map(product => {
                const isSelected = settings.gift_product_ids.includes(product.id);
                return (
                  <div 
                    key={product.id}
                    onClick={() => toggleGift(product.id)}
                    className={`flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer items-center ${
                      isSelected 
                        ? 'border-[#2e6930] bg-[#f5faeb] shadow-sm' 
                        : 'border-[#ece8df] hover:border-[#c4c7c7] bg-white'
                    }`}
                  >
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-[#f4f2ec]" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#111615] truncate">{product.name}</h4>
                      <p className="text-[9px] text-[#747878] font-label-caps uppercase mt-0.5">{product.category}</p>
                      <p className="text-[11px] font-bold mt-1">₹{product.priceINR.toLocaleString('en-IN')}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#2e6930] border-[#2e6930] text-white' : 'border-[#d1d5db] bg-white text-transparent'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Cart Drawer Preview Card */}
          <div className="bg-[#fbfaf8] rounded-[24px] border border-[#e8e4dc] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#747878]">
                <span className="material-symbols-outlined text-sm text-[#ba1a1a]">visibility</span>
                <h3 className="font-bold text-xs">Live Cart Drawer Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#747878]">Simulate Cart Total:</span>
                <div className="bg-white border border-[#e8e4dc] px-2 py-1 rounded-md text-xs font-bold text-[#111615]">
                  ₹{simulatedCartTotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold text-[#747878]">₹0</span>
              <input 
                type="range" 
                min="0" 
                max={Math.max(10000, settings.minimum_order_amount * 1.5)} 
                step="100"
                value={simulatedCartTotal}
                onChange={(e) => setSimulatedCartTotal(Number(e.target.value))}
                className="flex-1 h-1 bg-[#e5e1d8] rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-bold text-[#747878]">₹{(Math.max(10000, settings.minimum_order_amount * 1.5)).toLocaleString('en-IN')}</span>
            </div>

            {/* Preview Box */}
            <div className="bg-white border border-[#e8e4dc] rounded-xl p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-xs text-[#747878] flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-[#2e6930]">
                      {isGiftUnlocked ? 'redeem' : 'redeem'}
                    </span>
                    {isGiftUnlocked ? 'Congratulations! You unlocked a free gift.' : `Add ₹${amountToGift.toLocaleString('en-IN')} more for a Free Gift`}
                  </p>
                  <span className="text-[10px] font-bold text-[#747878]">{Math.floor(progressPercentage)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f4f2ec] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8c3a3a] transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
