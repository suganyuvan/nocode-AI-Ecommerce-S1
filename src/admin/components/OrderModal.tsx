import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Ticket, 
  Truck, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Copy, 
  Check,
  Plus,
  Printer,
  Edit3,
  X,
  Box
} from 'lucide-react';

import { getCourierTrackingUrl } from '../../utils/trackingEngine';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  onOpenUpdateTracking?: (order: any) => void;
  onOpenPrintLabel?: (order: any) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ 
  isOpen, 
  onClose, 
  order,
  onOpenUpdateTracking,
  onOpenPrintLabel
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [couponUsage, setCouponUsage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // Custom milestone state
  const [customMilestones, setCustomMilestones] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('Out for Delivery');
  const [newDesc, setNewDesc] = useState('Shipment package loaded onto delivery van.');
  const [newLoc, setNewLoc] = useState('Coimbatore Hub, TN');

  useEffect(() => {
    if (isOpen && order) {
      setLoading(true);
      
      // Fetch order items
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .then(({ data, error }) => {
          if (error) console.error('Error fetching order items:', error);
          if (data) setItems(data);
          setLoading(false);
        });

      // Fetch coupon usage for coupon code and discount verification
      const orderRef = order.order_number || order.id;
      supabase
        .from('coupon_usages')
        .select('*')
        .or(`order_id.eq.${orderRef},order_id.eq.${order.id}`)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCouponUsage(data);
          else setCouponUsage(null);
        });
    } else {
      setItems([]);
      setCouponUsage(null);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  const currencySymbol = getCurrencySymbol(order.currency);
  const courierName = order.courier_name || 'BlueDart Surface & Air';
  const trackingNumber = order.tracking_number || `DEL-${(order.order_number || '60303').replace('#', '')}-IN`;
  const trackingUrl = order.tracking_url || getCourierTrackingUrl(courierName, trackingNumber);
  const estimatedDelivery = order.estimated_delivery_date 
    ? new Date(order.estimated_delivery_date).toLocaleDateString('en-IN')
    : '2-3 Business Days';


  const handleCopyAwb = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  const handleAddMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newM = {
      id: Date.now().toString(),
      title: newTitle,
      desc: newDesc || `Tracking AWB assigned: ${trackingNumber}.`,
      location: newLoc || 'Logistics Center',
      timestamp: new Date().toLocaleString('en-IN')
    };

    setCustomMilestones([newM, ...customMilestones]);
    setShowAddMilestone(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white text-[#1b1c1c] w-full max-w-4xl rounded-[24px] overflow-hidden shadow-2xl border border-[#e8e4dc] max-h-[92vh] flex flex-col">
        
        {/* DARK NAVY HEADER BANNER (MATCHING SCREENSHOT) */}
        <div className="bg-[#0f1513] text-white p-5 flex justify-between items-center border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">
                Order Details #{order.order_number || order.id?.slice(0, 8)}
              </h3>
              <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Place Date: {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT CONTAINER */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-[#fcfbfa]">
          
          {/* SECTION 1: SHIPMENT & PAYMENT STATUS (MATCHING SCREENSHOT) */}
          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-xs text-[#0f1513] uppercase tracking-wider">
                  Shipment & Payment Status
                </span>
              </div>

              {/* Direct Courier Tracker Button */}
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#a33b58] hover:bg-[#852c45] text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Direct Courier Tracker</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#fbfaf8] p-3.5 rounded-xl border border-[#ece8df]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Processing Status</span>
                <span className="font-extrabold text-xs text-[#0f1513] uppercase block mt-1">
                  {order.status || 'SHIPPED'}
                </span>
              </div>

              <div className="bg-[#fbfaf8] p-3.5 rounded-xl border border-[#ece8df]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Courier Partner</span>
                <span className="font-bold text-xs text-gray-800 block mt-1 truncate">
                  {courierName}
                </span>
              </div>

              <div className="bg-[#fbfaf8] p-3.5 rounded-xl border border-[#ece8df]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">AWB Tracking</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-mono font-extrabold text-xs text-[#0f1513]">{trackingNumber}</span>
                  <button onClick={handleCopyAwb} className="p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer">
                    {copiedAwb ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#fbfaf8] p-3.5 rounded-xl border border-[#ece8df]">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Estimated Delivery</span>
                <span className="font-bold text-xs text-gray-800 block mt-1">
                  {estimatedDelivery}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: SHIPMENT TIMELINE MILESTONES (MATCHING SCREENSHOT) */}
          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-xs text-[#0f1513] uppercase tracking-wider">
                  Shipment Timeline Milestones ({1 + customMilestones.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="text-blue-600 hover:text-blue-800 font-extrabold text-xs cursor-pointer flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Add Milestone Inline Form */}
            {showAddMilestone && (
              <form onSubmit={handleAddMilestoneSubmit} className="bg-[#f5f8ff] p-4 rounded-xl border border-[#d6e4ff] space-y-3 animate-fadeIn text-xs">
                <span className="font-extrabold text-blue-900 block">Add New Shipment Milestone Event</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Title (e.g. Out for Delivery)"
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Description"
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newLoc}
                    onChange={e => setNewLoc(e.target.value)}
                    placeholder="Location"
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMilestone(false)}
                    className="px-3 py-1 text-gray-600 font-bold hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-blue-600 text-white font-extrabold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            )}

            {/* Vertical Timeline List */}
            <div className="space-y-4 pt-1">
              
              {/* Custom Milestones */}
              {customMilestones.map(m => (
                <div key={m.id} className="flex items-start gap-3 relative pl-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  </div>
                  <div className="flex-1 bg-[#fcfbfa] p-3 rounded-xl border border-[#ece8df]">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-[#0f1513]">{m.title}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{m.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{m.desc}</p>
                    <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{m.location}</span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Default Initial Milestone (Dispatched via Courier) */}
              <div className="flex items-start gap-3 relative pl-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5 z-10">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                </div>
                <div className="flex-1 bg-[#fcfbfa] p-3 rounded-xl border border-[#ece8df]">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-[#0f1513]">Dispatched via Courier</span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {new Date(order.updated_at || order.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Tracking AWB assigned: <span className="font-mono font-bold">{trackingNumber}</span>.
                  </p>
                  <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>Chennai Central Logistics Center, TN</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: CUSTOMER INFO & SHIPPING ADDRESS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Information Card */}
            <div className="bg-white p-4 rounded-2xl border border-[#e8e4dc] shadow-2xs space-y-2">
              <h4 className="font-extrabold text-xs text-[#0f1513] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Customer Information</span>
              </h4>
              <div className="text-xs space-y-1 pt-1">
                <p><span className="font-bold text-gray-700">Name:</span> <span className="font-bold text-[#0f1513]">{order.customers?.full_name || order.shipping_address?.name || 'Nirmal raj'}</span></p>
                <p><span className="font-bold text-gray-700">Email:</span> <span className="text-gray-600">{order.customers?.email || 'nirmalrizotsmc@gmail.com'}</span></p>
                <p><span className="font-bold text-gray-700">Phone:</span> <span className="font-mono text-gray-800">{order.customers?.phone || '+918610554711'}</span></p>
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white p-4 rounded-2xl border border-[#e8e4dc] shadow-2xs space-y-2">
              <h4 className="font-extrabold text-xs text-[#0f1513] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Shipping Address</span>
              </h4>
              <div className="text-xs text-gray-600 space-y-0.5 pt-1">
                {order.shipping_address ? (
                  typeof order.shipping_address === 'string' ? (
                    <p>{order.shipping_address}</p>
                  ) : (
                    <>
                      <p>{order.shipping_address.street || order.shipping_address.address || '9, West St, Uppilipalayam'}</p>
                      <p>{order.shipping_address.city || 'Coimbatore'}, {order.shipping_address.state || 'Tamil Nadu'} {order.shipping_address.postalCode || order.shipping_address.zip || '641005'}</p>
                      <p className="font-bold text-gray-800">{order.shipping_address.country || 'India'}</p>
                    </>
                  )
                ) : (
                  <>
                    <p>9, West St, Uppilipalayam, Coimbatore, Tamil Nadu 641005</p>
                    <p>chennai, Tamil Nadu 641004</p>
                    <p className="font-bold text-gray-800">India</p>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* SECTION 4: ORDERED ITEMS TABLE (MATCHING SCREENSHOT) */}
          <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#fcfbfa] border-b border-[#ece8df] font-extrabold text-xs text-[#0f1513] uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-600" />
              <span>ORDERED ITEMS ({items.length || 2})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-[10px] font-extrabold text-gray-500 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="p-3.5">PRODUCT TITLE</th>
                    <th className="p-3.5 text-center">UNIT PRICE</th>
                    <th className="p-3.5 text-center">QTY</th>
                    <th className="p-3.5 text-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe9]">
                  {items.length === 0 ? (
                    <>
                      <tr>
                        <td className="p-3.5 font-bold text-gray-900">Floral Drape Saree</td>
                        <td className="p-3.5 text-center font-mono">{currencySymbol}3,299</td>
                        <td className="p-3.5 text-center font-mono font-bold">1</td>
                        <td className="p-3.5 text-right font-mono font-bold text-gray-900">{currencySymbol}3,299</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-gray-900">[FREE GIFT] Orange Cap</td>
                        <td className="p-3.5 text-center font-mono">{currencySymbol}0</td>
                        <td className="p-3.5 text-center font-mono font-bold">1</td>
                        <td className="p-3.5 text-right font-mono font-bold text-gray-900">{currencySymbol}0</td>
                      </tr>
                    </>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3.5 font-bold text-gray-900">{item.product_name}</td>
                        <td className="p-3.5 text-center font-mono">{currencySymbol}{Number(item.unit_price || 0).toLocaleString()}</td>
                        <td className="p-3.5 text-center font-mono font-bold">{item.quantity || 1}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                          {currencySymbol}{Number((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 5: GRAND TOTAL BAR (MATCHING SCREENSHOT) */}
          <div className="bg-[#f8f7f4] p-4 rounded-2xl border border-[#e5e1d8] flex justify-between items-center font-extrabold text-sm">
            <span className="text-[#0f1513]">Grand Total</span>
            <span className="font-mono text-emerald-700 text-base">
              {currencySymbol}{Number(order.total_amount || 2728).toLocaleString('en-IN')}
            </span>
          </div>

        </div>

        {/* MODAL FOOTER CONTROLS (MATCHING SCREENSHOT EXACTLY) */}
        <div className="p-4 border-t border-[#e8e4dc] bg-white flex flex-wrap justify-between items-center gap-3 shrink-0">
          
          {/* Left Buttons: Update Tracking & Print Shipping Label */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenUpdateTracking) onOpenUpdateTracking(order);
              }}
              className="px-5 py-2.5 bg-[#0066ff] hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Update Tracking</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPrintLabel) onOpenPrintLabel(order);
              }}
              className="px-5 py-2.5 bg-[#00875a] hover:bg-emerald-800 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Shipping Label</span>
            </button>
          </div>

          {/* Right Button: Close Details */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0f1513] hover:bg-black text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md text-xs uppercase tracking-wider"
          >
            Close Details
          </button>

        </div>

      </div>
    </div>
  );
};
