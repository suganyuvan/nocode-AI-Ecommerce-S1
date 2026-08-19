import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { User, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error('Error fetching customer orders:', error);
          if (data) setOrders(data);
          setLoading(false);
        });
    } else {
      setOrders([]);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-2xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden max-h-[90vh] flex flex-col font-body-md">
        
        {/* Header */}
        <div className="bg-[#1c1b1b] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-headline-md text-lg font-bold">
            Customer Profile
          </h3>
          <button onClick={onClose} className="text-white hover:opacity-70 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-start space-x-4">
            <div className="w-16 h-16 bg-[#fed65b] rounded-full flex items-center justify-center text-[#1b1c1c] text-2xl font-bold flex-shrink-0">
              {customer.full_name?.charAt(0) || 'C'}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">{customer.full_name || 'Unknown Name'}</h2>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {customer.phone}
                </div>
              )}
              {customer.address && (
                <div className="flex items-start text-sm text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Orders */}
          <h4 className="font-bold mb-4 text-gray-900 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" /> Order History
          </h4>
          
          {loading ? (
            <p className="text-sm text-gray-500">Loading orders...</p>
          ) : orders.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Order ID</th>
                    <th className="p-3 font-semibold text-gray-600">Date</th>
                    <th className="p-3 font-semibold text-gray-600">Status</th>
                    <th className="p-3 font-semibold text-gray-600 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">#{order.id.slice(0, 6).toUpperCase()}</td>
                      <td className="p-3 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-900 text-right">
                        {order.currency === 'INR' ? '₹' : order.currency === 'USD' ? '$' : order.currency}{order.total_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">This customer hasn't placed any orders yet.</p>
          )}

        </div>
      </div>
    </div>
  );
};
