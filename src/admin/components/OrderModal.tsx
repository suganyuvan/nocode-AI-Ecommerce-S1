import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Package, User, MapPin, CreditCard, ShieldCheck, Ticket } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, order }) => {
  const [items, setItems] = useState<any[]>([]);
  const [couponUsage, setCouponUsage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Pre-process items to retroactively identify gifts for older orders
  const processedItems = React.useMemo(() => {
    if (!items || items.length === 0 || !order) return [];

    const rawTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    let remainingDiff = rawTotal - (order.subtotal || 0);

    const clonedItems = items.map(item => ({
      ...item,
      isGift: item.unit_price === 0 || item.product_name.includes('(Free Gift)')
    }));

    // For old orders where the price wasn't 0 in DB but excluded from subtotal
    if (remainingDiff > 0) {
      const sortedIndices = clonedItems
        .map((item, index) => ({ index, total: item.unit_price * item.quantity, isGift: item.isGift }))
        .filter(x => !x.isGift)
        .sort((a, b) => a.total - b.total);
        
      for (const { index, total } of sortedIndices) {
        // We use a small epsilon for floating point comparison just in case
        if (remainingDiff >= total - 0.01 && total > 0) {
          clonedItems[index].isGift = true;
          remainingDiff -= total;
        }
      }
    }
    
    return clonedItems;
  }, [items, order]);

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
  const isPaid = order.status === 'paid' || order.payment_status === 'paid' || order.payment_status === 'captured';
  const isCOD = order.payment_info === 'Cash on Delivery';

  const appliedCouponCode = order.coupon_code || couponUsage?.coupon_code || null;
  const appliedDiscountAmount = Number(order.discount_amount || couponUsage?.discount_applied || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-3xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden max-h-[90vh] flex flex-col font-body-md">
        
        {/* Header */}
        <div className="bg-[#1c1b1b] text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="font-headline-md text-lg font-bold flex items-center gap-2">
              Order Details <span className="text-[#fed65b]">#{order.order_number || order.id.slice(0, 8).toUpperCase()}</span>
            </h3>
            <p className="text-xs text-gray-300">Created: {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-70 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <User className="w-4 h-4 mr-2" /> Customer Information
              </h4>
              <p className="text-sm font-medium text-gray-900">{order.customers?.full_name || 'Valued Collector'}</p>
              <p className="text-sm text-gray-600">{order.customers?.email || 'N/A'}</p>
              {order.customers?.phone && <p className="text-sm text-gray-600 font-mono">{order.customers.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <Package className="w-4 h-4 mr-2" /> Order & Gateway Status
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Status:</span>
                  <span className={`font-semibold capitalize ${isPaid ? 'text-emerald-600' : isCOD ? 'text-[#735c00] font-bold' : order.status === 'confirmed' ? 'text-[#735c00]' : 'text-amber-600'}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gateway Sync:</span>
                  <span className="font-medium flex items-center gap-1">
                    {order.webhook_verified ? (
                      <span className="text-[#735c00] flex items-center text-xs gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Webhook Fallback Active
                      </span>
                    ) : isCOD ? (
                      <span className="text-gray-500 text-xs italic">N/A (Cash on Delivery)</span>
                    ) : (
                      <span className="text-gray-600 text-xs">Direct API Verified</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <CreditCard className="w-4 h-4 mr-2" /> {isCOD ? 'Payment Details (COD)' : 'Razorpay Transaction Details'}
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`font-bold uppercase ${isPaid ? 'text-emerald-600' : isCOD ? 'text-[#735c00]' : 'text-amber-600'}`}>
                    {isCOD ? 'COD - Pending' : (order.payment_status || (isPaid ? 'Paid' : 'Unpaid'))}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment ID:</span>
                    <span className="font-mono text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
                {order.razorpay_order_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">RZP Order ID:</span>
                    <span className="font-mono text-gray-700">
                      {order.razorpay_order_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500 font-semibold">Total Amount:</span>
                  <span className="font-bold text-gray-900 text-sm">{currencySymbol}{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2" /> Shipping Address
              </h4>
              {order.shipping_address ? (
                typeof order.shipping_address === 'string' ? (
                  <p className="text-sm text-gray-600">{order.shipping_address}</p>
                ) : (
                  <address className="not-italic text-sm text-gray-600 space-y-0.5">
                    <p>{order.shipping_address.street}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</p>
                    <p className="font-medium text-gray-700">{order.shipping_address.country}</p>
                  </address>
                )
              ) : (
                <p className="text-sm text-gray-500">No shipping address provided.</p>
              )}
            </div>

            {/* Applied Coupon Card */}
            {(appliedCouponCode || appliedDiscountAmount > 0) && (
              <div className="md:col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Applied Coupon / Promo Code
                    </span>
                    <span className="font-mono font-bold text-emerald-950 text-base">
                      {appliedCouponCode ? `🎟️ ${appliedCouponCode}` : 'DISCOUNT APPLIED'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Discount Savings</span>
                  <span className="font-bold text-emerald-700 text-base">
                    -{currencySymbol}{appliedDiscountAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <h4 className="font-bold mb-4 text-gray-900">Order Items</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading items...</p>
          ) : items.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Product</th>
                    <th className="p-3 font-semibold text-gray-600">Timber</th>
                    <th className="p-3 font-semibold text-gray-600 text-center">Qty</th>
                    <th className="p-3 font-semibold text-gray-600 text-right">Unit Price</th>
                    <th className="p-3 font-semibold text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">
                        {item.product_name} 
                        {item.isGift && !item.product_name.includes('(Free Gift)') && (
                          <span className="text-emerald-600 font-bold text-xs ml-2">(FREE GIFT)</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">{item.selected_timber || 'Heritage Sandalwood'}</td>
                      <td className="p-3 text-gray-600 text-center">{item.quantity}</td>
                      <td className="p-3 text-gray-600 text-right">
                        {item.isGift ? <span className="text-emerald-600 font-bold">FREE</span> : `${currencySymbol}${item.unit_price}`}
                      </td>
                      <td className="p-3 font-medium text-gray-900 text-right">
                        {item.isGift ? <span className="text-emerald-600 font-bold">FREE</span> : `${currencySymbol}${(item.quantity * item.unit_price).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{order.subtotal || 0}</span>
                  </div>
                  {appliedDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <span>Discount {appliedCouponCode ? `(${appliedCouponCode})` : ''}:</span>
                      <span>-{currencySymbol}{appliedDiscountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span>{order.shipping_charge === 0 && appliedCouponCode?.includes('SHIP') ? (
                      <span className="text-emerald-700 font-bold">FREE (Coupon)</span>
                    ) : (
                      `${currencySymbol}${order.shipping_charge || 0}`
                    )}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST {order.gst_rate ? `(${order.gst_rate}%)` : ''}:</span>
                    <span>{currencySymbol}{order.gst_amount || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-200 text-base">
                    <span>Total:</span>
                    <span>{currencySymbol}{order.total_amount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">No items found for this order.</p>
          )}

        </div>
      </div>
    </div>
  );
};
