import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MapPin, 
  AlertCircle, 
  Sparkles,
  Calendar,
  MessageCircle,
  Mail,
  Box,
  ChevronRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { getCourierTrackingUrl } from '../utils/trackingEngine';

const SAMPLE_CHIPS = [
  '#SWARNA-505175',
  'DEL-2153-530192-IN',
  'AWB-SWARNA-730656-EXP'
];

export function TrackOrderView() {
  const [query, setQuery] = useState('#SWARNA-505175');
  const [loading, setLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Auto execute default sample search on page load so customer sees live tracker instantly
    executeSearch('#SWARNA-505175');
  }, []);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    setFoundOrder(null);

    const rawQuery = searchQuery.trim().replace('#', '');
    const cleanQuery = rawQuery.toUpperCase();
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawQuery);

    const orFilter = isUuid
      ? `order_number.ilike.%${cleanQuery}%,tracking_number.ilike.%${cleanQuery}%,id.eq.${rawQuery.toLowerCase()}`
      : `order_number.ilike.%${cleanQuery}%,tracking_number.ilike.%${cleanQuery}%`;

    try {
      // 1. Search in Supabase DB by order_number or tracking_number (and id if valid UUID)
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(full_name, email, phone)')
        .or(orFilter)
        .maybeSingle();


      if (data) {
        // Fetch items for this order
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', data.id);

        setFoundOrder({
          ...data,
          itemsList: items && items.length > 0 ? items : [
            { id: '1', product_name: 'Floral Drape Saree', quantity: 1, unit_price: 3299 },
            { id: '2', product_name: '[FREE GIFT] Orange Cap', quantity: 1, unit_price: 0 }
          ]
        });
      } else {
        // Sample Fallback Mock Data for instant demonstration (matching user's request "make sure it as sample")
        const mockOrder = {
          id: 'demo-sample-id',
          order_number: `SWARNA-${cleanQuery || '60303'}`,
          status: 'shipped',
          courier_name: 'BlueDart Surface & Air',
          tracking_number: cleanQuery.includes('DEL') ? cleanQuery : `DEL-2153-530192-IN`,
          estimated_delivery_date: new Date(Date.now() + 2 * 86400000).toISOString(),
          created_at: new Date('2026-08-11T14:30:31').toISOString(),
          updated_at: new Date('2026-08-12T19:37:52').toISOString(),
          currency: 'INR',
          total_amount: 2728,
          customers: {
            full_name: 'Nirmal raj',
            email: 'nirmalrizotsmc@gmail.com',
            phone: '+918610554711'
          },
          shipping_address: {
            street: '9, West St, Uppilipalayam',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            postalCode: '641005',
            country: 'India'
          },
          itemsList: [
            { id: '1', product_name: 'Floral Drape Saree', quantity: 1, unit_price: 3299 },
            { id: '2', product_name: '[FREE GIFT] Orange Cap', quantity: 1, unit_price: 0 }
          ]
        };
        setFoundOrder(mockOrder);
      }
    } catch (err) {
      console.warn('Tracking query error:', err);
      setErrorMsg('Failed to fetch tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleChipClick = (chipText: string) => {
    setQuery(chipText);
    executeSearch(chipText);
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '₹';
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1b1c1c] pb-24 font-sans">
      
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-[#ece8df]">
        <div className="max-w-4xl mx-auto px-4 py-3 text-xs text-gray-500 flex items-center gap-1.5 font-medium">
          <a href="/" className="hover:text-black transition-colors">Home</a>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-[#111615]">Live Order & Shipment Tracker</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        
        {/* TOP HERO TRACK ORDER SEARCH FORM (MATCHING IMAGE 1 EXACTLY) */}
        <div className="text-center space-y-4 py-2">
          
          <div className="inline-flex items-center gap-1.5 bg-[#f5e9eb] text-[#853c4d] font-extrabold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
            <Truck className="w-4 h-4 text-[#853c4d]" />
            <span>LIVE SHIPMENT TRACKER</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#111615] tracking-tight">
            Track Your Order
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Enter your Order ID (e.g. <span className="font-bold text-[#853c4d]">SWARNA-505175</span>), courier AWB, or mobile number to track real-time delivery status.
          </p>

          {/* SEARCH INPUT CARD CONTAINER (MATCHING IMAGE 1) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto space-y-4 text-left">
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="DEL-2153-530192-IN or SWARNA-505175"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#d0b4ba] rounded-xl text-xs font-mono font-bold text-[#111615] focus:outline-none focus:border-[#853c4d] transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#a34a5d] hover:bg-[#853c4d] text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>TRACK ORDER</span>
                  </>
                )}
              </button>
            </form>

            {/* QUICK SEARCH SAMPLE CHIPS (MATCHING USER DIRECTIVE "make sure it as sample") */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-gray-500 text-[11px]">Quick Search:</span>
              {SAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 bg-[#f9ede9] hover:bg-[#f3ded7] text-[#853c4d] font-mono font-extrabold text-[11px] rounded-lg border border-[#f0d0c7] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-center gap-2 text-xs max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TRACKING RESULTS (MATCHING IMAGE 2 EXACTLY) */}
        {foundOrder && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* CONTAINER 1: DETAILED SHIPMENT HISTORY & MILESTONES (MATCHING IMAGE 2) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-serif text-lg font-extrabold text-[#111615] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#853c4d]" />
                  <span>Detailed Shipment History & Milestones</span>
                </h3>

                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  Status: {foundOrder.status || 'Shipped'}
                </span>
              </div>

              {/* Milestone Event Item (Matching Image 2) */}
              <div className="relative pl-6 space-y-4">
                <div className="flex items-start gap-3 relative">
                  {/* Circle Pin Icon */}
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  </div>

                  <div className="flex-1 bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-[#111615]">Dispatched via Courier</span>
                      <span className="text-xs text-gray-500 font-semibold">
                        {new Date(foundOrder.updated_at || foundOrder.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Tracking AWB assigned: <span className="font-mono font-bold text-gray-900">{foundOrder.tracking_number || 'DEL-2153-530192-IN'}</span> ({foundOrder.courier_name || 'BlueDart Surface & Air'}).
                    </p>
                    
                    <div className="flex flex-wrap justify-between items-center gap-2 pt-1 border-t border-gray-200/60">
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>Chennai Central Logistics Center, TN</span>
                      </span>

                      <a
                        href={getCourierTrackingUrl(foundOrder.courier_name, foundOrder.tracking_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        <span>Live Carrier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTAINER 2: ITEMS IN THIS SHIPMENT (MATCHING IMAGE 2) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-extrabold text-[#111615] flex items-center gap-2">
                <Box className="w-5 h-5 text-[#853c4d]" />
                <span>Items in this Shipment ({foundOrder.itemsList?.length || 2})</span>
              </h3>

              <div className="space-y-3">
                {foundOrder.itemsList.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-[#853c4d] flex items-center justify-center font-bold">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#111615]">{item.product_name}</p>
                        <p className="text-gray-500 font-semibold mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                    </div>

                    <span className="font-mono font-extrabold text-sm text-[#111615]">
                      {getCurrencySymbol(foundOrder.currency)}{Number((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CONTAINER 3: HAVE QUESTIONS ABOUT YOUR DELIVERY? BANNER (MATCHING IMAGE 2) */}
            <div className="bg-[#a34a5d] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div>
                <h4 className="font-bold text-base tracking-tight">Have questions about your delivery?</h4>
                <p className="text-xs text-rose-100 mt-0.5">
                  Our customer care team is available Mon–Sat, 10 AM to 6 PM IST to assist you.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://wa.me/918610554711"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-[#0f1513] font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-gray-100 transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Us</span>
                </a>

                <a
                  href="mailto:support@irisjev.com"
                  className="bg-[#7a3443] hover:bg-[#632936] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Email Support</span>
                </a>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
