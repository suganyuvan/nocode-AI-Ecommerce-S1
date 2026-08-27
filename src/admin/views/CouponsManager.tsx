import React, { useEffect, useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  RefreshCw, 
  Check, 
  Copy, 
  Trash2, 
  Edit3, 
  FlaskConical, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp, 
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { Coupon, CouponUsage, CustomerOrderEligibility } from '../../types';
import { 
  fetchCoupons, 
  saveCoupon, 
  deleteCoupon, 
  toggleCouponActive, 
  validateCoupon, 
  fetchCouponUsages 
} from '../../utils/couponEngine';

export function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'directory' | 'simulator' | 'logs'>('directory');

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'exhausted' | 'disabled'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulator State
  const [simCode, setSimCode] = useState('');
  const [simCartSubtotal, setSimCartSubtotal] = useState(2500);
  const [simCustomerEmail, setSimCustomerEmail] = useState('collector@irisjev.com');
  const [simOrderCount, setSimOrderCount] = useState(1);
  const [simDate, setSimDate] = useState(new Date().toISOString().slice(0, 16));
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedCoupons, fetchedUsages] = await Promise.all([
      fetchCoupons(),
      fetchCouponUsages()
    ]);
    setCoupons(fetchedCoupons);
    setUsages(fetchedUsages);
    setLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    await toggleCouponActive(id, !currentState);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentState } : c));
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    await deleteCoupon(id);
    setCoupons(prev => prev.filter(c => c.id !== id));
    setNotice({ type: 'success', message: `Coupon "${code}" deleted successfully.` });
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ['SWARNA', 'IRIS', 'WOOD', 'ROYAL', 'CRAFT', 'HERITAGE', 'LUXE', 'FESTIVE'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedCode = `${randomPrefix}-${suffix}`;
    setEditingCoupon(prev => prev ? { ...prev, code: generatedCode } : { code: generatedCode });
  };

  const handleOpenCreateModal = () => {
    const defaultStart = new Date().toISOString().slice(0, 16);
    const defaultExpiry = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16);

    const prefixes = ['SWARNA', 'IRIS', 'WOOD', 'ROYAL', 'CRAFT'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setEditingCoupon({
      code: `${randomPrefix}-${suffix}`,
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      max_discount_amount: 2000,
      min_cart_amount: 1000,
      min_usage_count: 0,
      max_usage_count: 100,
      max_usage_per_customer: 1,
      customer_order_eligibility: 'all',
      min_previous_orders: 0,
      max_previous_orders: 99,
      start_date: defaultStart,
      expiry_date: defaultExpiry,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon({
      ...coupon,
      start_date: new Date(coupon.start_date).toISOString().slice(0, 16),
      expiry_date: new Date(coupon.expiry_date).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleApplyExpiryPreset = (days: number) => {
    if (!editingCoupon) return;
    const baseDate = editingCoupon.start_date ? new Date(editingCoupon.start_date) : new Date();
    const targetDate = new Date(baseDate.getTime() + days * 86400000);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hours = String(targetDate.getHours()).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;

    setEditingCoupon({
      ...editingCoupon,
      expiry_date: formatted
    });
  };

  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code?.trim()) {
      setNotice({ type: 'error', message: 'Coupon Code is required.' });
      return;
    }

    setSaving(true);
    setNotice(null);

    const res = await saveCoupon(editingCoupon);
    if (res.success) {
      setNotice({ type: 'success', message: `Coupon "${editingCoupon.code?.toUpperCase()}" saved successfully.` });
      setIsModalOpen(false);
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to save coupon.' });
    }
    setSaving(false);
  };

  const handleRunSimulation = async () => {
    if (!simCode.trim()) return;
    setSimulating(true);
    const res = await validateCoupon({
      code: simCode,
      cartSubtotal: Number(simCartSubtotal),
      customerEmail: simCustomerEmail,
      customerOrderCount: Number(simOrderCount),
      currentDateTime: simDate
    });
    setSimResult(res);
    setSimulating(false);
  };

  // Helper status calculator
  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return 'disabled';
    const now = new Date().getTime();
    const start = new Date(coupon.start_date).getTime();
    const expiry = new Date(coupon.expiry_date).getTime();

    if (now < start) return 'scheduled';
    if (now > expiry) return 'expired';
    if (coupon.max_usage_count !== null && coupon.max_usage_count !== undefined && coupon.current_usage_count >= coupon.max_usage_count) {
      return 'exhausted';
    }
    return 'active';
  };

  // Filtering
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const status = getCouponStatus(c);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const activeCount = coupons.filter(c => getCouponStatus(c) === 'active').length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.current_usage_count || 0), 0);
  const totalSavingsGiven = usages.reduce((acc, u) => acc + (u.discount_applied || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="w-10 h-10 border-4 border-[#fed65b] border-t-[#0f1513] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-gray-500">Loading Coupon Engine & Dynamic Rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0f1513] flex items-center justify-center text-[#fed65b] shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111615] tracking-tight">Coupon & Promotion Engine</h1>
              <span className="bg-[#fed65b]/20 text-[#0f1513] border border-[#fed65b]/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ADVANCED RULES
              </span>
            </div>
            <p className="text-xs text-[#747878] mt-0.5">
              Backend-enforced discount codes with usage caps, repeat order targeting, and start/expiry scheduling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={loadData}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#e8e4dc] rounded-xl text-xs font-bold text-[#444748] hover:bg-[#fbfaf8] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:bg-[#1f2926] hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#fed65b]" />
            <span>Create New Coupon</span>
          </button>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Total Coupons</p>
            <h3 className="text-2xl font-bold text-[#111615]">{coupons.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Active & Live</p>
            <h3 className="text-2xl font-bold text-emerald-700">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Total Redemptions</p>
            <h3 className="text-2xl font-bold text-[#111615]">{totalRedemptions}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#e8e4dc] shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#747878] uppercase tracking-wider">Total Customer Savings</p>
            <h3 className="text-2xl font-bold text-purple-900">₹{totalSavingsGiven.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#e8e4dc] gap-6 px-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'directory' ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-[#747878] hover:text-[#111615]'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Coupons Directory ({coupons.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('simulator');
            if (coupons.length > 0 && !simCode) {
              setSimCode(coupons[0].code);
            }
          }}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'simulator' ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-[#747878] hover:text-[#111615]'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-[#ba7a1a]" />
          <span>Live Validation Test Bench</span>
          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">SIMULATOR</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs' ? 'border-[#0f1513] text-[#0f1513]' : 'border-transparent text-[#747878] hover:text-[#111615]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Redemption Logs ({usages.length})</span>
        </button>
      </div>

      {/* TAB 1: COUPONS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-2xl border border-[#e8e4dc]">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by coupon code or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none focus:border-[#0f1513]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {(['all', 'active', 'scheduled', 'expired', 'exhausted', 'disabled'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-[#0f1513] text-white shadow-xs' 
                      : 'bg-[#f4f2ee] text-[#444748] hover:bg-[#e8e4dc]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Coupons Table / Cards Grid */}
          {filteredCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e4dc] p-12 text-center space-y-3">
              <Ticket className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-base text-gray-700">No coupons found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No coupons match your search query or selected filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {filteredCoupons.map(coupon => {
                const status = getCouponStatus(coupon);
                const isUnlimited = coupon.max_usage_count === null || coupon.max_usage_count === undefined;
                const progressPercent = isUnlimited ? 0 : Math.min(100, ((coupon.current_usage_count || 0) / (coupon.max_usage_count || 1)) * 100);

                return (
                  <div 
                    key={coupon.id}
                    className="bg-white rounded-2xl border border-[#e8e4dc] p-5 space-y-4 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    {/* Status accent border top */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      status === 'active' ? 'bg-emerald-500' :
                      status === 'scheduled' ? 'bg-amber-500' :
                      status === 'expired' ? 'bg-red-500' :
                      status === 'exhausted' ? 'bg-purple-500' : 'bg-gray-300'
                    }`} />

                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-2 pt-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg text-[#0f1513] tracking-wide bg-[#f4f2ee] px-2.5 py-1 rounded-lg border border-[#e5e1d8]">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1.5 text-gray-400 hover:text-[#0f1513] hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            title="Copy Coupon Code"
                          >
                            {copiedCode === coupon.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#747878] mt-1.5 line-clamp-2">
                          {coupon.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Status Badge & Toggle */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                          status === 'expired' ? 'bg-red-100 text-red-800' :
                          status === 'exhausted' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {status}
                        </span>

                        {/* Active Toggle Switch */}
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            coupon.is_active ? 'bg-[#0f1513]' : 'bg-[#e5e1d8]'
                          }`}
                          title={coupon.is_active ? 'Disable Coupon' : 'Enable Coupon'}
                        >
                          <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                            coupon.is_active ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Discount & Min Cart Value Highlights */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#fcfaf7] rounded-xl border border-[#efece6] text-xs">
                      <div>
                        <span className="text-[10px] text-[#747878] uppercase font-bold tracking-wider block">Discount Value</span>
                        <span className="font-bold text-[#0f1513] text-sm">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}% OFF`
                            : coupon.discount_type === 'free_shipping'
                            ? '🚚 FREE SHIPPING'
                            : `₹${coupon.discount_value.toLocaleString('en-IN')} OFF`}
                          {coupon.max_discount_amount && coupon.discount_type === 'percentage' && (
                            <span className="text-[10px] text-gray-500 block font-normal">Cap: ₹{coupon.max_discount_amount.toLocaleString('en-IN')}</span>
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#747878] uppercase font-bold tracking-wider block">Min Cart Value</span>
                        <span className="font-bold text-[#0f1513] text-sm">
                          ₹{coupon.min_cart_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Rules Grid */}
                    <div className="space-y-2 text-xs text-[#444748]">
                      {/* Customer Target Rule */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="flex items-center gap-1.5 text-[#747878]">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>Order Eligibility:</span>
                        </span>
                        <span className="font-bold text-[#0f1513]">
                          {coupon.customer_order_eligibility === 'all' && 'All Orders'}
                          {coupon.customer_order_eligibility === 'first_order_only' && '1st Order Only'}
                          {coupon.customer_order_eligibility === 'repeat_orders_only' && 'Repeat Orders Only (>=1)'}
                          {coupon.customer_order_eligibility === 'custom_range' && `Orders ${coupon.min_previous_orders || 0} to ${coupon.max_previous_orders || '∞'}`}
                        </span>
                      </div>

                      {/* Usage Limits Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#747878]">Global Usage:</span>
                          <span className="font-bold text-[#0f1513]">
                            {coupon.current_usage_count} / {isUnlimited ? '∞ Unlimited' : coupon.max_usage_count}
                            <span className="text-[10px] text-gray-400 font-normal ml-1">({coupon.max_usage_per_customer}/user)</span>
                          </span>
                        </div>
                        {!isUnlimited && (
                          <div className="w-full h-1.5 bg-[#e8e4dc] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${progressPercent >= 100 ? 'bg-red-500' : 'bg-[#0f1513]'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Schedule Validity */}
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#f0ede6]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Valid:</span>
                        </span>
                        <span className="font-mono">
                          {new Date(coupon.start_date).toLocaleDateString('en-IN')} - {new Date(coupon.expiry_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0ede6]">
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="px-3 py-1.5 rounded-lg border border-[#e8e4dc] text-xs font-bold text-gray-700 hover:bg-[#fbfaf8] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE VALIDATION TEST BENCH (SIMULATOR) */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulation Form Controls */}
          <div className="lg:col-span-6 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[#111615]">Coupon Rule Simulator</h2>
                <p className="text-xs text-[#747878]">Test any coupon code against simulated order parameters</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Coupon Code to Test</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simCode}
                    onChange={e => setSimCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-mono uppercase font-bold text-sm"
                  />
                  <select
                    onChange={e => setSimCode(e.target.value)}
                    className="px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs"
                  >
                    <option value="">Quick Pick...</option>
                    {coupons.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Simulated Cart Subtotal (₹)</label>
                <input
                  type="number"
                  value={simCartSubtotal}
                  onChange={e => setSimCartSubtotal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  value={simCustomerEmail}
                  onChange={e => setSimCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer Past Completed Orders Count</label>
                <input
                  type="number"
                  value={simOrderCount}
                  onChange={e => setSimOrderCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1">Set 0 for new 1st-time customer, 1+ for repeat customers.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Simulated Execution Date & Time</label>
                <input
                  type="datetime-local"
                  value={simDate}
                  onChange={e => setSimDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="w-full py-3 bg-[#0f1513] text-white font-bold rounded-xl hover:bg-[#1f2926] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <FlaskConical className="w-4 h-4 text-[#fed65b]" />
                <span>{simulating ? 'Evaluating Rules Engine...' : 'Run Simulation Test'}</span>
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="lg:col-span-6 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#111615] flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Evaluation Output & Engine Diagnostics</span>
              </h3>

              {!simResult ? (
                <div className="p-12 text-center space-y-2 border-2 border-dashed border-[#e8e4dc] rounded-2xl bg-[#fcfaf7]">
                  <FlaskConical className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-600">No Simulation Executed</p>
                  <p className="text-[11px] text-gray-400">Select a coupon code and click "Run Simulation Test" to verify rules.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    simResult.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {simResult.isValid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {simResult.isValid ? 'VALID & PASS' : 'REJECTED / INVALID'}
                      </h4>
                      <p className="text-xs mt-0.5">{simResult.message}</p>
                    </div>
                  </div>

                  {/* Diagnostic Table */}
                  <div className="bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl p-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#e8e4dc]">
                      <span className="text-gray-500">Tested Code:</span>
                      <span className="font-bold text-black">{simCode.toUpperCase()}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#e8e4dc]">
                      <span className="text-gray-500">Calculated Discount:</span>
                      <span className="font-bold text-emerald-700">₹{simResult.discountAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#e8e4dc]">
                      <span className="text-gray-500">Net Payable Total:</span>
                      <span className="font-bold text-black">₹{(simCartSubtotal - simResult.discountAmount).toLocaleString('en-IN')}</span>
                    </div>

                    {simResult.errorReason && (
                      <div className="flex justify-between py-1 text-red-700">
                        <span>Rejection Code:</span>
                        <span className="font-bold">{simResult.errorReason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 mt-6 space-y-1">
              <span className="font-bold block">💡 Admin Tip:</span>
              <p>
                The validation engine runs the exact same function that enforces coupon eligibility during live customer checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REDEMPTION AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#e8e4dc] flex justify-between items-center">
            <div>
              <h2 className="font-bold text-base text-[#111615]">Coupon Redemption Audit Log</h2>
              <p className="text-xs text-[#747878]">Real-time history of customer coupon usages</p>
            </div>
            <span className="bg-[#f4f2ee] text-[#0f1513] text-xs font-bold px-3 py-1 rounded-full">
              {usages.length} Total Usages
            </span>
          </div>

          {usages.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs">No coupon redemptions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfaf7] border-b border-[#e8e4dc] uppercase font-bold text-[10px] text-[#747878] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Coupon Code</th>
                    <th className="py-3 px-5">Customer Email</th>
                    <th className="py-3 px-5">Order Reference</th>
                    <th className="py-3 px-5">Discount Given</th>
                    <th className="py-3 px-5">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {usages.map(u => (
                    <tr key={u.id} className="hover:bg-[#fbfaf8]">
                      <td className="py-3 px-5 font-mono font-bold text-[#0f1513]">{u.coupon_code || 'COUPON'}</td>
                      <td className="py-3 px-5 text-gray-700">{u.customer_email}</td>
                      <td className="py-3 px-5 font-mono text-gray-500">{u.order_id || 'N/A'}</td>
                      <td className="py-3 px-5 font-bold text-emerald-700">₹{u.discount_applied.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-5 text-gray-500">
                        {new Date(u.used_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL DRAWER */}
      {isModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[24px] border border-[#e8e4dc] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e8e4dc] flex justify-between items-center bg-[#0f1513] text-white">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-[#fed65b]" />
                <div>
                  <h3 className="font-bold text-base">
                    {editingCoupon.id ? 'Edit Coupon & Advanced Rules' : 'Create New Coupon'}
                  </h3>
                  <p className="text-[11px] text-[#fed65b]/80">Configure discount logic, schedule, and targeting</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveCouponSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 text-xs">
              
              {/* Basic Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">1. Basic Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block font-bold text-gray-700">Coupon Code *</label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="text-[11px] font-bold text-[#0f1513] hover:text-[#ba7a1a] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Generate random promo code"
                      >
                        <Sparkles className="w-3 h-3 text-[#fed65b] fill-[#fed65b]" />
                        <span>Auto Generate</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        value={editingCoupon.code || ''}
                        onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. WELCOME10"
                        className="w-full pl-3 pr-24 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-mono uppercase font-bold text-sm focus:border-[#0f1513] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="absolute right-1.5 px-2.5 py-1 bg-[#0f1513] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#1f2926] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-[#fed65b]" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Discount Type *</label>
                    <select
                      value={editingCoupon.discount_type || 'percentage'}
                      onChange={e => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="free_shipping">🚚 Free Shipping (₹0 Shipping Fee)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {editingCoupon.discount_type === 'percentage' ? 'Discount Percentage (%) *' : 'Fixed Discount Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingCoupon.discount_value || 0}
                      onChange={e => setEditingCoupon({ ...editingCoupon, discount_value: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      placeholder="Optional (e.g. 2000)"
                      value={editingCoupon.max_discount_amount || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, max_discount_amount: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Leave blank for uncapped fixed or percentage discounts.</p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description / Internal Note</label>
                  <input
                    type="text"
                    value={editingCoupon.description || ''}
                    onChange={e => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                    placeholder="e.g. 10% Welcome discount for first-time woodcraft collectors"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Order & Usage Restrictions */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">2. Usage Limits & Cart Requirements</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Min Cart Value (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingCoupon.min_cart_amount ?? 0}
                      onChange={e => setEditingCoupon({ ...editingCoupon, min_cart_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Min Global Usages</label>
                    <input
                      type="number"
                      min="0"
                      value={editingCoupon.min_usage_count ?? 0}
                      onChange={e => setEditingCoupon({ ...editingCoupon, min_usage_count: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Unlock threshold</p>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Max Global Usages Limit</label>
                    <input
                      type="number"
                      placeholder="Blank = Unlimited"
                      value={editingCoupon.max_usage_count || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, max_usage_count: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Total global usage cap</p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Max Usage Limit Per Customer *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingCoupon.max_usage_per_customer ?? 1}
                    onChange={e => setEditingCoupon({ ...editingCoupon, max_usage_per_customer: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-bold focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Restricts how many times an individual email address can redeem this code.</p>
                </div>
              </div>

              {/* Customer Repeated Order Targeting */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">3. Customer Order History Eligibility</h4>
                
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Order Targeting Criteria *</label>
                  <select
                    value={editingCoupon.customer_order_eligibility || 'all'}
                    onChange={e => setEditingCoupon({ ...editingCoupon, customer_order_eligibility: e.target.value as CustomerOrderEligibility })}
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  >
                    <option value="all">All Orders (New & Returning Customers)</option>
                    <option value="first_order_only">1st Order Only (New Customers)</option>
                    <option value="repeat_orders_only">Repeat Orders Only (Loyal Returning Customers)</option>
                    <option value="custom_range">Custom Order Count Range (e.g. 2nd to 5th Order)</option>
                  </select>
                </div>

                {editingCoupon.customer_order_eligibility === 'custom_range' && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">Min Past Orders Required</label>
                      <input
                        type="number"
                        min="0"
                        value={editingCoupon.min_previous_orders ?? 0}
                        onChange={e => setEditingCoupon({ ...editingCoupon, min_previous_orders: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">Max Past Orders Allowed</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={editingCoupon.max_previous_orders || ''}
                        onChange={e => setEditingCoupon({ ...editingCoupon, max_previous_orders: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule & Master Switch */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-[#111615] border-b pb-2 border-gray-200">4. Schedule & Active Status</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCoupon.start_date || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Expiry Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingCoupon.expiry_date || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Expiry Presets / Suggestions */}
                <div className="space-y-1.5 p-3 bg-[#fcfaf7] border border-[#efece6] rounded-xl">
                  <span className="text-[11px] font-bold text-[#0f1513] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ba7a1a]" />
                    <span>Quick Duration Presets (automatically sets Expiry Date from Start Date):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: '+30 Days (1 Month)', days: 30 },
                      { label: '+60 Days (2 Months)', days: 60 },
                      { label: '+90 Days (3 Months)', days: 90 },
                      { label: '+120 Days (4 Months)', days: 120 },
                      { label: '+180 Days (6 Months)', days: 180 },
                      { label: '+365 Days (1 Year)', days: 365 },
                      { label: 'Never Expire (10 Years)', days: 3650 },
                    ].map(preset => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => handleApplyExpiryPreset(preset.days)}
                        className="px-2.5 py-1 bg-white hover:bg-[#0f1513] hover:text-[#fed65b] text-[#0f1513] border border-[#e5e1d8] hover:border-[#0f1513] rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-[#fed65b]" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>


                <div className="flex items-center justify-between p-3 bg-[#fbfaf8] border border-[#e8e4dc] rounded-xl">
                  <div>
                    <span className="font-bold text-xs text-[#111615] block">Enable Coupon Immediately</span>
                    <span className="text-[10px] text-gray-500">Controls master availability</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon({ ...editingCoupon, is_active: !editingCoupon.is_active })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      editingCoupon.is_active ? 'bg-[#0f1513]' : 'bg-[#e5e1d8]'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      editingCoupon.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

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
                  {saving ? 'Saving Coupon...' : 'Save & Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
