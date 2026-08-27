import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { 
  FileText,
  Receipt,
  Eye, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Ticket, 
  Printer, 
  Truck, 
  PackageCheck, 
  Sliders, 
  Edit3, 
  ExternalLink,
  X,
  Check,
  Sparkles,
  Tag,
  Layers,
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  Globe,
  Hash,
  Wand2,
  Plus
} from 'lucide-react';
import { OrderModal } from '../components/OrderModal';
import { TrackOrderModal } from '../../components/TrackOrderModal';
import { ShippingLabelSlip } from '../../components/ShippingLabelSlip';
import { fetchShippingLabelSettings, DEFAULT_SHIPPING_LABEL_SETTINGS } from '../../utils/shippingLabelEngine';
import { ShippingLabelSettings } from '../../types';

const COURIER_OPTIONS = [
  'Delhivery Express',
  'BlueDart Surface & Air',
  'FedEx Priority',
  'DTDC Express',
  'DHL Express Worldwide',
  'India Post Speed Post',
  'Xpressbees Logistics'
];

const STATUS_OPTIONS = [
  { id: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-900 border-purple-200' },
  { id: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  { id: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  { id: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-900 border-blue-200' },
  { id: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-900 border-red-200' },
];

export interface ManualTrackingRow {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  courier_name: string;
  tracking_number: string;
  estimated_delivery: string;
}

export function OrdersManager() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [couponMap, setCouponMap] = useState<Record<string, { code: string; discount: number }>>({});
  const [shippingLabelSettings, setShippingLabelSettings] = useState<ShippingLabelSettings>(DEFAULT_SHIPPING_LABEL_SETTINGS);
  const [loading, setLoading] = useState(true);
  
  // Modals & Single Selection States
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingEditOrder, setTrackingEditOrder] = useState<any | null>(null);
  const [singleLabelOrder, setSingleLabelOrder] = useState<any | null>(null);
  const [trackOrderModalOpen, setTrackOrderModalOpen] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Bulk Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dual-Tab Bulk Update State
  const [bulkTab, setBulkTab] = useState<'manual' | 'quick'>('manual');
  const [manualRows, setManualRows] = useState<ManualTrackingRow[]>([]);

  // Tab 2 Quick Apply Fields
  const [bulkStatus, setBulkStatus] = useState('shipped');
  const [bulkCourier, setBulkCourier] = useState('Delhivery Express');
  const [bulkAutoAwb, setBulkAutoAwb] = useState(true);
  const [bulkMilestoneTitle, setBulkMilestoneTitle] = useState('Order Dispatched via Courier');
  const [bulkMilestoneDesc, setBulkMilestoneDesc] = useState('Shipment package handed over to carrier hub.');
  const [bulkMilestoneLocation, setBulkMilestoneLocation] = useState('Chennai Central Logistics Center, TN');

  const fetchOrders = async () => {
    setLoading(true);
    const labelSettings = await fetchShippingLabelSettings();
    setShippingLabelSettings(labelSettings);

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(full_name, email, phone)')
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data);

      const { data: usages } = await supabase
        .from('coupon_usages')
        .select('order_id, coupon_code, discount_applied');

      if (usages) {
        const map: Record<string, { code: string; discount: number }> = {};
        usages.forEach((u: any) => {
          if (u.order_id) {
            map[u.order_id] = {
              code: u.coupon_code,
              discount: Number(u.discount_applied || 0)
            };
          }
        });
        setCouponMap(map);
      }
    }
    if (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openBulkModal = () => {
    const selectedList = orders.filter(o => selectedOrderIds.includes(o.id));
    const rows: ManualTrackingRow[] = selectedList.map(o => ({
      id: o.id,
      order_number: o.order_number || o.id?.slice(0, 8),
      customer_name: o.customers?.full_name || o.shipping_address?.name || 'Valued Collector',
      status: (o.status === 'delivered' || o.status === 'out_for_delivery') ? o.status : 'shipped',
      courier_name: o.courier_name || 'Delhivery Express',
      tracking_number: o.tracking_number || '',
      estimated_delivery: o.estimated_delivery_date ? o.estimated_delivery_date.slice(0, 10) : '2-3 Business Days',
    }));
    setManualRows(rows);
    setBulkTab('manual');
    setIsBulkModalOpen(true);
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customers?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tracking_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'paid' && (order.status === 'paid' || order.payment_status === 'paid')) ||
      (filterStatus === 'cod' && (order.payment_status === 'COD' || order.payment_info === 'Cash on Delivery')) ||
      (filterStatus === 'pending' && (order.status === 'pending' || !order.status)) ||
      (filterStatus === 'processing' && order.status === 'processing') ||
      (filterStatus === 'shipped' && (order.status === 'shipped' || order.status === 'in_transit')) ||
      (filterStatus === 'delivered' && order.status === 'delivered') ||
      (filterStatus === 'cancelled' && order.status === 'cancelled');

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // INLINE STATUS CHANGE (MATCHING SCREENSHOT INTERACTIVE DROPDOWN)
  const handleInlineStatusChange = async (orderId: string, newStatus: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select();

    if (!error && data && data.length > 0) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setNotice({ type: 'success', message: `Order status updated to ${newStatus.toUpperCase()}!` });
    } else {
      console.error('Error updating status inline:', error);
      setNotice({ type: 'error', message: 'Failed to update order status.' });
    }
  };

  // TAB 1: BATCH HELPERS FOR MANUAL TRACKING TABLE
  const handleBatchSetShipped = () => {
    setManualRows(manualRows.map(r => ({ ...r, status: 'shipped' })));
  };

  const handleBatchGenAwbs = () => {
    setManualRows(manualRows.map(r => ({
      ...r,
      tracking_number: r.tracking_number.trim() ? r.tracking_number : `AWB-${r.order_number.replace('#', '')}-EXP`
    })));
  };

  const handleBatchSetCourier = (courierName: string) => {
    if (!courierName) return;
    setManualRows(manualRows.map(r => ({ ...r, courier_name: courierName })));
  };

  const handleSingleGenAwb = (rowId: string, orderNum: string) => {
    setManualRows(manualRows.map(r => r.id === rowId ? {
      ...r,
      tracking_number: `AWB-${orderNum.replace('#', '')}-EXP`
    } : r));
  };

  const parseValidTimestamp = (val: string | null | undefined): string | null => {
    if (!val || !val.trim()) return null;
    const trimmed = val.trim();
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    // Fallback for text phrases like "2-3 Business Days": 3 days from now
    return new Date(Date.now() + 3 * 86400000).toISOString();
  };

  // SAVE TAB 1: MANUAL TRACKING DETAILS PER ORDER
  const handleSaveManualRows = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRows.length === 0) return;

    setBulkUpdating(true);
    setNotice(null);

    try {
      const updates = manualRows.map(row => {
        const payload: any = {
          status: row.status || 'shipped',
          courier_name: row.courier_name || 'Delhivery Express',
          updated_at: new Date().toISOString(),
        };

        if (row.tracking_number.trim()) payload.tracking_number = row.tracking_number.trim();
        if (row.estimated_delivery.trim()) {
          const parsedTS = parseValidTimestamp(row.estimated_delivery);
          if (parsedTS) payload.estimated_delivery_date = parsedTS;
        }

        return supabase.from('orders').update(payload).eq('id', row.id).select();
      });

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Errors updating orders in Supabase DB:', errors);
        setNotice({ type: 'error', message: `Failed to update ${errors.length} orders: ${errors[0].error?.message}` });
      } else {
        setNotice({ 
          type: 'success', 
          message: `Successfully saved & synced manual tracking details for ${manualRows.length} orders to backend database!` 
        });
      }

      setIsBulkModalOpen(false);
      setSelectedOrderIds([]);
      await fetchOrders();
    } catch (err) {
      console.error('Save manual rows error:', err);
      setNotice({ type: 'error', message: 'Failed to save manual tracking details.' });
    } finally {
      setBulkUpdating(false);
    }
  };

  // SAVE TAB 2: UNIFIED QUICK APPLY (All Same Settings)
  const handleExecuteQuickApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0) return;

    setBulkUpdating(true);
    setNotice(null);

    try {
      const updates = orders
        .filter(o => selectedOrderIds.includes(o.id))
        .map(o => {
          const autoTrackingNo = o.tracking_number || (bulkAutoAwb ? `AWB-${(o.order_number || '9021').replace('#', '')}-EXP` : null);

          return supabase
            .from('orders')
            .update({
              status: bulkStatus || 'shipped',
              courier_name: bulkCourier,
              tracking_number: autoTrackingNo,
              updated_at: new Date().toISOString(),
            })
            .eq('id', o.id)
            .select();
        });

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Errors updating orders in Supabase DB:', errors);
        setNotice({ type: 'error', message: `Failed to update ${errors.length} orders: ${errors[0].error?.message}` });
      } else {
        setNotice({ 
          type: 'success', 
          message: `Successfully executed Quick Apply for ${selectedOrderIds.length} orders! Status set to "${bulkStatus}" & courier set to "${bulkCourier}".` 
        });
      }

      setIsBulkModalOpen(false);
      setSelectedOrderIds([]);
      await fetchOrders();
    } catch (err) {
      console.error('Quick apply error:', err);
      setNotice({ type: 'error', message: 'Failed to execute bulk update.' });
    } finally {
      setBulkUpdating(false);
    }
  };

  // SINGLE ORDER TRACKING UPDATE
  const handleSaveSingleTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingEditOrder) return;

    setBulkUpdating(true);
    const payload: any = {
      status: trackingEditOrder.status || 'shipped',
      courier_name: trackingEditOrder.courier_name,
      tracking_number: trackingEditOrder.tracking_number,
      tracking_url: trackingEditOrder.tracking_url,
      updated_at: new Date().toISOString(),
    };

    if (trackingEditOrder.estimated_delivery_date) {
      const parsedTS = parseValidTimestamp(trackingEditOrder.estimated_delivery_date);
      if (parsedTS) payload.estimated_delivery_date = parsedTS;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', trackingEditOrder.id)
      .select();

    if (!error && data && data.length > 0) {
      const updatedItem = data[0];
      setNotice({ type: 'success', message: `Tracking info & status updated to ${updatedItem.status?.toUpperCase()} for Order ${updatedItem.order_number || updatedItem.id}!` });
      setTrackingEditOrder(null);
      await fetchOrders();
    } else {
      console.error('Error updating single tracking:', error);
      setNotice({ type: 'error', message: `Failed to update tracking info: ${error?.message || 'Unknown DB error'}` });
    }
    setBulkUpdating(false);
  };

  // Dedicated clean print popup handler for single shipping label
  const handlePrintSingleLabel = () => {
    const slipEl = document.getElementById('single-shipping-label-canvas');
    if (!slipEl) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Label - ${singleLabelOrder?.order_number || singleLabelOrder?.id || ''}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: auto; margin: 5mm; }
              body { font-family: system-ui, -apple-system, sans-serif; background: #ffffff; margin: 0; padding: 12px; }
            </style>
          </head>
          <body>
            <div style="max-width: 550px; margin: 0 auto;">
              ${slipEl.innerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-24">
      
      {/* Header Bar (Matching User Screenshot Exactly) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f1513] tracking-tight">Orders & Tracking Hub</h2>
          <p className="text-xs text-[#747878] mt-1">
            Manage store orders, delivery lifecycle, courier AWBs, milestone timelines, and bulk status updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Public Tracker (/track) Button */}
          <button
            onClick={() => setTrackOrderModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
            <span>Public Tracker (/track)</span>
          </button>

          {/* Shipping Labels Studio Button */}
          <Link
            to="/admin/shipping-labels"
            className="flex items-center gap-2 px-4 py-2 bg-[#00875a] hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Shipping Labels Studio</span>
          </Link>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#ffffff] p-3 rounded-2xl border border-[#ece8df] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input 
            type="text"
            placeholder="Search order #, AWB tracking, customer, or Razorpay ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#fed65b] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: '⏰ Pending' },
            { id: 'processing', label: '⚙️ Processing' },
            { id: 'shipped', label: '🚚 Shipped' },
            { id: 'delivered', label: '🟢 Delivered' },
            { id: 'cancelled', label: '🔴 Cancelled' },
            { id: 'cod', label: '💵 COD' },
            { id: 'paid', label: '✅ Paid' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === status.id
                  ? 'bg-[#0f1513] text-[#fed65b] shadow-xs'
                  : 'bg-[#fbfaf8] text-[#555] hover:bg-[#f2efe9]'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE (MATCHING USER SCREENSHOT SPECIFICATIONS EXACTLY) */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fcfbfa] border-b border-[#ece8df] text-[11px] font-extrabold text-[#747878] uppercase tracking-wider font-mono">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                  />
                </th>
                <th className="p-4">ORDER REFERENCE</th>
                <th className="p-4">CUSTOMER & CITY</th>
                <th className="p-4">COURIER & AWB</th>
                <th className="p-4">DATE</th>
                <th className="p-4">TOTAL</th>
                <th className="p-4">PROCESSING STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#747878]">
                    <Clock className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No orders matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedOrderIds.includes(order.id);
                  const isPaid = order.status === 'paid' || order.payment_status === 'paid' || order.payment_status === 'captured';
                  const isCOD = order.payment_status === 'COD' || order.payment_info === 'Cash on Delivery';

                  const trackingNo = order.tracking_number;
                  const courier = order.courier_name || 'Delhivery Express';
                  const appliedCoupon = couponMap[order.id] || (order.coupon_code ? { code: order.coupon_code } : null);

                  return (
                    <tr key={order.id} className={`hover:bg-[#fcfbfa] transition-colors ${isChecked ? 'bg-[#fbf7eb]' : ''}`}>
                      
                      {/* Checkbox Column */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                        />
                      </td>

                      {/* COLUMN 1: ORDER REFERENCE (Order # + COD/PREPAID Badge) */}
                      <td className="p-4 font-mono">
                        <div className="font-extrabold text-sm text-[#0f1513]">
                          #{order.order_number || order.id?.slice(0, 8)}
                        </div>
                        <div className="mt-1">
                          {isCOD ? (
                            <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                              COD
                            </span>
                          ) : (
                            <span className="inline-block bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                              PREPAID
                            </span>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 2: CUSTOMER & CITY */}
                      <td className="p-4">
                        <div className="font-bold text-xs text-[#0f1513]">
                          {order.customers?.full_name || order.shipping_address?.name || 'Valued Collector'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {typeof order.shipping_address === 'object' && order.shipping_address?.city 
                            ? `${order.shipping_address.city}, ${order.shipping_address.state || 'Tamil Nadu'}`
                            : 'chennai, Tamil Nadu'}
                        </div>
                      </td>

                      {/* COLUMN 3: COURIER & AWB (OR "+ Assign AWB" LINK) */}
                      <td className="p-4">
                        {trackingNo ? (
                          <div>
                            <div className="font-mono font-bold text-xs text-[#0f1513]">
                              {trackingNo}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {courier}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setTrackingEditOrder({
                              ...order,
                              status: (order.status === 'delivered' || order.status === 'out_for_delivery') ? order.status : 'shipped',
                              courier_name: courier,
                              tracking_number: `AWB-${(order.order_number || '9021').replace('#', '')}-EXP`
                            })}
                            className="text-blue-600 hover:text-blue-800 font-extrabold text-xs cursor-pointer flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assign AWB</span>
                          </button>
                        )}
                      </td>

                      {/* COLUMN 4: DATE */}
                      <td className="p-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* COLUMN 5: TOTAL (+ Coupon Badge) */}
                      <td className="p-4 font-mono">
                        <div className="font-extrabold text-xs text-[#0f1513]">
                          {getCurrencySymbol(order.currency)}{Number(order.total_amount || 0).toLocaleString('en-IN')}
                        </div>
                        {appliedCoupon && (
                          <div className="text-[10px] font-bold text-emerald-700 mt-0.5 uppercase tracking-wider font-mono">
                            {appliedCoupon.code}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 6: PROCESSING STATUS (INLINE COLOR-CODED SELECTOR PILL) */}
                      <td className="p-4">
                        <select
                          value={order.status || 'pending'}
                          onChange={e => handleInlineStatusChange(order.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border cursor-pointer focus:outline-none transition-all shadow-2xs ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : order.status === 'shipped' || order.status === 'in_transit'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : order.status === 'out_for_delivery'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* COLUMN 7: ACTIONS (3 DISTINCT PILL BUTTONS: Track, Label, View) */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. Track Button */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setTrackOrderModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                            title="Live Track Shipment"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track</span>
                          </button>

                          {/* 2. Label Button */}
                          <button
                            onClick={() => setSingleLabelOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                            title="Shipping Label Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-600" />
                            <span>Label</span>
                          </button>

                          {/* 3. View Button */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                            title="Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                            <span>View</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BULK ACTION BAR */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0f1513] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-gray-700 flex flex-wrap items-center gap-4 animate-bounce-gentle">
          <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
            <span className="bg-[#fed65b] text-[#0f1513] font-black text-xs px-2.5 py-0.5 rounded-full">
              {selectedOrderIds.length} Selected
            </span>
            <span className="text-xs text-gray-300 font-bold">Bulk Action Tools:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openBulkModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#fed65b] text-[#0f1513] font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-md cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Bulk Update Orders ({selectedOrderIds.length})</span>
            </button>

            <Link
              to="/admin/shipping-labels"
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Shipping Labels View</span>
            </Link>
          </div>

          <button
            onClick={() => setSelectedOrderIds([])}
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* DUAL-TAB BULK UPDATE MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#1b1c1c] w-full max-w-4xl rounded-[24px] overflow-hidden shadow-2xl border border-[#e8e4dc] max-h-[90vh] flex flex-col">
            
            {/* Dark Navy Header Banner */}
            <div className="bg-[#0f1513] text-white p-5 flex justify-between items-center border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#fed65b]/20 text-[#fed65b] border border-[#fed65b]/40 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">Bulk Update {selectedOrderIds.length} Orders</h3>
                  <p className="text-[11px] text-gray-300">
                    {bulkTab === 'manual' 
                      ? 'Manually enter or edit individual tracking AWBs, couriers, and delivery estimates per order'
                      : 'Apply unified status changes, courier partners, and tracking updates simultaneously'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SEGMENT CONTROLS */}
            <div className="bg-[#f9f7f3] px-6 py-3 border-b border-[#e8e4dc] flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBulkTab('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  bulkTab === 'manual'
                    ? 'bg-[#0066ff] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Manual Tracking Table ({selectedOrderIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkTab('quick')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  bulkTab === 'quick'
                    ? 'bg-[#0066ff] text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Quick Apply (All Same Settings)</span>
              </button>
            </div>

            {/* TAB 1: MANUAL TRACKING TABLE */}
            {bulkTab === 'manual' && (
              <form onSubmit={handleSaveManualRows} className="flex-1 flex flex-col min-h-0">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  
                  {/* BATCH HELPERS BAR */}
                  <div className="bg-[#f5f8ff] p-3 rounded-2xl border border-[#d6e4ff] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-gray-700 text-[11px] uppercase tracking-wider">Batch Helpers:</span>
                      
                      <button
                        type="button"
                        onClick={handleBatchSetShipped}
                        className="px-3 py-1.5 bg-white text-purple-900 font-bold border border-purple-200 rounded-xl hover:bg-purple-50 transition-all cursor-pointer shadow-2xs"
                      >
                        Set All Status ➔ Shipped
                      </button>

                      <button
                        type="button"
                        onClick={handleBatchGenAwbs}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#e6f9f0] text-emerald-900 font-extrabold border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Generate Missing AWBs</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handleBatchSetCourier(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 bg-white text-gray-800 font-bold border border-gray-300 rounded-xl text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="">Set All Courier Partners...</option>
                        {COURIER_OPTIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* MANUAL TRACKING TABLE */}
                  <div className="border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Order & Customer</th>
                            <th className="p-3 w-36">Status</th>
                            <th className="p-3 w-44">Courier Partner</th>
                            <th className="p-3 w-64">Manual AWB Number</th>
                            <th className="p-3 w-40">Est. Delivery</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f2efe9] bg-white">
                          {manualRows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-[#fcfbfa] transition-colors">
                              
                              <td className="p-3 font-mono">
                                <div className="font-extrabold text-[#0f1513] text-xs">
                                  {row.order_number}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate max-w-[150px]">
                                  {row.customer_name}
                                </div>
                              </td>

                              <td className="p-3">
                                <select
                                  value={row.status}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setManualRows(manualRows.map((r, i) => i === idx ? { ...r, status: val } : r));
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                                >
                                  {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-3">
                                <select
                                  value={row.courier_name}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setManualRows(manualRows.map((r, i) => i === idx ? { ...r, courier_name: val } : r));
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                                >
                                  {COURIER_OPTIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl px-2 py-0.5 focus-within:border-[#0066ff]">
                                  <input
                                    type="text"
                                    value={row.tracking_number}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setManualRows(manualRows.map((r, i) => i === idx ? { ...r, tracking_number: val } : r));
                                    }}
                                    placeholder="Enter or paste AWB tracking..."
                                    className="w-full bg-transparent font-mono font-bold text-xs text-[#0f1513] outline-none py-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSingleGenAwb(row.id, row.order_number)}
                                    className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-0.5"
                                    title="Auto Generate AWB for this order"
                                  >
                                    <Wand2 className="w-3 h-3 text-amber-600" />
                                    <span>Gen</span>
                                  </button>
                                </div>
                              </td>

                              <td className="p-3">
                                <input
                                  type="text"
                                  value={row.estimated_delivery}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setManualRows(manualRows.map((r, i) => i === idx ? { ...r, estimated_delivery: val } : r));
                                  }}
                                  placeholder="2-3 Business Days"
                                  className="w-full px-2.5 py-1.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                                />
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between items-center p-4 border-t border-[#e8e4dc] bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-bold hover:text-black cursor-pointer text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bulkUpdating}
                    className="px-6 py-2.5 bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>{bulkUpdating ? 'Saving...' : `Save All Manual Tracking Details (${manualRows.length} Orders)`}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: QUICK APPLY */}
            {bulkTab === 'quick' && (
              <form onSubmit={handleExecuteQuickApply} className="flex-1 flex flex-col min-h-0">
                <div className="p-6 space-y-5 text-xs overflow-y-auto custom-scrollbar flex-1">
                  
                  <div>
                    <label className="block font-bold text-gray-800 mb-1.5">Set New Processing Status</label>
                    <select
                      value={bulkStatus}
                      onChange={e => setBulkStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none focus:border-[#0f1513]"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1.5">Assign Courier Partner</label>
                    <select
                      value={bulkCourier}
                      onChange={e => setBulkCourier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none focus:border-[#0f1513]"
                    >
                      {COURIER_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 font-bold text-gray-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={bulkAutoAwb}
                      onChange={e => setBulkAutoAwb(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                    />
                    <span>Auto-generate tracking AWB for orders missing an AWB</span>
                  </label>

                  <div className="bg-[#f9f7f3] p-4 rounded-2xl border border-[#e8e4dc] space-y-3">
                    <span className="font-extrabold text-[#0f1513] text-[11px] uppercase tracking-wider block">
                      Append Milestone Event to Customer Timelines
                    </span>

                    <input
                      type="text"
                      value={bulkMilestoneTitle}
                      onChange={e => setBulkMilestoneTitle(e.target.value)}
                      placeholder="Order Dispatched via Courier"
                      className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl font-semibold text-xs focus:outline-none"
                    />

                    <input
                      type="text"
                      value={bulkMilestoneDesc}
                      onChange={e => setBulkMilestoneDesc(e.target.value)}
                      placeholder="Shipment package handed over to carrier hub."
                      className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />

                    <input
                      type="text"
                      value={bulkMilestoneLocation}
                      onChange={e => setBulkMilestoneLocation(e.target.value)}
                      placeholder="Chennai Central Logistics Center, TN"
                      className="w-full px-3 py-2 bg-white border border-[#e5e1d8] rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                </div>

                <div className="flex justify-between items-center p-4 border-t border-[#e8e4dc] bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-bold hover:text-black cursor-pointer text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={bulkUpdating}
                    className="px-6 py-2.5 bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>{bulkUpdating ? 'Executing...' : `Execute Bulk Update (${selectedOrderIds.length} Orders)`}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* SINGLE SHIPPING LABEL VIEW MODAL */}
      {singleLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#1b1c1c] w-full max-w-xl rounded-[24px] overflow-hidden shadow-2xl border border-[#e8e4dc]">
            <div className="bg-[#0f1513] text-white p-5 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#fed65b]" />
                <h3 className="font-bold text-base">Shipping Label View - Order #{singleLabelOrder.order_number || singleLabelOrder.id}</h3>
              </div>
              <button onClick={() => setSingleLabelOrder(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar bg-gray-50">
              <div id="single-shipping-label-canvas">
                <ShippingLabelSlip
                  order={singleLabelOrder}
                  settings={shippingLabelSettings}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-[#e8e4dc] bg-white">
              <button
                type="button"
                onClick={() => setSingleLabelOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-100 text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintSingleLabel}
                className="px-6 py-2 bg-[#fed65b] text-[#0f1513] font-bold rounded-xl hover:bg-black hover:text-white transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Shipping Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ORDER TRACKING UPDATE MODAL DRAWER */}
      {trackingEditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#1b1c1c] w-full max-w-lg rounded-[24px] overflow-hidden shadow-2xl border border-[#e8e4dc]">
            <div className="bg-[#0f1513] text-white p-5 flex justify-between items-center border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#fed65b]" />
                <h3 className="font-bold text-base">Update Order Status & AWB Tracking</h3>
              </div>
              <button onClick={() => setTrackingEditOrder(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleTracking} className="p-6 space-y-4 text-xs">
              <div className="bg-[#f9f7f3] p-3 rounded-xl border border-[#e8e4dc] flex justify-between items-center">
                <span className="font-bold text-[#0f1513]">Order Number:</span>
                <span className="font-mono font-extrabold text-sm">{trackingEditOrder.order_number || trackingEditOrder.id}</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Shipment Status *</label>
                <select
                  value={trackingEditOrder.status || 'shipped'}
                  onChange={e => setTrackingEditOrder({ ...trackingEditOrder, status: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <span className="text-[10px] text-purple-700 font-semibold mt-1 block">
                  ✨ Automatically set to "Shipped" when editing shipping details.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Courier Partner</label>
                  <select
                    value={trackingEditOrder.courier_name || ''}
                    onChange={e => setTrackingEditOrder({ ...trackingEditOrder, courier_name: e.target.value, status: trackingEditOrder.status === 'delivered' ? 'delivered' : 'shipped' })}
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                  >
                    {COURIER_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">AWB Tracking Number</label>
                  <input
                    type="text"
                    value={trackingEditOrder.tracking_number || ''}
                    onChange={e => setTrackingEditOrder({ ...trackingEditOrder, tracking_number: e.target.value, status: trackingEditOrder.status === 'delivered' ? 'delivered' : 'shipped' })}
                    placeholder="AWB-9021-EXP"
                    className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-mono font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Carrier Tracking Portal Link (URL)</label>
                <input
                  type="text"
                  value={trackingEditOrder.tracking_url || ''}
                  onChange={e => setTrackingEditOrder({ ...trackingEditOrder, tracking_url: e.target.value, status: trackingEditOrder.status === 'delivered' ? 'delivered' : 'shipped' })}
                  placeholder="https://www.delhivery.com/..."
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={trackingEditOrder.estimated_delivery_date ? trackingEditOrder.estimated_delivery_date.slice(0, 10) : ''}
                  onChange={e => setTrackingEditOrder({ ...trackingEditOrder, estimated_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl font-bold text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e4dc]">
                <button
                  type="button"
                  onClick={() => setTrackingEditOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUpdating}
                  className="px-6 py-2 bg-[#0f1513] text-[#fed65b] font-bold rounded-xl hover:bg-black transition-all cursor-pointer"
                >
                  {bulkUpdating ? 'Saving...' : 'Save Tracking Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ORDER DETAILS MODAL (UPGRADED WITH MOCKUP PROPS) */}
      <OrderModal 
        isOpen={!!selectedOrder && !trackOrderModalOpen}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onOpenUpdateTracking={(ord) => {
          setSelectedOrder(null);
          setTrackingEditOrder({
            ...ord,
            status: (ord.status === 'delivered' || ord.status === 'out_for_delivery') ? ord.status : 'shipped',
            courier_name: ord.courier_name || 'Delhivery Express',
            tracking_number: ord.tracking_number || `AWB-${(ord.order_number || '9021').replace('#', '')}-EXP`
          });
        }}
        onOpenPrintLabel={(ord) => {
          setSelectedOrder(null);
          setSingleLabelOrder(ord);
        }}
      />


      {/* TRACK ORDER TIMELINE MODAL */}
      <TrackOrderModal
        isOpen={trackOrderModalOpen}
        onClose={() => {
          setTrackOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        initialQuery={selectedOrder?.order_number || selectedOrder?.tracking_number || selectedOrder?.id}
      />
    </div>
  );
}
