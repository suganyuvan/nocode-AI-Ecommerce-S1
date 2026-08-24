import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Mail, Search, RefreshCw, Sparkles } from 'lucide-react';

export function LeadsManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    if (data) {
      setLeads(data);
    }
    if (error) {
      console.error('Error fetching leads:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => 
    (lead.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6 text-[#1b1c1c]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Leads & Enquiries</h2>
          <p className="text-xs text-[#747878] mt-1 font-label-caps uppercase tracking-wider">
            Newsletter subscribers and custom commission inquiries
          </p>
        </div>
        <button
          onClick={fetchLeads}
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
            placeholder="Search lead name, email, or country code..."
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
                <th className="p-4">Subscriber Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Contact / Phone</th>
                <th className="p-4">Interest & Source</th>
                <th className="p-4 text-right">Date Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#747878]">
                    <Mail className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No newsletter subscribers found.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#fcfbfa] transition-colors">
                    <td className="p-4 font-bold text-xs text-[#111615]">
                      {lead.full_name || 'Anonymous Visitor'}
                    </td>
                    <td className="p-4 text-[#747878] text-xs font-mono">{lead.email}</td>
                    <td className="p-4 text-[#747878] text-xs font-mono">
                      {lead.country_code ? `${lead.country_code} ` : ''}{lead.phone || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/30">
                        <Sparkles className="w-3 h-3 text-[#d4af37]" />
                        Heritage Catalog VIP
                      </span>
                    </td>
                    <td className="p-4 text-right text-[#747878] text-xs">
                      {new Date(lead.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
