import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { SupportTicket, TicketMessage } from '../../types';
import { 
  LifeBuoy, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  X, 
  Filter, 
  Tag, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { dispatchWebhookEvent } from '../../utils/webhookDispatcher';
import { sendSupportTicketResponseEmail } from '../../utils/resendEmailEngine';

const QUICK_RESPONSES = [
  {
    title: '📦 Order Dispatched / On Track',
    text: 'Hello! Thank you for reaching out. We have verified your shipment with our dedicated courier logistics partner. Your consignment is securely packed and on schedule for delivery.'
  },
  {
    title: '🪵 Bespoke Craftsmanship Update',
    text: 'Greetings! Our master artisans in Swamimalai are currently hand-carving and polishing your requested masterpiece. We ensure the highest standard of precision and traditional craftsmanship.'
  },
  {
    title: '🛡️ Return / Replacement Approved',
    text: 'We understand your concern. Your request for inspection/replacement has been approved under our Heritage Quality Assurance policy. Our courier partner will schedule reverse pickup shortly.'
  },
  {
    title: '💳 Payment / Invoice Verification',
    text: 'We have verified your transaction and billing record in our merchant gateway. Your GST invoice and payment receipt are fully confirmed and attached to your customer account.'
  },
];

export function SupportTicketsManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Active Ticket Drawer / Modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [adminStatus, setAdminStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('in_progress');
  const [adminPriority, setAdminPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setTickets(data as SupportTicket[]);
      }
      if (error) {
        console.error('Error fetching support tickets:', error);
      }
    } catch (err) {
      console.error('Exception fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered Tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.order_number && ticket.order_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const urgentCount = tickets.filter(t => t.priority === 'Urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

  const handleOpenTicketModal = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setAdminStatus(ticket.status || 'open');
    setAdminPriority(ticket.priority || 'Medium');
    setInternalNotes(ticket.internal_notes || '');
    setAdminResponseText('');
    setActionSuccess(null);
  };

  const handleQuickStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (!error) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        if (activeTicket?.id === ticketId) {
          setActiveTicket(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleSubmitAdminResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!adminResponseText.trim() && !internalNotes.trim() && adminStatus === activeTicket.status && adminPriority === activeTicket.priority)) {
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const existingMessages = Array.isArray(activeTicket.messages) ? [...activeTicket.messages] : [];
      
      if (adminResponseText.trim()) {
        const newMessage: TicketMessage = {
          id: `msg-${Date.now()}`,
          sender: 'admin',
          sender_name: 'Irisjev Heritage Support Concierge',
          message: adminResponseText.trim(),
          created_at: new Date().toISOString()
        };
        existingMessages.push(newMessage);
      }

      const updatePayload: any = {
        status: adminStatus,
        priority: adminPriority,
        internal_notes: internalNotes.trim(),
        messages: existingMessages,
        updated_at: new Date().toISOString()
      };

      if (adminResponseText.trim()) {
        updatePayload.admin_response = adminResponseText.trim();
        updatePayload.admin_responded_at = new Date().toISOString();
        updatePayload.admin_responder_name = 'Irisjev Support Staff';
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updatePayload)
        .eq('id', activeTicket.id);

      if (error) throw error;

      // Update local state
      const updatedTicket: SupportTicket = {
        ...activeTicket,
        ...updatePayload,
      };

      // Dispatch ticket.responded webhook event to external endpoints
      dispatchWebhookEvent('ticket.responded', {
        ticket_id: activeTicket.id,
        ticket_number: activeTicket.ticket_number,
        sender: 'admin',
        customer_name: activeTicket.customer_name,
        customer_email: activeTicket.customer_email,
        category: activeTicket.category,
        priority: adminPriority,
        status: adminStatus,
        admin_response: adminResponseText.trim() || undefined,
        responded_at: new Date().toISOString()
      });

      // Send luxury HTML concierge response email via Resend
      if (adminResponseText.trim()) {
        sendSupportTicketResponseEmail({
          ticketNumber: activeTicket.ticket_number,
          customerName: activeTicket.customer_name,
          customerEmail: activeTicket.customer_email,
          subject: activeTicket.subject,
          adminResponse: adminResponseText.trim(),
          status: adminStatus,
        }).catch(err => console.warn('Resend ticket response email notice:', err));
      }

      setTickets(prev => prev.map(t => t.id === activeTicket.id ? updatedTicket : t));
      setActiveTicket(updatedTicket);
      setAdminResponseText('');
      setActionSuccess('Response & status updated successfully!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      console.error('Failed to submit response:', err);
      alert('Failed to submit response: ' + (err?.message || 'Database error'));
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30">● Open / Pending</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">⚙️ In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">✓ Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/30">🔒 Closed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-500/10 text-gray-300">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"><Flame className="w-3 h-3 text-red-500" /> Urgent</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">Medium</span>;
      case 'Low':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">Low</span>;
      default:
        return <span className="text-xs text-gray-400">{priority}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151c1b] border border-[#232f2e] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fed65b]/20 to-[#fed65b]/5 border border-[#fed65b]/30 flex items-center justify-center text-[#fed65b] shadow-inner">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white tracking-wide">Customer Support & Tickets</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fed65b]/10 text-[#fed65b] border border-[#fed65b]/30">
                LIVE CONCIERGE
              </span>
            </div>
            <p className="text-sm text-[#a19f99] mt-0.5">
              Review customer inquiries, send official responses, and manage ticket lifecycles.
            </p>
          </div>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1b2524] hover:bg-[#232f2e] text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all border border-[#2f3e3d] cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Total Tickets</span>
            <LifeBuoy className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-2">{totalCount}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Open & Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-display text-amber-400 mt-2">{openCount}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-blue-400 text-xs font-label-caps uppercase tracking-wider">
            <span>In Progress</span>
            <AlertCircle className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-display text-blue-400 mt-2">{inProgressCount}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-2">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket #, customer, email, subject..."
              className="w-full pl-10 pr-4 py-2 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-sm focus:outline-none focus:border-[#fed65b] transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0d1312] border border-[#232f2e] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#fed65b]"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open / Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#0d1312] border border-[#232f2e] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#fed65b]"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0d1312] border border-[#232f2e] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#fed65b]"
            >
              <option value="all">All Categories</option>
              <option value="Order & Shipment">Order & Shipment</option>
              <option value="Product & Craftsmanship">Product & Craftsmanship</option>
              <option value="Bespoke Custom Commission">Bespoke Custom Commission</option>
              <option value="Returns & Replacement">Returns & Replacement</option>
              <option value="Payment & Billing">Payment & Billing</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#fed65b]" />
            <p className="text-sm">Fetching support tickets from database...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <LifeBuoy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Tickets Found</h3>
            <p className="text-xs text-gray-500">
              {searchTerm || filterStatus !== 'all' ? 'No tickets match the selected filter criteria.' : 'No customer support tickets have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#232f2e] bg-[#0d1312]/60 text-[11px] font-label-caps uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-4 font-semibold">Ticket Details</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Related Order</th>
                  <th className="py-3.5 px-4 font-semibold">Category & Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232f2e]/60">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id || ticket.ticket_number}
                    className="hover:bg-[#1b2524]/60 transition-colors group cursor-pointer"
                    onClick={() => handleOpenTicketModal(ticket)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#fed65b] bg-[#fed65b]/10 px-2 py-0.5 rounded border border-[#fed65b]/20">
                          {ticket.ticket_number}
                        </span>
                        {ticket.admin_response && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            ✓ Responded
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-white mt-1 group-hover:text-[#fed65b] transition-colors line-clamp-1">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {ticket.description}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{ticket.customer_name}</div>
                      <div className="text-xs text-gray-400">{ticket.customer_email}</div>
                      {ticket.customer_phone && (
                        <div className="text-[11px] text-gray-500">{ticket.customer_phone}</div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {ticket.order_number ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-gray-200 bg-[#0d1312] px-2.5 py-1 rounded border border-[#232f2e]">
                          <ShoppingBag className="w-3 h-3 text-[#fed65b]" />
                          {ticket.order_number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 italic">General Inquiry</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs text-gray-300 font-medium">{ticket.category}</span>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </td>

                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleQuickStatusChange(ticket.id!, e.target.value as any)}
                        className="bg-[#0d1312] border border-[#232f2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#fed65b]"
                      >
                        <option value="open">Open / Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTicketModal(ticket);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#fed65b]/10 hover:bg-[#fed65b] text-[#fed65b] hover:text-[#1b1c1c] text-xs font-bold font-label-caps uppercase tracking-wider rounded-lg transition-colors border border-[#fed65b]/30 cursor-pointer"
                      >
                        <span>Respond</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Response Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#232f2e] flex items-center justify-between bg-[#0d1312]/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#fed65b] bg-[#fed65b]/10 px-3 py-1 rounded border border-[#fed65b]/20">
                  {activeTicket.ticket_number}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                    {activeTicket.subject}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Created on {activeTicket.created_at ? new Date(activeTicket.created_at).toLocaleString() : 'Recent'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1b2524] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Customer Info & Ticket Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0d1312] p-4 rounded-xl border border-[#232f2e]">
                <div>
                  <span className="text-[11px] font-label-caps uppercase tracking-wider text-gray-500 font-bold block mb-1">
                    Customer Info
                  </span>
                  <p className="text-sm font-semibold text-white">{activeTicket.customer_name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-[#fed65b]" /> {activeTicket.customer_email}
                  </p>
                  {activeTicket.customer_phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#fed65b]" /> {activeTicket.customer_phone}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-label-caps uppercase tracking-wider text-gray-500 font-bold block mb-1">
                    Related Order
                  </span>
                  {activeTicket.order_number ? (
                    <p className="text-sm font-mono font-bold text-[#fed65b] flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" /> {activeTicket.order_number}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">None (General Inquiry)</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Category: <span className="text-gray-200 font-medium">{activeTicket.category}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-label-caps uppercase tracking-wider text-gray-500 font-bold block mb-1">
                    Ticket Status & Priority
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                </div>
              </div>

              {/* Conversation History / Ticket Messages */}
              <div className="space-y-4">
                <h3 className="text-xs font-label-caps uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#fed65b]" />
                  <span>Conversation Thread</span>
                </h3>

                {/* Original Customer Message */}
                <div className="bg-[#0d1312] border border-[#232f2e] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#232f2e] pb-2">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#fed65b]" />
                      {activeTicket.customer_name} (Customer)
                    </span>
                    <span>{activeTicket.created_at ? new Date(activeTicket.created_at).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {activeTicket.description}
                  </p>
                </div>

                {/* Additional Messages / Admin Responses */}
                {Array.isArray(activeTicket.messages) && activeTicket.messages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx}
                    className={`rounded-xl p-4 space-y-2 border ${
                      msg.sender === 'admin' 
                        ? 'bg-[#1b2524] border-[#fed65b]/30 ml-4 md:ml-8' 
                        : 'bg-[#0d1312] border-[#232f2e] mr-4 md:mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs border-b border-[#232f2e] pb-2">
                      <span className={`font-semibold flex items-center gap-1.5 ${msg.sender === 'admin' ? 'text-[#fed65b]' : 'text-white'}`}>
                        {msg.sender === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-[#fed65b]" /> : <User className="w-3.5 h-3.5 text-gray-400" />}
                        {msg.sender_name} {msg.sender === 'admin' && '(Concierge Staff)'}
                      </span>
                      <span className="text-gray-400">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Response Composer & Actions */}
              <form onSubmit={handleSubmitAdminResponse} className="space-y-4 pt-4 border-t border-[#232f2e]">
                {/* Quick Response Templates */}
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-400 font-bold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#fed65b]" />
                    <span>Quick Response Snippets</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_RESPONSES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAdminResponseText(tmpl.text)}
                        className="p-2.5 bg-[#0d1312] hover:bg-[#1b2524] border border-[#232f2e] hover:border-[#fed65b]/40 rounded-xl text-left text-xs transition-colors cursor-pointer group"
                      >
                        <p className="font-semibold text-gray-200 group-hover:text-[#fed65b]">{tmpl.title}</p>
                        <p className="text-gray-400 line-clamp-1 mt-0.5">{tmpl.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Text Input */}
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-2">
                    Official Admin Reply (Visible to Customer in their account)
                  </label>
                  <textarea
                    rows={4}
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    placeholder="Type your response to the customer..."
                    className="w-full p-3 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-sm focus:outline-none focus:border-[#fed65b] transition-colors resize-none"
                  />
                </div>

                {/* Status & Priority Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                      Update Ticket Status
                    </label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                    >
                      <option value="open">Open / Action Required</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={adminPriority}
                      onChange={(e) => setAdminPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Internal Notes (Staff-only) */}
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                    Internal Staff Notes (Private — not visible to customer)
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Courier ticket raised with Delhivery tracking #DEL-91823"
                    className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-gray-300 text-xs focus:outline-none focus:border-[#fed65b]"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2.5 bg-transparent hover:bg-[#1b2524] text-gray-300 text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingResponse ? 'Submitting...' : 'Send Response & Update Ticket'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
