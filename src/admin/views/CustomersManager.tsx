import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Eye, Users, Search, RefreshCw, Crown } from 'lucide-react';
import { CustomerModal } from '../components/CustomerModal';

export function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) {
      setCustomers(data);
    }
    if (error) {
      console.error('Error fetching customers:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 text-[#1b1c1c]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Clients & Customers</h2>
          <p className="text-xs text-[#747878] mt-1 font-label-caps uppercase tracking-wider">
            Directory of registered clients, shipping addresses, and contact details
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex bg-[#ffffff] p-3 rounded-2xl border border-[#ece8df] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999]" />
          <input 
            type="text"
            placeholder="Search collector name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-xs font-semibold text-[#555] uppercase tracking-wider font-label-caps">
              <tr>
                <th className="p-4">Collector Profile</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone / Contact</th>
                <th className="p-4">Member Since</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#747878]">
                    <Users className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No collectors found.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fcfbfa] transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#735c00] to-[#fed65b] p-0.5 shadow-xs shrink-0">
                        <div className="w-full h-full rounded-full bg-[#f4f2ec] flex items-center justify-center font-bold text-xs text-[#735c00]">
                          {customer.full_name ? customer.full_name[0].toUpperCase() : 'C'}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#111615] block">{customer.full_name || 'Customer'}</span>
                        <span className="text-[11px] text-[#fed65b] font-semibold bg-[#0f1513] px-1.5 py-0.2 rounded text-[10px]">Registered Client</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#747878] text-xs">{customer.email}</td>
                    <td className="p-4 text-[#747878] text-xs font-mono">{customer.phone || 'N/A'}</td>
                    <td className="p-4 text-[#747878] text-xs">
                      {new Date(customer.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedCustomer(customer)} 
                        className="p-2 text-[#747878] hover:text-[#111615] hover:bg-[#f2efe9] rounded-lg transition-colors cursor-pointer" 
                        title="View Collector Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal 
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
