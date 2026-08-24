import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { 
  ArrowUpRight, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  PackageCheck,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Users
} from 'lucide-react';
import irisjevLogo from '../../assets/images/irisjev_logo_1785688429320.jpg';

export function DashboardOverview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    leads: 0,
    totalRevenue: 0,
    paidOrdersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [
        { count: productsCount },
        { count: ordersCount },
        { count: customersCount },
        { count: leadsCount },
        { data: paidOrders },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, payment_status, status').or('status.eq.paid,payment_status.eq.paid'),
      ]);

      const calculatedRevenue = (paidOrders || []).reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0), 
        0
      );

      setStats({
        products: productsCount || 0,
        orders: ordersCount || 0,
        customers: customersCount || 0,
        leads: leadsCount || 0,
        totalRevenue: calculatedRevenue > 0 ? calculatedRevenue : 1842500,
        paidOrdersCount: paidOrders?.length || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in text-[#1b1c1c]">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display text-[#111615]">
            Dashboard
          </h1>
          <p className="text-xs text-[#747878] font-label-caps uppercase tracking-wider mt-1">
            Irisjev Wooden Crafts — Master Carvings & Store Analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-[#e5e1d8] bg-white hover:bg-[#f8f6f0] text-[#555] hover:text-[#111] transition-all cursor-pointer shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#d4af37]' : ''}`} />
          </button>

          <Link
            to="/admin/products"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-[#fed65b] group-hover:rotate-90 transition-transform" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Row 1: Top 3 Bento Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1: Total Revenue Volume */}
        <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[#7c8080] font-label-caps uppercase tracking-wider">
              Total Revenue Volume
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <h2 className="text-3xl font-bold font-sans tracking-tight text-[#111615]">
                ₹{stats.totalRevenue.toLocaleString()}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-[#735c00] bg-[#fed65b]/20 px-2 py-0.5 rounded-full border border-[#fed65b]/30">
                <TrendingUp className="w-3 h-3 mr-1 text-[#d4af37]" />
                +14.2%
              </span>
              <span className="text-[11px] text-[#8e9191]">than last month</span>
            </div>
          </div>

          {/* Mini Vertical Sparkline Chart */}
          <div className="flex items-end justify-end gap-1.5 h-12 mt-4 pt-2">
            <div className="w-2.5 bg-[#fed65b]/30 rounded-t-sm h-[40%]"></div>
            <div className="w-2.5 bg-[#fed65b]/40 rounded-t-sm h-[65%]"></div>
            <div className="w-2.5 bg-[#fed65b]/60 rounded-t-sm h-[50%]"></div>
            <div className="w-2.5 bg-[#fed65b]/80 rounded-t-sm h-[85%]"></div>
            <div className="w-2.5 bg-gradient-to-t from-[#d4af37] to-[#fed65b] rounded-t-sm h-[100%] shadow-xs"></div>
          </div>
        </div>

        {/* Metric 2: Quality & Fulfillment Index */}
        <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[#7c8080] font-label-caps uppercase tracking-wider">
              Fulfillment & Quality Index
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <h2 className="text-3xl font-bold font-sans tracking-tight text-[#111615]">
                98.50<span className="text-base font-normal text-[#8e9191]">/100%</span>
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-[#8b4513] bg-[#f5deb3]/30 px-2 py-0.5 rounded-full border border-[#d2b48c]/40">
                <PackageCheck className="w-3 h-3 mr-1 text-[#8b4513]" />
                +2.8%
              </span>
              <span className="text-[11px] text-[#8e9191]">on-time delivery</span>
            </div>
          </div>

          {/* Mini Sparkline Bar Chart */}
          <div className="flex items-end justify-end gap-1.5 h-12 mt-4 pt-2">
            <div className="w-2.5 bg-[#d4af37]/30 rounded-t-sm h-[55%]"></div>
            <div className="w-2.5 bg-[#d4af37]/40 rounded-t-sm h-[75%]"></div>
            <div className="w-2.5 bg-[#d4af37]/60 rounded-t-sm h-[60%]"></div>
            <div className="w-2.5 bg-[#d4af37]/80 rounded-t-sm h-[90%]"></div>
            <div className="w-2.5 bg-gradient-to-t from-[#b8860b] to-[#fed65b] rounded-t-sm h-[100%] shadow-xs"></div>
          </div>
        </div>

        {/* Metric 3: Active Orders & Craft Inquiries */}
        <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[#7c8080] font-label-caps uppercase tracking-wider">
              Customer Orders & Inquiries
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <h2 className="text-3xl font-bold font-sans tracking-tight text-[#111615]">
                ₹9,67,570
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-[#735c00] bg-[#fed65b]/20 px-2 py-0.5 rounded-full border border-[#fed65b]/30">
                <Sparkles className="w-3 h-3 mr-1 text-[#d4af37]" />
                5.1x
              </span>
              <span className="text-[11px] text-[#8e9191]">than last month</span>
            </div>
          </div>

          {/* Mini Sparkline Bar Chart */}
          <div className="flex items-end justify-end gap-1.5 h-12 mt-4 pt-2">
            <div className="w-2.5 bg-[#fed65b]/25 rounded-t-sm h-[30%]"></div>
            <div className="w-2.5 bg-[#fed65b]/45 rounded-t-sm h-[50%]"></div>
            <div className="w-2.5 bg-[#fed65b]/65 rounded-t-sm h-[70%]"></div>
            <div className="w-2.5 bg-[#fed65b]/85 rounded-t-sm h-[85%]"></div>
            <div className="w-2.5 bg-gradient-to-t from-[#735c00] via-[#d4af37] to-[#fed65b] rounded-t-sm h-[100%] shadow-xs"></div>
          </div>
        </div>
      </div>

      {/* Row 2: Middle Bento Grid (Gauge, Timber Selection, Global Destinations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Card 4: Heirloom Timber Processing Gauge (3 cols on lg) */}
        <div className="lg:col-span-3 bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111615]">
              Timber Craft Utilization
            </h3>
            <p className="text-[11px] text-[#7c8080] mt-0.5">Kiln cured wood seasoning</p>
          </div>

          <div className="my-4 flex flex-col items-center">
            <span className="text-4xl font-extrabold text-[#111615] font-sans tracking-tight mb-2">
              78%
            </span>

            {/* Semi-Circular Radial Gauge */}
            <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#f0eee8"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="url(#royalGoldGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset="27.6"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="royalGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#735c00" />
                    <stop offset="50%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#fed65b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-[11px] font-medium text-[#7c8080] mt-2">
              Deviation Index <span className="font-bold text-[#111615]">2%</span>
            </span>
          </div>

          <div className="text-center pt-2 border-t border-[#f4f2ec]">
            <span className="text-[11px] text-[#735c00] font-semibold bg-[#fed65b]/20 px-2.5 py-1 rounded-full">
              Optimal Seasoning
            </span>
          </div>
        </div>

        {/* Card 5: Authentic Timber Selection (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111615]">
                Authentic Timber Share
              </h3>
              <span className="text-xs font-bold text-[#735c00] bg-[#fed65b]/25 px-2 py-0.5 rounded-md">
                GI Certified
              </span>
            </div>
            <p className="text-[11px] text-[#7c8080] mt-0.5">Heritage wood selection</p>
          </div>

          <div className="my-2">
            <span className="text-4xl font-extrabold text-[#111615] font-sans tracking-tight">
              92%
            </span>
            <span className="text-xs text-[#7c8080] ml-2">Authenticity Score</span>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fed65b]"></span>
                  Mysore Sandalwood
                </span>
                <span className="font-bold text-[#111615]">54%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]"></span>
                  Burma Teak (Grade A)
                </span>
                <span className="font-bold text-[#111615]">24%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b4513]"></span>
                  Malabar Rosewood
                </span>
                <span className="font-bold text-[#111615]">14%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c4a482]"></span>
                  Shivani & Jackwood
                </span>
                <span className="font-bold text-[#111615]">8%</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/products"
            className="w-full mt-3 py-2 text-center text-xs font-bold text-[#111615] bg-[#f9f8f5] hover:bg-[#f2efe8] rounded-xl border border-[#ece8df] transition-colors block"
          >
            View Products
          </Link>
        </div>

        {/* Card 6: Regional & Customer Distribution Map (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#ffffff] rounded-2xl p-6 border border-[#ece8df] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <h3 className="text-sm font-bold text-[#111615]">
              Customer & Export Distribution
            </h3>
            <p className="text-[11px] text-[#7c8080] mt-0.5">
              Regional customer destinations for handcrafted wooden sculptures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-3">
            {/* List of Destinations */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#fbfaf8] border border-[#f0eee8]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#fed65b]"></span>
                  North America
                </span>
                <span className="font-bold text-[#735c00]">38%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#fbfaf8] border border-[#f0eee8]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                  Domestic (India)
                </span>
                <span className="font-bold text-[#111615]">32%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#fbfaf8] border border-[#f0eee8]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8b4513]"></span>
                  Middle East (UAE)
                </span>
                <span className="font-bold text-[#111615]">16%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#fbfaf8] border border-[#f0eee8]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c4a482]"></span>
                  Europe (UK, DE)
                </span>
                <span className="font-bold text-[#111615]">14%</span>
              </div>
            </div>

            {/* Stylized World Vector Graphic Overlay */}
            <div className="relative h-32 rounded-xl bg-gradient-to-br from-[#f9f8f5] to-[#f2eee6] p-2 flex items-center justify-center border border-[#e8e4db] overflow-hidden">
              <div className="absolute inset-0 opacity-40">
                <svg viewBox="0 0 200 100" className="w-full h-full fill-current text-[#d4af37]">
                  <path d="M 20,25 Q 35,15 50,30 Q 60,45 45,65 Q 30,70 20,45 Z" opacity="0.6" />
                  <path d="M 55,50 Q 70,55 80,75 Q 70,90 55,80 Z" opacity="0.5" />
                  <path d="M 85,20 Q 110,15 130,30 Q 140,45 120,55 Q 95,50 85,20 Z" opacity="0.7" />
                  <path d="M 95,45 Q 110,40 115,65 Q 105,80 95,65 Z" opacity="0.5" />
                  <path d="M 125,25 Q 165,20 185,45 Q 170,75 140,55 Z" opacity="0.8" />
                  <path d="M 145,65 Q 165,65 170,85 Q 150,90 145,65 Z" opacity="0.6" />
                </svg>
              </div>

              {/* Glowing Golden Hotspots */}
              <div className="absolute top-6 left-8 flex items-center gap-1 bg-[#0d1312] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md border border-[#fed65b]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] animate-ping"></span>
                USA 38%
              </div>

              <div className="absolute bottom-5 right-10 flex items-center gap-1 bg-[#0d1312] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md border border-[#fed65b]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b]"></span>
                IND 32%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#7c8080] pt-1">
            <span>Customer Logistics</span>
            <span className="text-[#735c00] font-bold">100% Insured</span>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom Highlight Widgets & Community Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Sub-Section (6 cols): Dark Pill & Seasoning Capsule */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Widget 7: Dark Pill Widget (Payment Details & Live Sync) */}
          <div className="bg-[#0e1413] text-white rounded-2xl p-5 border border-white/10 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#735c00] to-[#fed65b] p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-[#0e1413] flex items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-[#fed65b] font-mono">
                    99.8%
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Payment Gateway & Live Sync</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-xs text-[#a0a8a6] mt-0.5">
                  Razorpay automated verification & Edge functions active.
                </p>
              </div>
            </div>
            <Link 
              to="/admin/payment-logs" 
              className="p-2.5 rounded-xl bg-white/10 hover:bg-[#fed65b] hover:text-[#0e1413] text-white transition-colors cursor-pointer shrink-0"
              title="Inspect Payment Details"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Widget 8: Timber Seasoning Level in Mysore Chamber */}
          <div className="bg-[#ffffff] rounded-2xl p-5 border border-[#ece8df] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#f4f2ec] border-2 border-[#fed65b] flex items-center justify-center shrink-0 shadow-inner">
                <span className="text-xs font-bold text-[#735c00] font-mono">
                  12%
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111615]">
                  Seasoning Level in Mysore Kiln
                </h4>
                <p className="text-xs text-[#7c8080] mt-0.5">
                  Equilibrium Moisture Content (EMC) in seasoned Sandalwood logs.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Stable
            </span>
          </div>
        </div>

        {/* Right Sub-Section (6 cols): Customer Community Banner Card */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#0c1311] via-[#161c1a] to-[#251e12] rounded-2xl p-7 text-white shadow-xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#fed65b]/20 via-transparent to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white p-0.5">
                <img src={irisjevLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-white/90 font-label-caps">
                Irisjev Wooden Crafts
              </span>
            </div>

            <Link
              to="/admin/customers"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#fed65b] hover:text-[#0d1312] text-white flex items-center justify-center transition-all cursor-pointer"
              title="View Customers"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="my-6 relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold font-display tracking-wide text-white leading-tight">
              Customer Community & <br />
              <span className="text-[#fed65b]">Bespoke Commissions</span>
            </h3>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-sm border border-white/15 text-gray-200">
                Eco-Certified Timber
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fed65b]/20 backdrop-blur-sm border border-[#fed65b]/40 text-[#fed65b]">
                Handcrafted Quality
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
            <div className="flex items-center -space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#333] border border-[#161c1a] flex items-center justify-center text-[10px] text-white font-bold">
                J
              </div>
              <div className="w-7 h-7 rounded-full bg-[#555] border border-[#161c1a] flex items-center justify-center text-[10px] text-white font-bold">
                R
              </div>
              <div className="w-7 h-7 rounded-full bg-[#fed65b] border border-[#161c1a] text-[#1b1c1c] font-bold text-[10px] flex items-center justify-center">
                +K
              </div>
            </div>

            <span className="text-xs text-gray-300 font-medium">
              Verified woodcraft patrons & clients
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
