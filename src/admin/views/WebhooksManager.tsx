import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { OutgoingWebhook, WebhookDelivery } from '../../types';
import { 
  AVAILABLE_WEBHOOK_EVENTS, 
  sendTestWebhook, 
  dispatchWebhookEvent 
} from '../../utils/webhookDispatcher';
import { 
  Webhook, 
  Plus, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Globe, 
  Key, 
  Trash2, 
  Edit, 
  Play, 
  Check, 
  Clock, 
  Layers, 
  Terminal, 
  Activity,
  Copy
} from 'lucide-react';

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<OutgoingWebhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'deliveries' | 'dispatcher'>('endpoints');

  // Add / Edit Endpoint Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<OutgoingWebhook | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>(['order.created', 'order.paid', 'order.shipped']);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Test Ping State
  const [testingWebhookUrl, setTestingWebhookUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ url: string; success: boolean; status: number; body: string; durationMs: number; error?: string } | null>(null);

  // Manual Dispatcher State
  const [dispatchTargetUrl, setDispatchTargetUrl] = useState('');
  const [dispatchEventName, setDispatchEventName] = useState('order.created');
  const [dispatchCustomJson, setDispatchCustomJson] = useState(
    JSON.stringify({
      order_number: 'SWARNA-913527',
      customer_name: 'Sugan B',
      customer_email: 'sugan@example.com',
      total_amount: 108199,
      status: 'confirmed',
      courier_name: 'Delhivery Express',
      tracking_number: 'DEL849201948',
    }, null, 2)
  );
  const [isDispatchingManual, setIsDispatchingManual] = useState(false);
  const [manualDispatchResult, setManualDispatchResult] = useState<any | null>(null);

  // Selected Log Details Modal
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchWebhooksAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch webhooks
      const { data: whData, error: whErr } = await supabase
        .from('outgoing_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (whData) setWebhooks(whData);
      if (whErr) console.error('Error fetching webhooks:', whErr);

      // 2. Fetch deliveries
      const { data: delData, error: delErr } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (delData) setDeliveries(delData);
      if (delErr) console.error('Error fetching deliveries:', delErr);
    } catch (e) {
      console.error('Exception fetching webhook data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooksAndLogs();
  }, []);

  const openAddModal = () => {
    setEditingWebhook(null);
    setFormName('');
    setFormUrl('');
    setFormSecret(`whsec_${Math.random().toString(36).substring(2, 12)}`);
    setFormEvents(['order.created', 'order.paid', 'order.shipped']);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: OutgoingWebhook) => {
    setEditingWebhook(wh);
    setFormName(wh.name);
    setFormUrl(wh.url);
    setFormSecret(wh.secret_key || '');
    setFormEvents(Array.isArray(wh.events) ? wh.events : ['order.created']);
    setFormIsActive(wh.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a friendly webhook name.');
      return;
    }
    if (!formUrl.trim() || !formUrl.startsWith('http')) {
      setFormError('Please enter a valid HTTP/HTTPS endpoint URL (e.g. https://api.make.com/webhook/...)');
      return;
    }
    if (formEvents.length === 0) {
      setFormError('Please select at least one event trigger.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      url: formUrl.trim(),
      secret_key: formSecret.trim() || null,
      events: formEvents,
      is_active: formIsActive,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingWebhook?.id) {
        const { error } = await supabase
          .from('outgoing_webhooks')
          .update(payload)
          .eq('id', editingWebhook.id);

        if (error) throw error;
        setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? { ...w, ...payload } : w));
        showNotice('Webhook endpoint updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('outgoing_webhooks')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setWebhooks(prev => [data, ...prev]);
        showNotice('New webhook endpoint registered successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving webhook:', err);
      setFormError('Failed to save webhook: ' + (err?.message || 'Database error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this webhook endpoint?')) return;
    try {
      const { error } = await supabase.from('outgoing_webhooks').delete().eq('id', id);
      if (!error) {
        setWebhooks(prev => prev.filter(w => w.id !== id));
        showNotice('Webhook endpoint deleted.');
      }
    } catch (e) {
      console.error('Error deleting webhook:', e);
    }
  };

  const handleToggleActive = async (wh: OutgoingWebhook) => {
    const updated = !wh.is_active;
    try {
      const { error } = await supabase
        .from('outgoing_webhooks')
        .update({ is_active: updated, updated_at: new Date().toISOString() })
        .eq('id', wh.id);

      if (!error) {
        setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, is_active: updated } : w));
      }
    } catch (e) {
      console.error('Error toggling webhook status:', e);
    }
  };

  const handleTestPing = async (url: string, secret?: string) => {
    setTestingWebhookUrl(url);
    try {
      const res = await sendTestWebhook(url, 'order.created', secret);
      setTestResult({
        url,
        success: res.success,
        status: res.status,
        body: res.body,
        durationMs: res.durationMs,
        error: res.error
      });
      // Refresh deliveries table
      fetchWebhooksAndLogs();
    } catch (e: any) {
      setTestResult({
        url,
        success: false,
        status: 0,
        body: '',
        durationMs: 0,
        error: e?.message || 'Test dispatch failed'
      });
    } finally {
      setTestingWebhookUrl(null);
    }
  };

  const handleManualDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTargetUrl && webhooks.length === 0) {
      alert('Please add a webhook URL or select a registered endpoint.');
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(dispatchCustomJson);
    } catch (err) {
      alert('Invalid JSON payload. Please verify JSON format.');
      return;
    }

    setIsDispatchingManual(true);
    setManualDispatchResult(null);

    try {
      if (dispatchTargetUrl) {
        const res = await sendTestWebhook(dispatchTargetUrl, dispatchEventName, undefined, parsedData);
        setManualDispatchResult(res);
      } else {
        await dispatchWebhookEvent(dispatchEventName, parsedData);
        setManualDispatchResult({ success: true, status: 200, body: 'Broadcasted to all active endpoints' });
      }
      fetchWebhooksAndLogs();
      showNotice('Manual webhook payload dispatched successfully!');
    } catch (e: any) {
      setManualDispatchResult({ success: false, status: 0, error: e?.message || 'Dispatch error' });
    } finally {
      setIsDispatchingManual(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Metrics
  const activeCount = webhooks.filter(w => w.is_active).length;
  const successfulDeliveries = deliveries.filter(d => d.status === 'success' || (d.response_status && d.response_status >= 200 && d.response_status < 300)).length;
  const successRate = deliveries.length > 0 ? Math.round((successfulDeliveries / deliveries.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#151c1b] border border-[#232f2e] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fed65b]/20 to-[#fed65b]/5 border border-[#fed65b]/30 flex items-center justify-center text-[#fed65b] shadow-inner">
            <Webhook className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white tracking-wide">Outgoing Webhooks Gateway</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#fed65b]/10 text-[#fed65b] border border-[#fed65b]/30">
                REAL-TIME RELAY
              </span>
            </div>
            <p className="text-sm text-[#a19f99] mt-0.5">
              Send live JSON payloads to external URLs, Zapier, Make.com, ERPs, or custom webhook endpoints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchWebhooksAndLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b2524] hover:bg-[#232f2e] text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all border border-[#2f3e3d] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Webhook URL</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Configured Endpoints</span>
            <Globe className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-2">{webhooks.length}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Active Endpoints</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-2">{activeCount}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-blue-400 text-xs font-label-caps uppercase tracking-wider">
            <span>Total Deliveries Sent</span>
            <Send className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-display text-blue-400 mt-2">{deliveries.length}</p>
        </div>

        <div className="bg-[#151c1b] border border-[#232f2e] p-4 rounded-xl">
          <div className="flex items-center justify-between text-[#fed65b] text-xs font-label-caps uppercase tracking-wider">
            <span>Delivery Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#fed65b] mt-2">{successRate}%</p>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex border-b border-[#232f2e] gap-6 text-xs font-label-caps uppercase tracking-wider font-bold">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'endpoints'
              ? 'text-[#fed65b] border-b-2 border-[#fed65b]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Webhook Endpoints ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'deliveries'
              ? 'text-[#fed65b] border-b-2 border-[#fed65b]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Delivery History & Logs ({deliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatcher')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'dispatcher'
              ? 'text-[#fed65b] border-b-2 border-[#fed65b]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Manual Dispatcher & Payload Tester</span>
        </button>
      </div>

      {/* TAB 1: CONFIGURED WEBHOOK ENDPOINTS */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-gray-400 bg-[#151c1b] border border-[#232f2e] rounded-2xl flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#fed65b]" />
              <p className="text-sm">Loading webhook endpoints from database...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-[#fed65b]/10 text-[#fed65b] flex items-center justify-center mx-auto border border-[#fed65b]/20">
                <Webhook className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">No Webhooks Registered Yet</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Add your webhook target URL (Zapier, Make.com, ERP, Discord, or your own server) to start streaming live order and customer events.
                </p>
              </div>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fed65b] text-[#1b1c1c] text-xs font-label-caps uppercase font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#ffe28a] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Webhook URL</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {webhooks.map((wh) => (
                <div 
                  key={wh.id}
                  className={`bg-[#151c1b] border rounded-2xl p-5 transition-all shadow-lg ${
                    wh.is_active ? 'border-[#232f2e] hover:border-[#fed65b]/40' : 'border-[#232f2e]/50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                          {wh.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          wh.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        }`}>
                          {wh.is_active ? '● Active' : '○ Paused'}
                        </span>
                      </div>

                      {/* URL Card with Quick Copy */}
                      <div className="flex items-center gap-2 bg-[#0d1312] border border-[#232f2e] px-3 py-1.5 rounded-xl font-mono text-xs text-gray-300 w-full sm:w-fit max-w-full">
                        <Globe className="w-3.5 h-3.5 text-[#fed65b] shrink-0" />
                        <span className="truncate">{wh.url}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(wh.url);
                            showNotice('Webhook URL copied to clipboard!');
                          }}
                          className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0 ml-1"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subscribed Events Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-gray-500 font-label-caps uppercase font-bold mr-1">
                          Triggers:
                        </span>
                        {Array.isArray(wh.events) && wh.events.map((ev) => (
                          <span 
                            key={ev}
                            className="bg-[#1b2524] text-gray-300 border border-[#2f3e3d] text-[11px] px-2 py-0.5 rounded-md font-mono"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestPing(wh.url, wh.secret_key)}
                        disabled={testingWebhookUrl === wh.url}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#fed65b]/10 hover:bg-[#fed65b] text-[#fed65b] hover:text-[#1b1c1c] text-xs font-label-caps uppercase font-bold rounded-xl transition-all border border-[#fed65b]/30 cursor-pointer disabled:opacity-50"
                        title="Send immediate test payload to verify this URL"
                      >
                        <Play className={`w-3.5 h-3.5 ${testingWebhookUrl === wh.url ? 'animate-spin' : ''}`} />
                        <span>{testingWebhookUrl === wh.url ? 'Pinging...' : '⚡ Test Ping'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleActive(wh)}
                        className={`px-3 py-2 text-xs font-label-caps uppercase font-bold rounded-xl transition-all border cursor-pointer ${
                          wh.is_active 
                            ? 'bg-[#1b2524] hover:bg-[#232f2e] text-gray-300 border-[#2f3e3d]'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {wh.is_active ? 'Pause' : 'Activate'}
                      </button>

                      <button
                        onClick={() => openEditModal(wh)}
                        className="p-2 bg-[#1b2524] hover:bg-[#232f2e] text-gray-300 hover:text-white rounded-xl border border-[#2f3e3d] transition-colors cursor-pointer"
                        title="Edit Webhook"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteWebhook(wh.id!)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-colors cursor-pointer"
                        title="Delete Webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELIVERY HISTORY & LOGS */}
      {activeTab === 'deliveries' && (
        <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl overflow-hidden shadow-xl">
          {deliveries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No Webhook Deliveries Recorded Yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Deliveries are recorded when events are triggered or when test pings are sent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#232f2e] bg-[#0d1312]/60 text-[11px] font-label-caps uppercase tracking-wider text-gray-400">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Event Trigger</th>
                    <th className="p-4">Target URL</th>
                    <th className="p-4">Status / HTTP</th>
                    <th className="p-4">Latency</th>
                    <th className="p-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232f2e]/60">
                  {deliveries.map((del) => {
                    const isSuccess = del.status === 'success' || (del.response_status && del.response_status >= 200 && del.response_status < 300);

                    return (
                      <tr key={del.id} className="hover:bg-[#1b2524]/60 transition-colors">
                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                          {del.created_at ? new Date(del.created_at).toLocaleString() : 'Recent'}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-[#fed65b] bg-[#fed65b]/10 px-2 py-0.5 rounded border border-[#fed65b]/20">
                            {del.event_name}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-300 font-mono max-w-xs truncate" title={del.target_url}>
                          {del.target_url}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                            isSuccess 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            {isSuccess ? `✓ ${del.response_status || 200} OK` : `✕ ${del.response_status || 'ERR'} Failed`}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400 font-mono">
                          {del.duration_ms ? `${del.duration_ms} ms` : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedDelivery(del)}
                            className="px-3 py-1 bg-[#1b2524] hover:bg-[#232f2e] text-gray-200 text-xs font-label-caps uppercase font-bold rounded-lg border border-[#2f3e3d] transition-colors cursor-pointer"
                          >
                            Inspect Payload
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL DISPATCHER & PAYLOAD TESTER */}
      {activeTab === 'dispatcher' && (
        <div className="bg-[#151c1b] border border-[#232f2e] p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-[#232f2e] pb-4">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#fed65b]" />
              Manual Webhook Payload Dispatcher
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Dispatch custom JSON payloads to any target webhook URL or broadcast directly to all active registered endpoints.
            </p>
          </div>

          <form onSubmit={handleManualDispatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                  Select Registered Webhook (or type custom URL below)
                </label>
                <select
                  value={dispatchTargetUrl}
                  onChange={(e) => setDispatchTargetUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                >
                  <option value="">🚀 Broadcast to ALL Active Registered Webhooks</option>
                  {webhooks.map((w) => (
                    <option key={w.id} value={w.url}>
                      {w.name} ({w.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                  Event Trigger Name
                </label>
                <select
                  value={dispatchEventName}
                  onChange={(e) => setDispatchEventName(e.target.value)}
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                >
                  {AVAILABLE_WEBHOOK_EVENTS.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label} ({ev.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                Target Webhook URL (Override)
              </label>
              <input
                type="url"
                value={dispatchTargetUrl}
                onChange={(e) => setDispatchTargetUrl(e.target.value)}
                placeholder="Leave blank to broadcast to all active endpoints, or enter https://..."
                className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                JSON Data Payload
              </label>
              <textarea
                rows={8}
                value={dispatchCustomJson}
                onChange={(e) => setDispatchCustomJson(e.target.value)}
                className="w-full p-3 bg-[#0d1312] border border-[#232f2e] rounded-xl text-emerald-400 font-mono text-xs focus:outline-none focus:border-[#fed65b] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isDispatchingManual}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatchingManual ? 'Dispatching Webhook...' : 'Dispatch Live Webhook Payload'}</span>
              </button>
            </div>
          </form>

          {/* Manual Dispatch Response Output */}
          {manualDispatchResult && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              manualDispatchResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold font-label-caps">
                <span>Dispatch Result Status: {manualDispatchResult.status || 'Done'}</span>
                {manualDispatchResult.durationMs && <span>{manualDispatchResult.durationMs} ms</span>}
              </div>
              <pre className="text-xs font-mono bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {manualDispatchResult.body || manualDispatchResult.error || 'Webhook dispatched successfully.'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#232f2e] flex items-center justify-between bg-[#0d1312]/80">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#fed65b]" />
                {editingWebhook ? 'Edit Webhook Endpoint' : 'Register New Webhook URL'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1b2524] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="p-6 space-y-5 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                  Webhook Friendly Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Zapier WhatsApp Order Bot, Make.com CRM Relay"
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                  Target Webhook Endpoint URL (POST) *
                </label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/... or https://your-server.com/api/webhook"
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1.5">
                  Secret Signing Key / Token (Optional)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={formSecret}
                    onChange={(e) => setFormSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Sent in the <code className="text-gray-300">X-Irisjev-Signature</code> HTTP header for payload authentication.
                </p>
              </div>

              {/* Event Triggers Checklist */}
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-2">
                  Subscribe to Event Triggers *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] max-h-48 overflow-y-auto">
                  {AVAILABLE_WEBHOOK_EVENTS.map((ev) => {
                    const isChecked = formEvents.includes(ev.id);

                    return (
                      <label 
                        key={ev.id} 
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#1b2524] text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormEvents([...formEvents, ev.id]);
                            } else {
                              setFormEvents(formEvents.filter(x => x !== ev.id));
                            }
                          }}
                          className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight">{ev.label}</p>
                          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{ev.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Switch */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-200">
                  Enable active webhook broadcasting for this endpoint
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232f2e]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-transparent hover:bg-[#1b2524] text-gray-300 text-xs font-label-caps uppercase font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingWebhook ? 'Update Webhook' : 'Register Webhook URL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Result Inspector Modal */}
      {testResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#232f2e] flex items-center justify-between bg-[#0d1312]">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>Test Ping Results</span>
              </h3>
              <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Endpoint: {testResult.url}</span>
                <span className={`font-bold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  HTTP {testResult.status || 'ERR'} ({testResult.durationMs} ms)
                </span>
              </div>
              <pre className="p-3 bg-[#0d1312] border border-[#232f2e] rounded-xl text-xs font-mono text-gray-200 overflow-x-auto max-h-60 whitespace-pre-wrap">
                {testResult.body || testResult.error || 'Payload delivered successfully.'}
              </pre>
              <div className="text-right pt-2">
                <button
                  onClick={() => setTestResult(null)}
                  className="px-4 py-2 bg-[#fed65b] text-[#1b1c1c] text-xs font-bold font-label-caps uppercase rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Delivery Log Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#232f2e] flex items-center justify-between bg-[#0d1312]">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#fed65b]" />
                <span>Delivery Audit Log ({selectedDelivery.event_name})</span>
              </h3>
              <button onClick={() => setSelectedDelivery(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0d1312] p-3 rounded-xl border border-[#232f2e]">
                <div>
                  <span className="text-gray-500 block">Target URL:</span>
                  <span className="text-gray-200 truncate block">{selectedDelivery.target_url}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Response Code:</span>
                  <span className="text-emerald-400 font-bold block">HTTP {selectedDelivery.response_status || 200}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-label-caps uppercase text-gray-400 font-bold block mb-1">
                  Sent JSON Payload:
                </span>
                <pre className="p-3 bg-[#0d1312] border border-[#232f2e] rounded-xl text-xs font-mono text-[#fed65b] overflow-x-auto max-h-56">
                  {JSON.stringify(selectedDelivery.payload, null, 2)}
                </pre>
              </div>

              {selectedDelivery.response_body && (
                <div>
                  <span className="text-xs font-label-caps uppercase text-gray-400 font-bold block mb-1">
                    Server Response Body:
                  </span>
                  <pre className="p-3 bg-[#0d1312] border border-[#232f2e] rounded-xl text-xs font-mono text-gray-300 overflow-x-auto max-h-36">
                    {selectedDelivery.response_body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
