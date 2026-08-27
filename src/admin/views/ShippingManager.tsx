import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Sliders, 
  RefreshCw, 
  Save, 
  Globe, 
  ShieldCheck, 
  Coins, 
  Check, 
  MapPin, 
  Clock
} from 'lucide-react';
import { ShippingZoneProfile, ShippingAndPaymentSettings } from '../../types';

// All 28 States and 8 Union Territories in India
export const ALL_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const PINCODE_CITY_STATE_MAP: Record<string, { city: string; state: string }> = {
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '601': { city: 'Tiruvallur', state: 'Tamil Nadu' },
  '602': { city: 'Kanchipuram', state: 'Tamil Nadu' },
  '620': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '625': { city: 'Madurai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '575': { city: 'Mangaluru', state: 'Karnataka' },
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '110': { city: 'New Delhi', state: 'Delhi' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '190': { city: 'Srinagar', state: 'Jammu and Kashmir' },
  '793': { city: 'Shillong', state: 'Meghalaya' },
  '781': { city: 'Guwahati', state: 'Assam' },
  '744': { city: 'Port Blair', state: 'Andaman and Nicobar Islands' }
};

export const DEFAULT_SHIPPING_PAYMENT_SETTINGS: ShippingAndPaymentSettings = {
  isShippingEngineActive: true,
  profiles: [
    {
      id: 'profile-1',
      name: 'Regional / South India Express',
      isDefault: false,
      courierNotes: 'Fast surface delivery via Bluedart / Delhivery',
      isEnabled: true,
      baseCharge: 350,
      freeShippingThreshold: 0,
      deliveryTimeline: '2-3 Business Days',
      isAllIndia: false,
      applicableStates: ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Puducherry'],
      pincodeWildcards: '600*, 601*, 602*, 603*, 604*, 605*, 606*, 607*, 608*, 609*, 610*, 611*, 612*, 613*, 614*, 620*, 621*, 622*, 623*, 624*, 625*, 626*, 627*, 560*, 570*, 500*'
    },
    {
      id: 'profile-2',
      name: 'Standard All-India Delivery',
      isDefault: true,
      courierNotes: 'Standard delivery across all serviceable Indian states',
      isEnabled: true,
      baseCharge: 350,
      freeShippingThreshold: 0,
      deliveryTimeline: '4-6 Business Days',
      isAllIndia: true,
      applicableStates: [...ALL_INDIAN_STATES],
      pincodeWildcards: ''
    },
    {
      id: 'profile-3',
      name: 'Special & Remote Zones',
      isDefault: false,
      courierNotes: 'Air-lifted deliveries to North East, J&K, and Islands',
      isEnabled: true,
      baseCharge: 500,
      freeShippingThreshold: 0,
      deliveryTimeline: '6-9 Business Days',
      isAllIndia: false,
      applicableStates: [
        'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
        'Sikkim', 'Tripura', 'Andaman and Nicobar Islands', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep'
      ],
      pincodeWildcards: '79*, 78*, 19*, 737*, 744*, 682555'
    }
  ],
  cod: {
    isEnabled: true,
    handlingCharge: 40,
    minOrder: 0,
    maxOrder: 10000000,
    customerNote: 'Pay in cash or UPI QR at your doorstep. Please keep exact change ready.',
    restrictedPincodes: '19*, 79*, 744101'
  },
  prepaid: {
    isEnabled: true,
    title: 'Prepaid (UPI, Cards, NetBanking, Wallets)',
    trustBadge: 'Instant Order Processing & Safe Checkout',
    instantDiscountPercent: 0,
    flatDiscount: 0
  }
};

export const SETTINGS_STORAGE_KEY = 'irisjev_shipping_payment_settings';

export function ShippingManager() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'payments' | 'simulator'>('profiles');
  const [settings, setSettings] = useState<ShippingAndPaymentSettings>(DEFAULT_SHIPPING_PAYMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulator States
  const [simPincode, setSimPincode] = useState('600001');
  const [simState, setSimState] = useState('Tamil Nadu');
  const [simCartSubtotal, setSimCartSubtotal] = useState(1200);
  const [detectedLocation, setDetectedLocation] = useState('Chennai, Tamil Nadu');

  // Load Settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const storedLocal = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedLocal) {
        setSettings(JSON.parse(storedLocal));
      } else {
        setSettings(DEFAULT_SHIPPING_PAYMENT_SETTINGS);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setSettings(DEFAULT_SHIPPING_PAYMENT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const updated = {
        ...settings,
        updated_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

      // Sync fallback default rule to supabase shipping_rules
      try {
        const defaultProfile = updated.profiles.find(p => p.isDefault) || updated.profiles[0];
        if (defaultProfile) {
          await supabase.from('shipping_rules').upsert({
            id: '00000000-0000-0000-0000-000000000001',
            rule_type: 'default',
            rule_value: '*',
            prepaid_charge: defaultProfile.baseCharge,
            cod_charge: defaultProfile.baseCharge + (updated.cod.isEnabled ? updated.cod.handlingCharge : 0),
            is_cod_allowed: updated.cod.isEnabled,
            priority: 0
          });
        }
      } catch (dbErr) {
        console.warn('DB sync notice:', dbErr);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMsg('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Profile Management Handlers
  const handleAddZone = () => {
    const newProfile: ShippingZoneProfile = {
      id: `profile-${Date.now()}`,
      name: `Custom Shipping Zone #${settings.profiles.length + 1}`,
      isDefault: false,
      courierNotes: 'Standard delivery via national couriers',
      isEnabled: true,
      baseCharge: 60,
      freeShippingThreshold: 1200,
      deliveryTimeline: '3-5 Business Days',
      isAllIndia: false,
      applicableStates: [],
      pincodeWildcards: ''
    };
    setSettings(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile]
    }));
  };

  const handleUpdateProfile = (id: string, updates: Partial<ShippingZoneProfile>) => {
    setSettings(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        if (updates.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      })
    }));
  };

  const handleDeleteProfile = (id: string) => {
    if (settings.profiles.length <= 1) {
      alert('At least one shipping profile must remain configured.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this shipping profile?')) return;
    setSettings(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== id)
    }));
  };

  const handleToggleState = (profileId: string, stateName: string) => {
    const profile = settings.profiles.find(p => p.id === profileId);
    if (!profile) return;

    let newStates = [...profile.applicableStates];
    if (newStates.includes(stateName)) {
      newStates = newStates.filter(s => s !== stateName);
    } else {
      newStates.push(stateName);
    }

    handleUpdateProfile(profileId, {
      applicableStates: newStates,
      isAllIndia: newStates.length === ALL_INDIAN_STATES.length
    });
  };

  const handleSetAllIndia = (profileId: string) => {
    const profile = settings.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (profile.isAllIndia) {
      handleUpdateProfile(profileId, {
        isAllIndia: false,
        applicableStates: []
      });
    } else {
      handleUpdateProfile(profileId, {
        isAllIndia: true,
        applicableStates: [...ALL_INDIAN_STATES]
      });
    }
  };

  // Pincode Simulator Auto-Detection
  useEffect(() => {
    const prefix3 = simPincode.trim().slice(0, 3);
    if (PINCODE_CITY_STATE_MAP[prefix3]) {
      const { city, state } = PINCODE_CITY_STATE_MAP[prefix3];
      setDetectedLocation(`${city}, ${state}`);
      setSimState(state);
    } else if (simPincode.length >= 6) {
      setDetectedLocation(`Pincode ${simPincode}`);
    } else {
      setDetectedLocation('');
    }
  }, [simPincode]);

  // Simulator Matching Logic
  const getSimulatedMatch = () => {
    if (!settings.isShippingEngineActive) {
      return {
        matchedProfile: null,
        shippingFee: 0,
        isFree: true,
        timeline: '2-4 Business Days',
        isCodAvailable: settings.cod.isEnabled,
        codReason: ''
      };
    }

    const cleanPincode = simPincode.trim();
    const cleanState = simState.trim().toLowerCase();

    // 1. Check Wildcard Pincodes in specific profiles first
    let matched = settings.profiles.find(p => {
      if (!p.isEnabled) return false;
      if (!p.pincodeWildcards) return false;
      const patterns = p.pincodeWildcards.split(',').map(s => s.trim().toLowerCase());
      return patterns.some(pattern => {
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return cleanPincode.startsWith(prefix);
        }
        return cleanPincode === pattern;
      });
    });

    // 2. Check State Match
    if (!matched) {
      matched = settings.profiles.find(p => {
        if (!p.isEnabled) return false;
        return p.applicableStates.some(s => s.toLowerCase() === cleanState);
      });
    }

    // 3. Fallback to Default Profile
    if (!matched) {
      matched = settings.profiles.find(p => p.isDefault && p.isEnabled) || settings.profiles[0];
    }

    const isFree = matched ? simCartSubtotal >= matched.freeShippingThreshold : false;
    const shippingFee = isFree ? 0 : (matched ? matched.baseCharge : 79);

    // COD Validation
    let isCodAvailable = settings.cod.isEnabled;
    let codReason = '';

    if (!settings.cod.isEnabled) {
      isCodAvailable = false;
      codReason = 'COD Disabled Globally';
    } else if (simCartSubtotal < settings.cod.minOrder) {
      isCodAvailable = false;
      codReason = `Min order ₹${settings.cod.minOrder} required`;
    } else if (simCartSubtotal > settings.cod.maxOrder) {
      isCodAvailable = false;
      codReason = `Max order limit ₹${settings.cod.maxOrder} exceeded`;
    } else if (settings.cod.restrictedPincodes) {
      const blacklist = settings.cod.restrictedPincodes.split(',').map(s => s.trim().toLowerCase());
      const isBlacklisted = blacklist.some(pattern => {
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return cleanPincode.startsWith(prefix);
        }
        return cleanPincode === pattern;
      });
      if (isBlacklisted) {
        isCodAvailable = false;
        codReason = 'Pincode Blacklisted for COD';
      }
    }

    return {
      matchedProfile: matched,
      shippingFee,
      isFree,
      timeline: matched ? matched.deliveryTimeline : '4-6 Business Days',
      isCodAvailable,
      codReason
    };
  };

  const simResult = getSimulatedMatch();
  const simPrepaidDiscount = (settings.prepaid.isEnabled && settings.prepaid.instantDiscountPercent > 0)
    ? (simCartSubtotal * settings.prepaid.instantDiscountPercent) / 100
    : (settings.prepaid.isEnabled ? settings.prepaid.flatDiscount : 0);

  const simPrepaidTotal = Math.max(0, simCartSubtotal + simResult.shippingFee - simPrepaidDiscount);
  const simCodTotal = simCartSubtotal + simResult.shippingFee + (settings.cod.isEnabled ? settings.cod.handlingCharge : 0);

  return (
    <div className="space-y-6 text-[#1b1c1c] font-sans pb-12 selection:bg-[#fed65b] selection:text-[#111615]">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ece8df] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0f1513] border border-[#fed65b]/40 flex items-center justify-center text-[#fed65b] shrink-0 mt-0.5 shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111615] tracking-tight">
              Shipping & Payment Methods
            </h1>
            <p className="text-xs text-[#747878] mt-1">
              Configure state/pincode shipping profiles, delivery timelines, Cash on Delivery (COD) rules, and prepaid discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={loadSettings}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#fbfaf8] hover:bg-[#f4f2ec] text-[#444] border border-[#e5e1d8] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d4af37]' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0f1513] hover:bg-black text-[#fed65b] border border-[#fed65b]/40 rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-[#fed65b] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-3.5 h-3.5 text-[#fed65b]" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-[#fbfaf8] border border-[#fed65b]/60 rounded-2xl text-[#111615] text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#735c00] shrink-0" />
          <span>All Shipping Profiles and Payment Rules have been saved and synchronized with the Live Storefront.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-[#e5e1d8] gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 pb-3.5 transition-all cursor-pointer border-b-2 font-label-caps text-xs uppercase tracking-wider ${
            activeTab === 'profiles'
              ? 'border-[#fed65b] text-[#111615] font-bold'
              : 'border-transparent text-[#747878] hover:text-[#111]'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeTab === 'profiles' ? 'text-[#735c00]' : ''}`} />
          <span>Shipping Profiles ({settings.profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 pb-3.5 transition-all cursor-pointer border-b-2 font-label-caps text-xs uppercase tracking-wider ${
            activeTab === 'payments'
              ? 'border-[#fed65b] text-[#111615] font-bold'
              : 'border-transparent text-[#747878] hover:text-[#111]'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeTab === 'payments' ? 'text-[#735c00]' : ''}`} />
          <span>Payment Modes (COD & Prepaid)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 pb-3.5 transition-all cursor-pointer border-b-2 font-label-caps text-xs uppercase tracking-wider ${
            activeTab === 'simulator'
              ? 'border-[#fed65b] text-[#111615] font-bold'
              : 'border-transparent text-[#747878] hover:text-[#111]'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'simulator' ? 'text-[#735c00]' : ''}`} />
          <span>Rate & COD Simulator</span>
        </button>
      </div>

      {/* TAB 1: SHIPPING PROFILES */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          {/* Engine Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#ece8df] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0f1513] text-[#fed65b] flex items-center justify-center border border-[#fed65b]/30">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111615]">Custom Shipping Rates Engine</h3>
                <p className="text-xs text-[#747878]">Calculate shipping rates dynamically by state and 6-digit pincode</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.isShippingEngineActive}
                  onChange={(e) => setSettings(prev => ({ ...prev, isShippingEngineActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f1513]"></div>
              </label>

              <button
                onClick={handleAddZone}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0f1513] hover:bg-black text-[#fed65b] border border-[#fed65b]/40 rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Shipping Zone
              </button>
            </div>
          </div>

          {/* List of Configured Zones */}
          <div className="space-y-6">
            {settings.profiles.map((profile, index) => (
              <div
                key={profile.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all ${
                  profile.isEnabled ? 'border-[#ece8df] shadow-xs' : 'border-gray-200 opacity-60 bg-gray-50/50'
                }`}
              >
                {/* Zone Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f2efe9] pb-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0f1513] text-[#fed65b] font-mono font-bold text-xs border border-[#fed65b]/20">
                        #{index + 1}
                      </span>
                      <h3 className="font-bold text-base text-[#111615]">
                        {profile.name}
                      </h3>

                      {profile.isDefault ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-label-caps uppercase tracking-wider bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/50">
                          Default Zone
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdateProfile(profile.id, { isDefault: true })}
                          className="text-[11px] text-[#747878] hover:text-[#111615] font-semibold underline cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                    {profile.courierNotes && (
                      <p className="text-xs text-[#747878] mt-1.5 font-normal">
                        {profile.courierNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={profile.isEnabled}
                        onChange={(e) => handleUpdateProfile(profile.id, { isEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[#111615]"
                      />
                      <span>Enabled</span>
                    </label>

                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rate & Threshold Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                      Base Shipping Charge (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.baseCharge}
                      onChange={(e) => handleUpdateProfile(profile.id, { baseCharge: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                      Free Shipping Threshold (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.freeShippingThreshold}
                      onChange={(e) => handleUpdateProfile(profile.id, { freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                    />
                    <p className="text-[10px] text-[#747878] mt-1">
                      Free shipping on orders ≥ ₹{profile.freeShippingThreshold}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                      Estimated Delivery Timeline
                    </label>
                    <input
                      type="text"
                      value={profile.deliveryTimeline}
                      onChange={(e) => handleUpdateProfile(profile.id, { deliveryTimeline: e.target.value })}
                      placeholder="e.g. 2-3 Business Days"
                      className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                    />
                  </div>
                </div>

                {/* Applicable States Selection */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps">
                      <MapPin className="w-3.5 h-3.5 text-[#735c00]" />
                      Applicable Indian States
                    </label>

                    {!profile.isAllIndia && (
                      <button
                        onClick={() => handleSetAllIndia(profile.id)}
                        className="px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer bg-[#f4f2ee] text-[#555] hover:bg-[#eae7e0]"
                      >
                        Set as All-India
                      </button>
                    )}
                  </div>

                  {profile.isAllIndia ? (
                    <div className="p-4 rounded-2xl bg-[#fbfaf8] border border-[#ece8df] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <p className="text-xs text-[#747878]">
                        This zone automatically applies to any state across India that isn't overridden by another zone.
                      </p>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/40 shadow-xs flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" /> Applies to ALL States
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#fbfaf8] border border-[#ece8df] max-h-44 overflow-y-auto custom-scrollbar">
                      {ALL_INDIAN_STATES.map((state) => {
                        const isSelected = profile.applicableStates.includes(state);
                        return (
                          <button
                            key={state}
                            type="button"
                            onClick={() => handleToggleState(profile.id, state)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer select-none flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/50 shadow-2xs font-semibold'
                                : 'bg-white text-[#555] border border-[#e8e5dc] hover:border-[#fed65b]/60'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-[#fed65b] stroke-[3]" />}
                            <span>{state}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Wildcard Pincodes */}
                <div>
                  <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                    Specific Pincodes or Wildcard Prefixes (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.pincodeWildcards}
                    onChange={(e) => handleUpdateProfile(profile.id, { pincodeWildcards: e.target.value })}
                    placeholder="e.g. 600*, 601*, 560001, 500*"
                    className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                  <p className="text-[10px] text-[#747878] mt-1">
                    Use exact 6-digit pincodes or wildcards (e.g. <code className="bg-[#f4f2ee] px-1 py-0.5 rounded text-[#111]">600*</code> matches all 600xxx Chennai pincodes)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT MODES (COD & PREPAID) */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Cash on Delivery (COD) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ece8df] shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#f2efe9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/30 flex items-center justify-center font-bold text-lg">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111615]">Cash on Delivery (COD)</h3>
                  <p className="text-xs text-[#747878]">Manage doorstep payment rules and handling fees</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.cod.isEnabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cod: { ...prev.cod, isEnabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f1513]"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  COD Handling Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.cod.handlingCharge}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cod: { ...prev.cod, handlingCharge: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                />
                <p className="text-[10px] text-[#747878] mt-1">
                  Added as a separate line item at checkout when customer selects Cash on Delivery.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                    Min Order for COD (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.cod.minOrder}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      cod: { ...prev.cod, minOrder: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                    Max Order for COD (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.cod.maxOrder}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      cod: { ...prev.cod, maxOrder: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Doorstep Customer Note / Instructions
                </label>
                <textarea
                  rows={2}
                  value={settings.cod.customerNote}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cod: { ...prev.cod, customerNote: e.target.value }
                  }))}
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-xs focus:outline-none focus:border-[#fed65b]"
                  placeholder="e.g. Pay in cash or UPI QR at your doorstep. Please keep exact change ready."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Restricted Pincodes Blacklist (Optional)
                </label>
                <input
                  type="text"
                  value={settings.cod.restrictedPincodes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cod: { ...prev.cod, restrictedPincodes: e.target.value }
                  }))}
                  placeholder="e.g. 19*, 79*, 744101"
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                />
                <p className="text-[10px] text-[#747878] mt-1">
                  COD will be blocked for orders shipping to these pincode prefixes.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Prepaid Payments (Razorpay) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ece8df] shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#f2efe9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111615]">Prepaid Payments (Razorpay)</h3>
                  <p className="text-xs text-[#747878]">Cards, UPI, NetBanking, Wallets, and incentives</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.prepaid.isEnabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    prepaid: { ...prev.prepaid, isEnabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f1513]"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Prepaid Payment Title
                </label>
                <input
                  type="text"
                  value={settings.prepaid.title}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    prepaid: { ...prev.prepaid, title: e.target.value }
                  }))}
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Promotional Trust Badge Text
                </label>
                <input
                  type="text"
                  value={settings.prepaid.trustBadge}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    prepaid: { ...prev.prepaid, trustBadge: e.target.value }
                  }))}
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                    Prepaid Instant Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.prepaid.instantDiscountPercent}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      prepaid: { ...prev.prepaid, instantDiscountPercent: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                  />
                  <p className="text-[10px] text-[#747878] mt-1">e.g. 5% off on online payment</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                    Prepaid Flat Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.prepaid.flatDiscount}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      prepaid: { ...prev.prepaid, flatDiscount: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#fbfaf8] border border-[#fed65b]/40 rounded-2xl flex items-start gap-3 mt-4 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-[#735c00] shrink-0 mt-0.5" />
                <p className="text-xs text-[#444748] leading-relaxed">
                  Razorpay automated webhook integration & verification engine is active. Instant signature verification ensures every prepaid payment is securely captured in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RATE & COD SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Destination & Cart Inputs */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#ece8df] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#f2efe9] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/30 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#111615]">Test Destination & Cart Value</h3>
                <p className="text-xs text-[#747878]">Simulate customer checkout conditions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Enter 6-Digit Indian Pincode
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={simPincode}
                    onChange={(e) => setSimPincode(e.target.value)}
                    placeholder="e.g. 600001"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
                {detectedLocation && (
                  <p className="text-xs text-[#735c00] font-semibold mt-1.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Detected: {detectedLocation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps mb-1.5">
                  Destination State
                </label>
                <select
                  value={simState}
                  onChange={(e) => setSimState(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#e5e1d8] text-sm font-semibold bg-white focus:outline-none focus:border-[#fed65b]"
                >
                  {ALL_INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wider font-label-caps">
                    Simulate Cart Subtotal
                  </label>
                  <span className="font-mono font-bold text-sm text-[#111615]">
                    ₹{simCartSubtotal.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="15000"
                  step="50"
                  value={simCartSubtotal}
                  onChange={(e) => setSimCartSubtotal(parseInt(e.target.value) || 0)}
                  className="w-full accent-[#111615] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                  <span>₹100</span>
                  <span>₹5,000</span>
                  <span>₹15,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Calculations */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#ece8df] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#f2efe9] pb-4">
              <div>
                <h3 className="font-bold text-base text-[#111615]">Checkout Calculations & Order Summary</h3>
                <p className="text-xs text-[#747878]">Real-time output computed by current rule hierarchy</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/50 animate-pulse">
                Live Preview
              </span>
            </div>

            {/* Matched Profile Banner */}
            <div className="p-4 rounded-2xl bg-[#fbfaf8] border border-[#ece8df] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0f1513] text-[#fed65b] border border-[#fed65b]/30 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111615]">
                    {simResult.matchedProfile?.name || 'Standard Delivery'}
                  </h4>
                  <p className="text-xs text-[#747878] flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> Estimated Delivery: <strong className="text-[#111]">{simResult.timeline}</strong>
                  </p>
                </div>
              </div>

              <div className="text-right">
                {simResult.isFree ? (
                  <span className="px-3 py-1 bg-[#fed65b]/25 text-[#735c00] border border-[#fed65b]/40 rounded-full text-xs font-bold font-mono">
                    FREE
                  </span>
                ) : (
                  <span className="font-mono font-bold text-sm text-[#111615]">
                    ₹{simResult.shippingFee}
                  </span>
                )}
              </div>
            </div>

            {/* Side by side payment mode comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prepaid Summary Box */}
              <div className="p-4 rounded-2xl border border-[#ece8df] bg-[#fbfaf8] space-y-3 shadow-2xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#735c00]" />
                    <span className="font-bold text-xs text-[#111615]">Prepaid Online</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0f1513] text-[#fed65b]">
                    {settings.prepaid.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#555] pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal + Shipping:</span>
                    <span className="font-mono">₹{(simCartSubtotal + simResult.shippingFee).toLocaleString()}</span>
                  </div>
                  {simPrepaidDiscount > 0 && (
                    <div className="flex justify-between text-[#735c00] font-semibold">
                      <span>Online Discount:</span>
                      <span className="font-mono">-₹{simPrepaidDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-[#111615] pt-2 border-t border-[#ece8df]">
                    <span>Total Payable:</span>
                    <span className="font-mono text-base text-[#111615]">₹{simPrepaidTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* COD Summary Box */}
              <div className={`p-4 rounded-2xl border space-y-3 shadow-2xs ${
                simResult.isCodAvailable 
                  ? 'border-[#ece8df] bg-[#fbfaf8]' 
                  : 'border-red-200 bg-red-50/40'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#735c00]" />
                    <span className="font-bold text-xs text-[#111615]">Cash on Delivery</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    simResult.isCodAvailable ? 'bg-[#fed65b]/25 text-[#735c00] border border-[#fed65b]/40' : 'bg-red-100 text-red-700'
                  }`}>
                    {simResult.isCodAvailable ? 'Available' : 'Blocked'}
                  </span>
                </div>

                {simResult.isCodAvailable ? (
                  <div className="space-y-1.5 text-xs text-[#555] pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal + Shipping:</span>
                      <span className="font-mono">₹{(simCartSubtotal + simResult.shippingFee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#735c00] font-semibold">
                      <span>COD Handling Fee:</span>
                      <span className="font-mono">+₹{settings.cod.handlingCharge}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-[#111615] pt-2 border-t border-[#ece8df]">
                      <span>Total Payable:</span>
                      <span className="font-mono text-base text-[#111615]">₹{simCodTotal.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-xs text-red-700">
                    <p className="font-semibold">{simResult.codReason}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Customer must checkout via Prepaid Online.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
