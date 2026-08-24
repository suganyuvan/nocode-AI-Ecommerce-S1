import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Eye, ShieldCheck, RefreshCw, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { OrderModal } from '../components/OrderModal';

export function OrdersManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(full_name, email, phone)')
      .order('created_at', { ascending: false });
    if (data) {
      setOrders(data);
    }
    if (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      (order.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'paid') {
      return matchesSearch && (order.status === 'paid' || order.payment_status === 'paid' || order.payment_status === 'captured');
    }
    if (filterStatus === 'pending') {
      return matchesSearch && (order.status !== 'paid' && order.payment_status !== 'paid' && order.payment_status !== 'captured');
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#1b1c1c]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Orders & Transactions</h2>
          <p className="text-xs text-[#747878] mt-1 font-label-caps uppercase tracking-wider">
            Real-time Razorpay Payment Gateway tracking and webhook synchronization
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#ffffff] p-3 rounded-2xl border border-[#ece8df] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input 
            type="text"
            placeholder="Search order #, customer, or Razorpay ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'paid', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#0f1513] text-[#fed65b] shadow-xs'
                  : 'bg-[#fbfaf8] text-[#777] hover:text-[#111] hover:bg-[#f4f2ec]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-xs font-semibold text-[#555] uppercase tracking-wider font-label-caps">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Collector / Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Razorpay Ref</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#747878]">
                    <Clock className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No orders matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.status === 'paid' || order.payment_status === 'paid' || order.payment_status === 'captured';
                  const isFailed = order.payment_status === 'failed';

                  return (
                    <tr key={order.id} className="hover:bg-[#fcfbfa] transition-colors">
                      <td className="p-4 font-mono font-bold text-xs text-[#111615]">
                        {order.order_number || order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-xs text-[#111615]">{order.customers?.full_name || 'Anonymous Connoisseur'}</div>
                        <div className="text-[11px] text-[#747878]">{order.customers?.email || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-[#747878] text-xs">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-[#fed65b]/25 text-[#735c00] border border-[#fed65b]/40'
                              : isFailed
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.status || order.payment_status || 'Pending'}
                          </span>
                          {order.webhook_verified && (
                            <span title="Verified by Fallback Webhook System" className="text-[#d4af37]">
                              <ShieldCheck className="w-4 h-4 fill-current" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {order.razorpay_payment_id ? (
                          <div className="font-mono text-xs text-[#111615] bg-[#f7f5f0] px-2 py-0.5 rounded-md border border-[#e8e4db] inline-block font-semibold">
                            {order.razorpay_payment_id}
                          </div>
                        ) : order.razorpay_order_id ? (
                          <div className="font-mono text-[11px] text-[#747878]">
                            {order.razorpay_order_id}
                          </div>
                        ) : (
                          <span className="text-xs text-[#999] italic">Pending Checkout</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-xs font-sans text-[#111615]">
                        {getCurrencySymbol(order.currency)}{Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-[#747878] hover:text-[#111615] hover:bg-[#f2efe9] rounded-lg transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderModal 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}
