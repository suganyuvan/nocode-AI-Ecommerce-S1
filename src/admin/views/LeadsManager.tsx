import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

export function LeadsManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
      if (data) {
        setLeads(data);
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  if (loading) return <div className="text-gray-500">Loading Leads...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Newsletter Leads</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Phone</th>
              <th className="p-4 font-semibold text-gray-600">Subscribed On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No leads found.</td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{lead.full_name || 'N/A'}</td>
                <td className="p-4 text-gray-600">{lead.email}</td>
                <td className="p-4 text-gray-600">{lead.country_code} {lead.phone}</td>
                <td className="p-4 text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
