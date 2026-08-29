import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Award, 
  DollarSign, 
  AlertTriangle, 
  Search, 
  Download, 
  Info,
  RefreshCw,
  Box,
  Eye,
  X,
  ShoppingCart,
  Package,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Truck,
  Calendar,
  Layers,
  TreePine,
  Check,
  MessageCircle
} from 'lucide-react';
import { 
  fetchSalesAnalytics, 
  generateSalesCSVReport, 
  SalesAnalyticsSummary, 
  CustomerSalesMetric,
  ProductSalesMetric,
  CustomerOrderRecord
} from '../../utils/salesAnalyticsEngine';
import { PageViewAnalyticsManager } from './PageViewAnalyticsManager';

export function SalesAnalyticsManager() {
  const [activeTab, setActiveTab] = useState<'sales' | 'customer' | 'page_views'>('customer');
  const [daysRange, setDaysRange] = useState<number | 'all'>(30);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesAnalyticsSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductSalesMetric | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSalesMetric | null>(null);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<string>>(new Set());
  const [customerViewTab, setCustomerViewTab] = useState<Record<string, 'orders' | 'products'>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async (range: number | 'all') => {
    setLoading(true);
    try {
      const data = await fetchSalesAnalytics(range);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics studio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(daysRange);
  }, [daysRange]);

  const handleExportCSV = () => {
    if (!summary) return;
    const csvStr = generateSalesCSVReport(summary);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${activeTab}-${daysRange}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice(`Analytics report exported as CSV!`);
    setTimeout(() => setNotice(null), 3000);
  };

  const toggleCustomerExpand = (cId: string) => {
    setExpandedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(cId)) {
        next.delete(cId);
      } else {
        next.add(cId);
      }
      return next;
    });
  };

  // Filtered Products List
  const filteredProducts = React.useMemo(() => {
    if (!summary) return [];
    return summary.productMetrics.filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.productId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [summary, searchQuery, selectedCategory]);

  // Filtered Customer Directory List
  const filteredCustomers = React.useMemo(() => {
    if (!summary) return [];
    return summary.customerSummary.customerLeaderboard.filter(c => 
      c.customerName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [summary, customerSearchQuery]);

  const categoriesList = summary ? Array.from(new Set(summary.productMetrics.map(p => p.category))) : [];

  // SVG Chart Calculation for Sales Volume Index
  const chartPoints = summary?.timelinePoints || [];
  const maxRevenue = Math.max(...chartPoints.map(p => p.revenue), 100000);
  const chartWidth = 600;
  const chartHeight = 180;
  
  const pointsString = chartPoints.map((p, idx) => {
    const x = (idx / Math.max(chartPoints.length - 1, 1)) * chartWidth;
    const y = chartHeight - (p.revenue / maxRevenue) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  const areaPointsString = chartPoints.length > 0
    ? `0,${chartHeight} ${pointsString} ${chartWidth},${chartHeight}`
    : `0,${chartHeight} ${chartWidth},${chartHeight}`;

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-[#1b2520] p-4 sm:p-6 lg:p-8 font-sans max-w-[1500px] mx-auto space-y-6 pb-24 select-none">
      
      {/* HEADER BAR MATCHING SCREENSHOT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2.5xl font-black text-[#15221c] tracking-tight">Analytics Studio</h1>
          </div>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Evaluate product revenues, customer retention, repeat orders, loyalty tiers, and checkout conversions.
          </p>
        </div>

        {/* TOP-RIGHT TOGGLE & TIMEFRAME PILLS */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* View Toggle Pills */}
          <div className="bg-white p-1 rounded-full border border-gray-200 shadow-2xs flex items-center">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-[#15221c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Sales Overview
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-[#15221c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Customer Insights
            </button>
            <button
              onClick={() => setActiveTab('page_views')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'page_views'
                  ? 'bg-[#15221c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Traffic & Events
            </button>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="bg-white p-1 rounded-full border border-gray-200 shadow-2xs flex items-center gap-0.5">
            {[
              { label: 'Today', val: 1 },
              { label: '7D', val: 7 },
              { label: '30D', val: 30 },
              { label: '90D', val: 90 },
              { label: 'All', val: 'all' }
            ].map(btn => (
              <button
                key={btn.label}
                onClick={() => setDaysRange(btn.val as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  daysRange === btn.val
                    ? 'bg-[#15221c] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(daysRange)}
            disabled={loading}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-gray-700 transition-all cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between text-xs font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-800 hover:text-black">✕</button>
        </div>
      )}

      {/* SALES OVERVIEW VIEW */}
      {activeTab === 'sales' && summary && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* TOP 4 KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: GROSS SALES (GMV) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  GROSS SALES (GMV)
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-3xl font-black text-[#15221c] font-mono">
                ₹{summary.totalRevenue.toLocaleString('en-IN')}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Completed Sales</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  Active
                </span>
              </div>
            </div>

            {/* Card 2: ORDERS COUNT */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  ORDERS COUNT
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-100/70 text-blue-700 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-black text-[#15221c] font-mono">
                {summary.totalOrdersCount}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Checkout conversions</span>
                <span className="text-indigo-600 font-bold">
                  {summary.totalOrdersCount} successful
                </span>
              </div>
            </div>

            {/* Card 3: AVERAGE ORDER VALUE */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  AVERAGE ORDER VALUE
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-100/70 text-amber-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-black text-[#15221c] font-mono">
                ₹{summary.averageOrderValue.toLocaleString('en-IN')}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Revenue per cart</span>
                <span>Average Basket</span>
              </div>
            </div>

            {/* Card 4: ITEMS SOLD */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  ITEMS SOLD
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-100/70 text-purple-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-black text-[#15221c] font-mono">
                {summary.totalUnitsSold}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Units Dispatched</span>
                <span className="text-purple-700 font-bold">
                  {summary.totalUnitsSold} items
                </span>
              </div>
            </div>

          </div>

          {/* MIDDLE ROW: SALES VOLUME INDEX CHART VS PRODUCT SALES SHARE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: Sales Volume Index Chart (8 Cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Sales Volume Index</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    Total sales value grouped chronologically
                  </p>
                </div>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-black cursor-pointer pr-8"
                  >
                    <option value="all">Filter: All Categories</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Smooth Area Line Chart Graphic */}
              <div className="relative pt-6 pb-2 w-full overflow-hidden">
                <svg className="w-full h-48" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area Fill */}
                  <polygon points={areaPointsString} fill="url(#emeraldGradient)" />

                  {/* Top Line */}
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                  />

                  {/* Data Points */}
                  {chartPoints.map((p, idx) => {
                    const x = (idx / Math.max(chartPoints.length - 1, 1)) * chartWidth;
                    const y = chartHeight - (p.revenue / maxRevenue) * (chartHeight - 30) - 15;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        className="fill-emerald-600 stroke-white stroke-2"
                      />
                    );
                  })}
                </svg>

                {/* X-Axis Date Labels */}
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 font-bold pt-2 border-t border-gray-100">
                  <span>{chartPoints[0]?.dateLabel || '15 Jul'}</span>
                  <span>{chartPoints[Math.floor(chartPoints.length / 2)]?.dateLabel || '30 Jul'}</span>
                  <span>{chartPoints[chartPoints.length - 1]?.dateLabel || '13 Aug'}</span>
                </div>
              </div>

            </div>

            {/* Right Panel: Product Sales Share (4 Cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Product Sales Share</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Top items contributing to current total revenue
                </p>
              </div>

              {/* Progress Bars List for Top Items */}
              <div className="space-y-4 font-mono text-xs">
                {summary.productMetrics.slice(0, 4).map((p) => (
                  <div key={p.productId} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-800 font-sans truncate max-w-[170px]">{p.productName}</span>
                      <span className="text-emerald-700">₹{p.totalRevenue.toLocaleString('en-IN')} ({p.revenueSharePercent}%)</span>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(p.revenueSharePercent, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-400 font-semibold pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Excludes cancellations</span>
                </span>
                <span className="text-emerald-700 font-bold">Calculated live</span>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: PRODUCT REPORTS TABLE */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden space-y-4">
            
            <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Product Reports</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Detailed list of individual products and sales totals
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search product title/id..."
                    className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-black w-full sm:w-48"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Product Reports Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fcfdfc] border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="p-4">PRODUCT INFO</th>
                    <th className="p-4">CATEGORY</th>
                    <th className="p-4 text-center">UNITS SOLD</th>
                    <th className="p-4 text-center">ORDERS</th>
                    <th className="p-4 text-right">REVENUE GENERATED</th>
                    <th className="p-4 text-right">AVG PRICE</th>
                    <th className="p-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(p => (
                    <tr key={p.productId} className="hover:bg-gray-50 transition-colors">
                      
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.productName} className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                              <Box className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-xs text-[#15221c]">{p.productName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {p.productId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>

                      <td className="p-4 text-center font-mono font-black text-gray-900 text-xs">
                        {p.unitsSold}
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-gray-700">
                        {p.ordersCount}
                      </td>

                      <td className="p-4 text-right font-mono font-black text-[#15221c] text-xs">
                        ₹{p.totalRevenue.toLocaleString('en-IN')}
                      </td>

                      <td className="p-4 text-right font-mono text-gray-500 text-xs font-semibold">
                        ₹{p.unitPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedProduct(p)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Inspect Product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right text-[11px] font-semibold text-gray-400">
              Showing {filteredProducts.length} products
            </div>
          </div>

        </div>
      )}

      {/* CUSTOMER INSIGHTS VIEW */}
      {activeTab === 'customer' && summary && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* TOP 4 KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  TOTAL ACTIVE CUSTOMERS
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-3xl font-extrabold text-[#15221c] font-mono">
                {summary.customerSummary.totalCustomers}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Unique customer emails</span>
                <span className="text-emerald-700 font-bold">Aggregate</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  REPEAT CUSTOMER RATE
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-100/70 text-purple-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-extrabold text-[#15221c] font-mono">
                {summary.customerSummary.repeatCustomerRate.toFixed(1)}%
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Customers with ≥ 2 orders</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {summary.customerSummary.repeatCustomersCount} customers
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  CUSTOMER LIFETIME VALUE (CLV)
                </span>
                <div className="w-8 h-8 rounded-full bg-purple-100/70 text-purple-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-extrabold text-[#15221c] font-mono">
                ₹{summary.customerSummary.customerLifetimeValue.toLocaleString('en-IN')}
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Average spend per customer</span>
                <span>Overall index</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                  CART ABANDONMENT RATE
                </span>
                <div className="w-8 h-8 rounded-full bg-rose-100/70 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-extrabold text-[#15221c] font-mono">
                {summary.customerSummary.cartAbandonmentRate.toFixed(1)}%
              </div>

              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                <span>Uncompleted checkouts</span>
                <span className="text-rose-600 font-bold">
                  {summary.customerSummary.checkoutFunnel.abandonedCheckouts} checkouts
                </span>
              </div>
            </div>

          </div>

          {/* MIDDLE ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Order Frequency</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Distribution of customers by number of orders
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-gray-700">1 Order</span>
                    <span className="font-bold text-gray-900">
                      {summary.customerSummary.orderFrequency.oneOrderCount} ({summary.customerSummary.orderFrequency.oneOrderPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(summary.customerSummary.orderFrequency.oneOrderPercent, 2)}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-gray-700">2 Orders</span>
                    <span className="font-bold text-gray-900">
                      {summary.customerSummary.orderFrequency.twoOrdersCount} ({summary.customerSummary.orderFrequency.twoOrdersPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(summary.customerSummary.orderFrequency.twoOrdersPercent, 2)}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-gray-700">3 Orders</span>
                    <span className="font-bold text-gray-900">
                      {summary.customerSummary.orderFrequency.threeOrdersCount} ({summary.customerSummary.orderFrequency.threeOrdersPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full transition-all duration-500" style={{ width: `${Math.max(summary.customerSummary.orderFrequency.threeOrdersPercent, 2)}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-bold text-gray-700">4+ Orders</span>
                    <span className="font-bold text-gray-900">
                      {summary.customerSummary.orderFrequency.fourPlusOrdersCount} ({summary.customerSummary.orderFrequency.fourPlusOrdersPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(summary.customerSummary.orderFrequency.fourPlusOrdersPercent, 2)}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold pt-2 border-t border-gray-100">
                <Info className="w-3.5 h-3.5" />
                <span>Highlights customer loyalty repeat intervals</span>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Checkout Funnel Conversion</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Breakdown of leads initiated vs abandoned vs successful orders
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6 py-2">
                
                {/* Center Donut Graphic with Multi-Segment Support */}
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  {(() => {
                    const funnel = summary.customerSummary.checkoutFunnel;
                    const convPct = funnel.convertedPercent || 0;
                    const abanPct = funnel.abandonedPercent || 0;
                    const inProgPct = funnel.inProgressPercent || Math.max(0, 100 - convPct - abanPct);
                    return (
                      <>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          
                          {/* Converted (Emerald) */}
                          {convPct > 0 && (
                            <path
                              className="text-emerald-500"
                              strokeDasharray={`${convPct}, ${100 - convPct}`}
                              strokeDashoffset="0"
                              strokeWidth="4.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}

                          {/* Abandoned (Rose) */}
                          {abanPct > 0 && (
                            <path
                              className="text-rose-500"
                              strokeDasharray={`${abanPct}, ${100 - abanPct}`}
                              strokeDashoffset={`-${convPct}`}
                              strokeWidth="4.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}

                          {/* In Progress (Indigo) */}
                          {inProgPct > 0 && (
                            <path
                              className="text-indigo-500"
                              strokeDasharray={`${inProgPct}, ${100 - inProgPct}`}
                              strokeDashoffset={`-${convPct + abanPct}`}
                              strokeWidth="4.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          )}
                        </svg>

                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-black text-[#15221c] font-mono leading-none">
                            {summary.customerSummary.checkoutFunnel.totalFunnelSize}
                          </span>
                          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5">
                            ORDERS
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between gap-3 border-l-3 border-emerald-500 pl-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block font-sans">CONVERTED CHECKOUTS</span>
                      <span className="text-base font-black text-gray-900 mt-0.5 block">{summary.customerSummary.checkoutFunnel.convertedCheckouts}</span>
                    </div>
                    <span className="text-emerald-600 font-extrabold text-xs">{summary.customerSummary.checkoutFunnel.convertedPercent}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-l-3 border-rose-500 pl-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block font-sans">ABANDONED CHECKOUTS</span>
                      <span className="text-base font-black text-gray-900 mt-0.5 block">{summary.customerSummary.checkoutFunnel.abandonedCheckouts}</span>
                    </div>
                    <span className="text-rose-600 font-extrabold text-xs">{summary.customerSummary.checkoutFunnel.abandonedPercent}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-l-3 border-indigo-500 pl-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block font-sans">IN PROGRESS / LEAD INQUIRIES</span>
                      <span className="text-base font-black text-gray-900 mt-0.5 block">{summary.customerSummary.checkoutFunnel.inProgressLeads}</span>
                    </div>
                    <span className="text-indigo-600 font-extrabold text-xs">{summary.customerSummary.checkoutFunnel.inProgressPercent}%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-400 font-semibold pt-2 border-t border-gray-100">
                <span>Based on checkout tracking triggers</span>
                <span>Funnel size: {summary.customerSummary.checkoutFunnel.totalFunnelSize}</span>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW: CUSTOMER LOYALTY DIRECTORY WITH INDIVIDUAL ORDERS & PRODUCTS EXPANDER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: Customer Loyalty Directory (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
              
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Customer Loyalty Directory</h3>
                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                    Lifetime spends, individual orders, and ordered products
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search spender..."
                      className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-black w-full sm:w-44"
                    />
                  </div>
                  
                  <button
                    onClick={handleExportCSV}
                    className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table Directory with Expandable Rows for Customer Orders & Products */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fcfdfc] border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-4">CUSTOMER INFO</th>
                      <th className="p-4 text-center">ORDERS</th>
                      <th className="p-4 text-right">LIFETIME SPEND</th>
                      <th className="p-4 text-center">LOYALTY TIER</th>
                      <th className="p-4 text-right">LAST ACTIVE</th>
                      <th className="p-4 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map(c => {
                      const isExpanded = expandedCustomerIds.has(c.customerId);
                      const currentSubTab = customerViewTab[c.customerId] || 'orders';

                      return (
                        <React.Fragment key={c.customerId}>
                          <tr className="hover:bg-[#f9fbf9] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => toggleCustomerExpand(c.customerId)}
                                  className="p-1 hover:bg-gray-200 rounded-md text-gray-600 transition-colors cursor-pointer"
                                  title="Toggle order history"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <div>
                                  <p className="font-extrabold text-xs text-[#15221c]">{c.customerName}</p>
                                  <p className="text-[11px] text-gray-400 font-mono">{c.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-center font-mono font-black text-gray-900 text-xs">
                              {c.totalOrders}
                            </td>

                            <td className="p-4 text-right font-mono font-black text-[#15221c] text-xs">
                              ₹{c.totalSpent.toLocaleString('en-IN')}
                            </td>

                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                c.loyaltyTier === 'VIP'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {c.loyaltyTier}
                              </span>
                            </td>

                            <td className="p-4 text-right font-mono text-gray-500 text-[11px]">
                              {c.lastPurchaseDate}
                            </td>

                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedCustomer(c)}
                                className="px-2.5 py-1 bg-[#15221c] hover:bg-black text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDABLE INLINE CUSTOMER ORDERS & PRODUCTS DRAWER */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="p-0 bg-[#f8faf8] border-y border-emerald-100">
                                <div className="p-4 space-y-3 animate-fadeIn">
                                  
                                  {/* Sub-Tab Selector Pills */}
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setCustomerViewTab(prev => ({ ...prev, [c.customerId]: 'orders' }))}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
                                          currentSubTab === 'orders'
                                            ? 'bg-[#15221c] text-white shadow-2xs'
                                            : 'bg-white text-gray-700 border border-gray-200'
                                        }`}
                                      >
                                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Individual Orders ({c.orders.length})</span>
                                      </button>

                                      <button
                                        onClick={() => setCustomerViewTab(prev => ({ ...prev, [c.customerId]: 'products' }))}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer flex items-center gap-1.5 ${
                                          currentSubTab === 'products'
                                            ? 'bg-[#15221c] text-white shadow-2xs'
                                            : 'bg-white text-gray-700 border border-gray-200'
                                        }`}
                                      >
                                        <TreePine className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Purchased Products Summary ({c.purchasedProducts.length})</span>
                                      </button>
                                    </div>

                                    <span className="text-[11px] text-gray-500 font-semibold font-mono">
                                      Client: <span className="text-gray-900 font-bold">{c.customerName}</span> ({c.email})
                                    </span>
                                  </div>

                                  {/* Sub-Tab 1: Individual Orders List */}
                                  {currentSubTab === 'orders' && (
                                    <div className="space-y-3 pt-1">
                                      {c.orders.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No order records found for this customer.</p>
                                      ) : (
                                        c.orders.map((ord) => (
                                          <div key={ord.orderId} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
                                            <div className="flex flex-wrap justify-between items-center gap-2 text-xs border-b border-gray-100 pb-2">
                                              <div className="flex items-center gap-2 font-mono">
                                                <span className="font-extrabold text-[#15221c]">{ord.orderNumber}</span>
                                                <span className="text-gray-400">|</span>
                                                <span className="text-gray-500">{ord.createdDate}</span>
                                                {ord.courierName && (
                                                  <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    {ord.courierName} {ord.trackingNumber ? `(${ord.trackingNumber})` : ''}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                  ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                                  ord.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                  ord.status === 'paid' || ord.status === 'confirmed' ? 'bg-[#e6f4ea] text-[#137333] border border-emerald-200' :
                                                  ord.status === 'cancelled' || ord.status === 'abandoned' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                                  ord.status === 'pending_payment' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                  ord.status === 'unpaid' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                                  'bg-amber-100 text-amber-800'
                                                }`}>
                                                  {ord.status === 'pending_payment' ? 'PAYMENT PENDING' : ord.status === 'cancelled' ? 'CANCELLED' : ord.status}
                                                </span>
                                                <span className="font-mono font-black text-emerald-800 text-sm">
                                                  ₹{ord.totalAmount.toLocaleString('en-IN')}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Items inside this order */}
                                            <div className="space-y-1 pl-2">
                                              {ord.items.map((it) => (
                                                <div key={it.id} className="flex justify-between items-center text-xs">
                                                  <div className="flex items-center gap-2">
                                                    <Box className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="font-bold text-gray-800">{it.productName}</span>
                                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                                      {it.selectedTimber}
                                                    </span>
                                                  </div>

                                                  <div className="font-mono text-gray-600 font-bold">
                                                    <span>x{it.quantity}</span>
                                                    <span className="mx-1 text-gray-400">@</span>
                                                    <span>₹{it.unitPrice.toLocaleString('en-IN')}</span>
                                                    <span className="ml-2 text-gray-900 font-extrabold">= ₹{it.totalPrice.toLocaleString('en-IN')}</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}

                                  {/* Sub-Tab 2: Purchased Products Summary */}
                                  {currentSubTab === 'products' && (
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden pt-1">
                                      <table className="w-full text-left text-xs font-sans">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase font-mono">
                                          <tr>
                                            <th className="p-2.5">PRODUCT TITLE</th>
                                            <th className="p-2.5">TIMBER VARIANT</th>
                                            <th className="p-2.5 text-center">TOTAL QTY ORDERED</th>
                                            <th className="p-2.5 text-center">ORDERS INVOLVED</th>
                                            <th className="p-2.5 text-right">TOTAL SPENT</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-mono">
                                          {c.purchasedProducts.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                              <td className="p-2.5 font-sans font-bold text-[#15221c]">{p.productName}</td>
                                              <td className="p-2.5 font-sans text-amber-900 font-semibold">{p.selectedTimber}</td>
                                              <td className="p-2.5 text-center font-bold text-blue-900">{p.totalQuantity} units</td>
                                              <td className="p-2.5 text-center text-gray-600">{p.ordersCount} orders</td>
                                              <td className="p-2.5 text-right font-black text-emerald-800">₹{p.totalSpent.toLocaleString('en-IN')}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-right text-[11px] font-semibold text-gray-400">
                Showing {filteredCustomers.length} clients
              </div>
            </div>

            {/* Right Panel: Abandoned Checkouts (4 Cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Abandoned Checkouts</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                  Recover incomplete customer checkout orders
                </p>
              </div>

              {summary.customerSummary.abandonedCartsList.filter(a => a.status === 'abandoned').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-gray-400">
                    No abandoned checkouts in this period
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 overflow-y-auto max-h-[480px] pr-1.5 custom-scrollbar flex-1">
                  {summary.customerSummary.abandonedCartsList.filter(a => a.status === 'abandoned').map(ab => (
                    <div key={ab.id} className="bg-gray-50/80 hover:bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5 transition-all">
                      
                      {/* Top Row: Name / Email + Amount */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-gray-900 leading-tight truncate">
                            {ab.customerName || ab.email.split('@')[0]}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                            {ab.email}
                          </p>
                        </div>
                        <span className="bg-rose-50 text-rose-700 text-xs font-mono font-extrabold px-2 py-1 rounded-md shrink-0 border border-rose-100">
                          ₹{ab.estimatedCartValue.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Middle Row: Date + Phone */}
                      <div className="flex justify-between items-center text-[11px] text-gray-400 font-semibold pt-1 border-t border-gray-100/60">
                        <span>{ab.createdAt}</span>
                        <span className="font-mono text-gray-500">{ab.phone || '+918610554711'}</span>
                      </div>

                      {/* Bottom Row: Recover via WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = (ab.phone || '918610554711').replace(/\D/g, '');
                          const msg = encodeURIComponent(
                            `Hello ${ab.customerName || 'there'}! We noticed you left items in your cart at Irisjev Wooden Crafts (${ab.topProduct || 'Heritage Sculptures'}). Complete your checkout here: https://irisjevwoodencrafts.com/checkout`
                          );
                          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                        }}
                        className="w-full py-2.5 bg-[#00a884] hover:bg-[#008f70] active:scale-[0.99] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer mt-1"
                      >
                        <MessageCircle className="w-4 h-4 fill-white text-[#00a884]" />
                        Recover via WhatsApp
                      </button>

                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-semibold">
                <span>Leads table synchronization</span>
                <span className="font-mono font-bold text-gray-600">
                  {summary.customerSummary.abandonedCartsList.filter(a => a.status === 'abandoned').length} checkouts
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* PAGE VIEW ANALYTICS VIEW */}
      {activeTab === 'page_views' && (
        <div className="animate-fadeIn">
          <PageViewAnalyticsManager daysRange={daysRange} hideTimeframePills={true} />
        </div>
      )}

      {/* INSPECT CUSTOMER ORDERS & PRODUCTS MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white text-[#1b2520] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#15221c] text-white p-5 flex justify-between items-center shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                  {selectedCustomer.customerName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">{selectedCustomer.customerName}</h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {selectedCustomer.email} | {selectedCustomer.phone || 'No Phone'}
                  </span>
                </div>
              </div>
              
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar text-xs">
              
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Lifetime Spend</span>
                  <span className="font-black text-sm text-emerald-800 block mt-1">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Orders</span>
                  <span className="font-black text-sm text-blue-900 block mt-1">{selectedCustomer.totalOrders} orders</span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Avg Order Value</span>
                  <span className="font-bold text-xs text-gray-800 block mt-1">₹{selectedCustomer.averageOrderValue.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Loyalty Tier</span>
                  <span className="font-bold text-xs text-amber-800 block mt-1">{selectedCustomer.loyaltyTier}</span>
                </div>
              </div>

              {/* Individual Orders History */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-[#15221c] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Individual Orders History ({selectedCustomer.orders.length})</span>
                </h4>

                <div className="space-y-3">
                  {selectedCustomer.orders.map(ord => (
                    <div key={ord.orderId} className="bg-[#f9faf9] p-4 rounded-xl border border-gray-200 space-y-2.5">
                      <div className="flex justify-between items-center font-mono">
                        <div>
                          <span className="font-black text-gray-900 text-sm">{ord.orderNumber}</span>
                          <span className="text-gray-400 text-xs ml-2">({ord.createdDate})</span>
                        </div>
                        <span className="font-black text-emerald-800 text-sm">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="space-y-1.5">
                        {ord.items.map(it => (
                          <div key={it.id} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-gray-100">
                            <div>
                              <span className="font-bold text-gray-800 block">{it.productName}</span>
                              <span className="text-[10px] text-amber-900 font-semibold">{it.selectedTimber}</span>
                            </div>
                            <div className="font-mono text-gray-700">
                              <span>{it.quantity} x ₹{it.unitPrice.toLocaleString('en-IN')}</span>
                              <span className="ml-2 font-bold text-black">= ₹{it.totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchased Products Summary */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-[#15221c] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <TreePine className="w-4 h-4 text-amber-700" />
                  <span>Purchased Products Summary</span>
                </h4>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-400 uppercase font-extrabold">
                      <tr>
                        <th className="p-3">PRODUCT</th>
                        <th className="p-3">TIMBER</th>
                        <th className="p-3 text-center">TOTAL UNITS</th>
                        <th className="p-3 text-right">TOTAL SPENT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCustomer.purchasedProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-sans font-bold text-gray-900">{p.productName}</td>
                          <td className="p-3 font-sans text-amber-900 font-semibold">{p.selectedTimber}</td>
                          <td className="p-3 text-center text-blue-900 font-bold">{p.totalQuantity}</td>
                          <td className="p-3 text-right font-black text-emerald-800">₹{p.totalSpent.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-[#15221c] hover:bg-black text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white text-[#1b2520] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="bg-[#15221c] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">{selectedProduct.productName}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Revenue</span>
                  <span className="font-extrabold text-sm text-emerald-700">₹{selectedProduct.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Units Sold</span>
                  <span className="font-extrabold text-sm text-blue-900">{selectedProduct.unitsSold} units</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedProduct(null)} className="px-4 py-1.5 bg-[#15221c] text-white font-bold rounded-xl text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
