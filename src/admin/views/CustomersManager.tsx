import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Eye } from 'lucide-react';
import { CustomerModal } from '../components/CustomerModal';

export function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (data) {
        setCustomers(data);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  if (loading) return <div className="text-gray-500">Loading Customers...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customers Management</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Phone</th>
              <th className="p-4 font-semibold text-gray-600">Joined</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No customers found.</td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{customer.full_name || 'N/A'}</td>
                <td className="p-4 text-gray-600">{customer.email}</td>
                <td className="p-4 text-gray-600">{customer.phone || 'N/A'}</td>
                <td className="p-4 text-gray-600">{new Date(customer.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button onClick={() => setSelectedCustomer(customer)} className="text-gray-500 hover:text-[#1b1c1c] transition-colors" title="View Customer">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomerModal 
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
