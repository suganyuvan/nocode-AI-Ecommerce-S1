import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Package, User, MapPin, CreditCard } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, order }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      setLoading(true);
      supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .then(({ data, error }) => {
          if (error) console.error('Error fetching order items:', error);
          if (data) setItems(data);
          setLoading(false);
        });
    } else {
      setItems([]);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-3xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden max-h-[90vh] flex flex-col font-body-md">
        
        {/* Header */}
        <div className="bg-[#1c1b1b] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-headline-md text-lg font-bold">
            Order Details <span className="text-[#fed65b] ml-2">#{order.id.slice(0, 8).toUpperCase()}</span>
          </h3>
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
              <p className="text-sm font-medium text-gray-900">{order.customers?.full_name || 'Unknown Customer'}</p>
              <p className="text-sm text-gray-600">{order.customers?.email || 'N/A'}</p>
              {order.customers?.phone && <p className="text-sm text-gray-600">{order.customers.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <Package className="w-4 h-4 mr-2" /> Order Information
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium capitalize text-blue-600">{order.status || 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <CreditCard className="w-4 h-4 mr-2" /> Payment Details
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-medium capitalize">{order.payment_status || 'Unpaid'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-bold text-gray-900">{currencySymbol}{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="font-bold mb-3 flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-2" /> Shipping Address
              </h4>
              {order.shipping_address ? (
                <address className="not-italic text-sm text-gray-600">
                  {(order.shipping_address as any).street}<br />
                  {(order.shipping_address as any).city}, {(order.shipping_address as any).state} {(order.shipping_address as any).postalCode}<br />
                  {(order.shipping_address as any).country}
                </address>
              ) : (
                <p className="text-sm text-gray-500">No shipping address provided.</p>
              )}
            </div>
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
                    <th className="p-3 font-semibold text-gray-600 text-right">Price</th>
                    <th className="p-3 font-semibold text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="p-3 text-gray-600">{item.selected_timber || 'N/A'}</td>
                      <td className="p-3 text-gray-600 text-center">{item.quantity}</td>
                      <td className="p-3 text-gray-600 text-right">{currencySymbol}{item.unit_price}</td>
                      <td className="p-3 font-medium text-gray-900 text-right">
                        {currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">No items found for this order.</p>
          )}

        </div>
      </div>
    </div>
  );
};
