import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
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
  PhoneCall,
  Compass,
  ArrowRight
} from 'lucide-react';
import { getCourierTrackingUrl } from '../utils/trackingEngine';

const SAMPLE_CHIPS = [
  '#SWARNA-505175',
  'DEL-2153-530192-IN',
  'AWB-SWARNA-730656-EXP'
];

export function TrackOrderView() {
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('#SWARNA-505175');
  const [loading, setLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. URL Parameter & Hash Reader Effect (/track/:orderId, /track?order=..., /track#...)
  useEffect(() => {
    const paramOrder = orderId || searchParams.get('order') || searchParams.get('id') || searchParams.get('q');
    const hashOrder = location.hash ? location.hash.replace('#', '') : null;
    const initialQuery = paramOrder || hashOrder || '#SWARNA-505175';

    const formattedQuery = initialQuery.startsWith('#') ? initialQuery : `#${initialQuery}`;
    setQuery(formattedQuery);
    executeSearch(formattedQuery, false);
  }, [orderId, searchParams, location.hash]);

  const executeSearch = async (searchQuery: string, updateUrl: boolean = true) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    setFoundOrder(null);

    const rawQuery = searchQuery.trim().replace('#', '');
    const cleanQuery = rawQuery.toUpperCase();

    // Dynamically update URL query param without refreshing if requested
    if (updateUrl && rawQuery) {
      setSearchParams({ order: rawQuery }, { replace: true });
    }

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawQuery);
    const orFilter = isUuid
      ? `order_number.ilike.%${cleanQuery}%,tracking_number.ilike.%${cleanQuery}%,id.eq.${rawQuery.toLowerCase()}`
      : `order_number.ilike.%${cleanQuery}%,tracking_number.ilike.%${cleanQuery}%`;

    try {
      // Query Supabase DB orders table
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(full_name, email, phone)')
        .or(orFilter)
        .maybeSingle();

      if (data) {
        // Fetch items for this order from order_items table
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', data.id);

        setFoundOrder({
          ...data,
          itemsList: items && items.length > 0 ? items : [
            { id: '1', product_name: 'Solid Teakwood Hand-carved Ganesha Sculpture (18")', quantity: 1, unit_price: 24500 },
            { id: '2', product_name: '[COMPLIMENTARY] Organic Beeswax Timber Care Polish', quantity: 1, unit_price: 0 }
          ]
        });
      } else {
        // Sample Fallback Mock Data matching Swarna Wooden Crafts luxury theme
        const isExp = cleanQuery.includes('EXP');
        const mockOrder = {
          id: 'demo-sample-id',
          order_number: cleanQuery.startsWith('SWARNA') ? cleanQuery : `SWARNA-${cleanQuery || '505175'}`,
          status: 'shipped',
          courier_name: isExp ? 'FedEx Priority Air' : 'BlueDart Express',
          tracking_number: cleanQuery.includes('DEL') || cleanQuery.includes('AWB') ? cleanQuery : `DEL-2153-530192-IN`,
          estimated_delivery_date: new Date(Date.now() + 2 * 86400000).toISOString(),
          created_at: new Date('2026-08-11T14:30:31').toISOString(),
          updated_at: new Date('2026-08-12T19:37:52').toISOString(),
          currency: 'INR',
          total_amount: 24500,
          customers: {
            full_name: 'Nirmal Raj',
            email: 'nirmal@example.com',
            phone: '+91 98400 12345'
          },
          shipping_address: {
            street: '9, West Street, Uppilipalayam',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            postalCode: '641005',
            country: 'India'
          },
          itemsList: [
            { id: '1', product_name: 'Solid Teakwood Hand-carved Ganesha Sculpture (18")', quantity: 1, unit_price: 24500 },
            { id: '2', product_name: '[COMPLIMENTARY] Organic Beeswax Timber Care Polish', quantity: 1, unit_price: 0 }
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
    executeSearch(query, true);
  };

  const handleChipClick = (chipText: string) => {
    setQuery(chipText);
    executeSearch(chipText, true);
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'OMR': return 'ر.ع.';
      case 'JPY': return '¥';
      default: return '₹';
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-[#1b1c1c] pb-24 font-body-md">
      
      {/* Breadcrumb Navigation Header */}
      <div className="bg-[#f4efe6]/60 border-b border-[#c4c7c7]/30">
        <div className="max-w-4xl mx-auto px-4 py-3 text-xs text-[#444748] flex items-center gap-1.5 font-label-caps uppercase tracking-wider">
          <Link to="/" className="hover:text-[#1c1b1b] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#747878]" />
          <span className="font-bold text-[#1c1b1b]">Live Order & Shipment Tracker</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        
        {/* HERO TRACK ORDER HEADER */}
        <div className="text-center space-y-4 py-2">
          <div className="inline-flex items-center gap-1.5 bg-[#f4efe6] text-[#735c00] border border-[#e0d6c3] font-label-caps uppercase tracking-widest text-[11px] font-bold px-4 py-1.5 rounded-full shadow-2xs">
            <Truck className="w-4 h-4 text-[#735c00]" />
            <span>Live Shipment Tracker</span>
          </div>

          <h1 className="font-display-lg text-3xl sm:text-4xl font-bold text-[#1c1b1b] tracking-tight">
            Track Your Order
          </h1>

          <p className="text-xs sm:text-sm text-[#444748] max-w-md mx-auto leading-relaxed">
            Enter your Order ID (e.g. <span className="font-bold text-[#735c00]">#SWARNA-505175</span>), courier AWB, or mobile number to track real-time delivery status.
          </p>

          {/* SEARCH FORM CONTAINER */}
          <div className="bg-white p-6 rounded-2xl border border-[#c4c7c7]/40 shadow-sm max-w-xl mx-auto space-y-4 text-left">
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747878]" />
                <input
                  type="text"
                  required
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. SWARNA-505175 or DEL-2153-530192-IN"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#c4c7c7] rounded-xl text-xs font-mono font-bold text-[#1c1b1b] focus:outline-none focus:border-[#735c00] focus:ring-1 focus:ring-[#735c00] transition-colors"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#1c1b1b] hover:bg-[#313030] text-[#fed65b] font-label-caps font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 text-xs uppercase tracking-widest shrink-0 border border-[#735c00]/30"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#fed65b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>TRACK ORDER</span>
                  </>
                )}
              </button>
            </form>

            {/* QUICK SEARCH SAMPLE CHIPS */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-[#444748] text-[11px] uppercase tracking-wider">Quick Search:</span>
              {SAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 bg-[#f4efe6] hover:bg-[#e9e2d3] text-[#1c1b1b] font-mono font-bold text-[11px] rounded-lg border border-[#d9cfb8] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-xl flex items-center gap-2 text-xs max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TRACKING RESULTS SECTION */}
        {foundOrder && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* CONTAINER 1: DETAILED SHIPMENT HISTORY & MILESTONES */}
            <div className="bg-white p-6 rounded-2xl border border-[#c4c7c7]/40 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#c4c7c7]/30 pb-3">
                <h3 className="font-display-lg text-lg font-bold text-[#1c1b1b] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#735c00]" />
                  <span>Detailed Shipment History & Milestones</span>
                </h3>

                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-label-caps font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                  STATUS: {foundOrder.status || 'SHIPPED'}
                </span>
              </div>

              {/* Milestone Event Card */}
              <div className="relative pl-6 space-y-4">
                <div className="flex items-start gap-3 relative">
                  {/* Circle Pin Icon */}
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-600 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  </div>

                  <div className="flex-1 bg-[#fbf9f8] p-4 rounded-xl border border-[#c4c7c7]/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-[#1c1b1b]">Dispatched via Courier</span>
                      <span className="text-xs text-[#444748] font-semibold">
                        {new Date(foundOrder.updated_at || foundOrder.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-[#444748]">
                      Tracking AWB assigned: <span className="font-mono font-bold text-[#1c1b1b]">{foundOrder.tracking_number || 'DEL-2153-530192-IN'}</span> ({foundOrder.courier_name || 'BlueDart Surface & Air'}).
                    </p>
                    
                    <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[#c4c7c7]/30">
                      <span className="text-xs text-[#444748] font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#735c00]" />
                        <span>Chennai Central Logistics Center, TN</span>
                      </span>

                      <a
                        href={getCourierTrackingUrl(foundOrder.courier_name, foundOrder.tracking_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#735c00] hover:underline flex items-center gap-1 bg-[#f4efe6] px-3 py-1 rounded-lg border border-[#e0d6c3] transition-colors"
                      >
                        <span>Live Carrier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTAINER 2: ITEMS IN THIS SHIPMENT */}
            <div className="bg-white p-6 rounded-2xl border border-[#c4c7c7]/40 shadow-xs space-y-4">
              <h3 className="font-display-lg text-lg font-bold text-[#1c1b1b] flex items-center gap-2">
                <Box className="w-5 h-5 text-[#735c00]" />
                <span>Items in this Shipment ({foundOrder.itemsList?.length || 2})</span>
              </h3>

              <div className="space-y-3">
                {foundOrder.itemsList.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="bg-[#fbf9f8] p-4 rounded-xl border border-[#c4c7c7]/30 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f4efe6] border border-[#e0d6c3] text-[#735c00] flex items-center justify-center font-bold shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#1c1b1b]">{item.product_name}</p>
                        <p className="text-[#444748] font-semibold mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-sm text-[#1c1b1b]">
                      {getCurrencySymbol(foundOrder.currency)}{Number((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CONTAINER 3: CONCIERGE & SUPPORT HELP BANNER */}
            <div className="bg-[#1c1b1b] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border border-[#735c00]/30">
              <div>
                <h4 className="font-bold text-base tracking-tight text-[#fed65b]">Have questions about your delivery?</h4>
                <p className="text-xs text-[#e5e2e1] mt-0.5">
                  Our woodcraft concierge team is available Mon–Sat, 10 AM to 6 PM IST to assist you.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://wa.me/918608449937?text=Hello!%20I%20have%20a%20question%20about%20my%20delivery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25d366] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#20bd5a] transition-all cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp Us</span>
                </a>

                <a
                  href="mailto:support@irisjev.com?subject=Delivery%20Inquiry"
                  className="bg-[#313030] hover:bg-[#444748] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#735c00]/40"
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
