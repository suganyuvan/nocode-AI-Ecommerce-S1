import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Mail, Search, RefreshCw, Sparkles, CheckCircle2, Clock, X, Sliders, Check } from 'lucide-react';

const LEAD_STATUS_OPTIONS = [
  { id: 'new', label: '✨ New Lead', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'processing', label: '⚙️ Processing / In Touch', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { id: 'contacted', label: '💬 Contacted', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 'converted', label: '🎉 Converted to Order', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'closed', label: '🔒 Closed', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export function LeadsManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Bulk Selection States
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    // Fetch from newsletter_subscribers table or leads table
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone || '').includes(searchTerm);

    const matchesStatus = 
      filterStatus === 'all' || (lead.status || 'new') === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleSingleStatusUpdate = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (!error) {
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      setNotice({ type: 'success', message: 'Lead status updated successfully!' });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedLeadIds.length === 0) return;
    setBulkUpdating(true);
    setNotice(null);

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', selectedLeadIds);

    if (!error) {
      setNotice({ type: 'success', message: `Bulk updated ${selectedLeadIds.length} leads to status "${newStatus}"!` });
      setSelectedLeadIds([]);
      fetchLeads();
    } else {
      setNotice({ type: 'error', message: 'Failed to bulk update lead status.' });
    }
    setBulkUpdating(false);
  };

  return (
    <div className="space-y-6 text-[#1b1c1c] max-w-[1400px] mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-[#e8e4dc] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Leads & Commission Enquiries</h2>
            <span className="bg-[#fed65b] text-[#0f1513] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Processing Status Included
            </span>
          </div>
          <p className="text-xs text-[#747878] mt-1">
            Newsletter subscribers, custom sculpture commission inquiries, and lead processing pipeline.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
          Refresh
        </button>
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
            placeholder="Search lead name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#fbfaf8] border border-[#e5e1d8] rounded-xl focus:outline-none focus:border-[#fed65b] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'new', label: '✨ New' },
            { id: 'processing', label: '⚙️ Processing' },
            { id: 'contacted', label: '💬 Contacted' },
            { id: 'converted', label: '🎉 Converted' },
            { id: 'closed', label: '🔒 Closed' },
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-xs font-semibold text-[#555] uppercase tracking-wider font-label-caps">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                  />
                </th>
                <th className="p-4">Subscriber / Lead Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Contact / Phone</th>
                <th className="p-4">Pipeline Status</th>
                <th className="p-4 text-right">Date Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#747878]">
                    <Mail className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No newsletter subscribers or leads found.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isChecked = selectedLeadIds.includes(lead.id);
                  const currentStatus = lead.status || 'new';

                  return (
                    <tr key={lead.id} className={`hover:bg-[#fcfbfa] transition-colors ${isChecked ? 'bg-[#fbf7eb]' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded text-[#0f1513] focus:ring-[#fed65b] cursor-pointer"
                        />
                      </td>

                      <td className="p-4 font-bold text-xs text-[#111615]">
                        {lead.full_name || 'Anonymous Visitor'}
                      </td>

                      <td className="p-4 text-[#747878] text-xs font-mono">{lead.email}</td>

                      <td className="p-4 text-[#747878] text-xs font-mono">
                        {lead.country_code ? `${lead.country_code} ` : ''}{lead.phone || 'N/A'}
                      </td>

                      <td className="p-4">
                        <select
                          value={currentStatus}
                          onChange={e => handleSingleStatusUpdate(lead.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${
                            currentStatus === 'converted'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : currentStatus === 'processing'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : currentStatus === 'contacted'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {LEAD_STATUS_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id} className="text-black bg-white">{opt.label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4 text-right text-xs text-[#747878]">
                        {new Date(lead.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
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
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0f1513] text-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-4 animate-bounce-gentle">
          <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
            <span className="bg-[#fed65b] text-[#0f1513] font-black text-xs px-2.5 py-0.5 rounded-full">
              {selectedLeadIds.length} Selected
            </span>
            <span className="text-xs text-gray-300 font-bold">Bulk Lead Tools:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Bulk Update Status:</span>
            <select
              disabled={bulkUpdating}
              onChange={e => {
                if (e.target.value) {
                  handleBulkStatusUpdate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 outline-none cursor-pointer"
            >
              <option value="" className="text-black">Choose Status...</option>
              {LEAD_STATUS_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id} className="text-black">{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSelectedLeadIds([])}
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer ml-auto"
          >
            Clear
          </button>
        </div>
      )}

    </div>
  );
}
