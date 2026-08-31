import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  EmailLog, 
  EmailSettings, 
  getEmailSettings, 
  sendTestEmail, 
  sendResendEmail,
  DEFAULT_RESEND_KEY, 
  DEFAULT_ADMIN_EMAIL, 
  DEFAULT_FROM_EMAIL, 
  DEFAULT_FROM_NAME,
  EMAIL_EVENT_LIST,
  getSampleEmailTemplateHtml 
} from '../../utils/resendEmailEngine';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Check, 
  Eye, 
  X, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ShoppingBag, 
  BellRing, 
  Truck, 
  Gift, 
  HelpCircle, 
  MessageSquare, 
  Smartphone, 
  Monitor, 
  ChevronRight,
  Filter,
  Clock
} from 'lucide-react';

export function EmailNotificationsManager() {
  const [settings, setSettings] = useState<EmailSettings>({
    resend_api_key: DEFAULT_RESEND_KEY,
    from_email: DEFAULT_FROM_EMAIL,
    from_name: DEFAULT_FROM_NAME,
    admin_email: DEFAULT_ADMIN_EMAIL,
    order_notifications_enabled: true,
    shipping_notifications_enabled: true,
    ticket_notifications_enabled: true,
    inquiry_notifications_enabled: true,
    welcome_discount_enabled: true,
  });

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Tab State: 'templates' | 'logs' | 'settings'
  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'settings'>('templates');

  // Selected Event Template State for Tab 1
  const [selectedEventId, setSelectedEventId] = useState<string>('admin_order_alert');

  // Viewport Mode for Live Preview Stage: 'desktop' | 'mobile'
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  // Direct Stage Test Send State
  const [isSendingStageTest, setIsSendingStageTest] = useState(false);

  // Direct Form Test Email State
  const [testRecipient, setTestRecipient] = useState(DEFAULT_ADMIN_EMAIL);
  const [testSubject, setTestSubject] = useState('Resend Notification Verification - Irisjev Wooden Crafts');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchSettingsAndLogs = async () => {
    setLoading(true);
    try {
      const currentSettings = await getEmailSettings();
      setSettings(currentSettings);
      setTestRecipient(currentSettings.admin_email || DEFAULT_ADMIN_EMAIL);

      const { data: logsData, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        setLogs(logsData);
      }
      if (error) {
        console.error('Error fetching email logs:', error);
      }
    } catch (e) {
      console.error('Exception fetching email data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('email_settings')
        .upsert([{
          id: 1,
          resend_api_key: settings.resend_api_key.trim(),
          from_email: settings.from_email.trim(),
          from_name: settings.from_name.trim(),
          admin_email: settings.admin_email.trim(),
          order_notifications_enabled: settings.order_notifications_enabled,
          shipping_notifications_enabled: settings.shipping_notifications_enabled,
          ticket_notifications_enabled: settings.ticket_notifications_enabled,
          inquiry_notifications_enabled: settings.inquiry_notifications_enabled,
          welcome_discount_enabled: settings.welcome_discount_enabled,
          updated_at: new Date().toISOString(),
        }]);

      if (error) throw error;
      showNotice('Email configuration updated and synced to backend database!');
    } catch (err: any) {
      console.error('Error updating settings:', err);
      alert('Failed to save settings: ' + (err?.message || 'Database error'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail(testRecipient.trim(), testSubject.trim());
      setTestResult(res);
      if (res.success) {
        showNotice(`Test email dispatched successfully! Resend ID: ${res.id}`);
        fetchSettingsAndLogs();
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e?.message || 'Failed to dispatch test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendStageTest = async () => {
    const currentEvt = EMAIL_EVENT_LIST.find(e => e.id === selectedEventId);
    const sample = getSampleEmailTemplateHtml(selectedEventId);
    const targetEmail = settings.admin_email || DEFAULT_ADMIN_EMAIL;

    setIsSendingStageTest(true);
    try {
      const res = await sendResendEmail({
        to: targetEmail,
        subject: `[LIVE TEST] ${sample.subject}`,
        html: sample.html,
        emailType: selectedEventId,
        metadata: { is_stage_test: true, template_id: selectedEventId }
      });

      if (res.success) {
        showNotice(`Live sample for "${currentEvt?.title}" dispatched to ${targetEmail}! ID: ${res.id}`);
        fetchSettingsAndLogs();
      } else {
        alert(`Failed to send test: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error sending test: ${err?.message}`);
    } finally {
      setIsSendingStageTest(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Metrics
  const totalSent = logs.filter(l => l.status === 'sent').length;
  const deliverySuccessRate = logs.length > 0 ? Math.round((totalSent / logs.length) * 100) : 100;

  // Selected Template Info
  const selectedTemplateMeta = EMAIL_EVENT_LIST.find(e => e.id === selectedEventId) || EMAIL_EVENT_LIST[0];
  const selectedTemplatePreview = getSampleEmailTemplateHtml(selectedEventId);

  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4 text-[#fed65b]" />;
      case 'BellRing': return <BellRing className="w-4 h-4 text-emerald-400" />;
      case 'Truck': return <Truck className="w-4 h-4 text-blue-400" />;
      case 'Gift': return <Gift className="w-4 h-4 text-[#fed65b]" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4 text-purple-400" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'Mail': return <Mail className="w-4 h-4 text-teal-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default: return <Mail className="w-4 h-4 text-[#fed65b]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Hub Navigation Bar */}
      <div className="bg-[#151c1b] border border-[#232f2e] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#fed65b]/20 to-[#fed65b]/5 border border-[#fed65b]/30 flex items-center justify-center text-[#fed65b] shadow-inner shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white tracking-wide">Email Notifications & Resend Hub</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Interactive templates preview, delivery audit trails, and sender configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Sender Pill */}
          <div className="px-3 py-1.5 bg-[#0d1312] border border-[#232f2e] rounded-xl flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-400">Sender:</span>
            <span className="text-[#fed65b] font-bold">{settings.from_email || DEFAULT_FROM_EMAIL}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchSettingsAndLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1b2524] hover:bg-[#232f2e] text-gray-200 hover:text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all border border-[#2f3e3d] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
            <span>Refresh</span>
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

      {/* Main Tab Navigation Header */}
      <div className="flex items-center gap-2 border-b border-[#232f2e] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-[#fed65b] text-[#111615] shadow-lg font-extrabold'
              : 'bg-[#151c1b] text-gray-400 hover:text-white border border-[#232f2e] hover:bg-[#1c2624]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Template Gallery & Preview</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'templates' ? 'bg-[#111615] text-[#fed65b]' : 'bg-[#232f2e] text-gray-300'
          }`}>
            {EMAIL_EVENT_LIST.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#fed65b] text-[#111615] shadow-lg font-extrabold'
              : 'bg-[#151c1b] text-gray-400 hover:text-white border border-[#232f2e] hover:bg-[#1c2624]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Delivery Audit Logs</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'logs' ? 'bg-[#111615] text-[#fed65b]' : 'bg-[#232f2e] text-gray-300'
          }`}>
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-label-caps uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#fed65b] text-[#111615] shadow-lg font-extrabold'
              : 'bg-[#151c1b] text-gray-400 hover:text-white border border-[#232f2e] hover:bg-[#1c2624]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings & Direct Dispatch</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATE GALLERY & PREVIEW (SPLIT-SCREEN HUB) */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          
          {/* LEFT PANEL: Trigger Event Templates Scrollable List (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-label-caps uppercase tracking-wider text-gray-400 font-bold">
                Trigger Event Templates
              </span>
              <span className="text-[11px] font-mono text-gray-500">
                Select to view live render
              </span>
            </div>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {EMAIL_EVENT_LIST.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-[#1c2624] border-[#fed65b] shadow-xl shadow-[#fed65b]/5 ring-1 ring-[#fed65b]'
                        : 'bg-[#151c1b] border-[#232f2e] hover:border-[#fed65b]/50 hover:bg-[#18211f]'
                    }`}
                  >
                    {/* Active Accent Indicator Strip */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#fed65b]"></div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                          isSelected 
                            ? 'bg-[#fed65b]/20 border-[#fed65b]/40 text-[#fed65b]' 
                            : 'bg-[#0d1312] border-[#232f2e] text-gray-400 group-hover:text-white'
                        }`}>
                          {getEventIcon(evt.icon)}
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold transition-colors ${
                            isSelected ? 'text-[#fed65b]' : 'text-white group-hover:text-[#fed65b]'
                          }`}>
                            {evt.title}
                          </h3>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0d1312] text-gray-400 border border-[#232f2e]">
                            {evt.category}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-300 bg-[#0d1312] border border-[#232f2e] shrink-0">
                        {evt.recipient}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-[#232f2e] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span className="truncate pr-2">{evt.trigger}</span>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-[#fed65b] translate-x-1' : 'text-gray-600 group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Live Email Preview Stage (7 Cols) */}
          <div className="lg:col-span-7 bg-[#151c1b] border border-[#232f2e] rounded-2xl p-5 shadow-2xl space-y-4">
            
            {/* Stage Header Controls Bar */}
            <div className="border-b border-[#232f2e] pb-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-display">
                      {selectedTemplateMeta.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {selectedTemplateMeta.recipient}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Target Recipient: <strong className="text-gray-200 font-mono">{settings.admin_email || DEFAULT_ADMIN_EMAIL}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Viewport Toggle Switch */}
                  <div className="bg-[#0d1312] border border-[#232f2e] p-1 rounded-xl flex items-center gap-1">
                    <button
                      onClick={() => setViewportMode('desktop')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewportMode === 'desktop'
                          ? 'bg-[#1b2524] text-[#fed65b] border border-[#2f3e3d]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => setViewportMode('mobile')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewportMode === 'mobile'
                          ? 'bg-[#1b2524] text-[#fed65b] border border-[#2f3e3d]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>

                  {/* Test Send Button */}
                  <button
                    onClick={handleSendStageTest}
                    disabled={isSendingStageTest}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#fed65b] hover:bg-[#ffe28a] text-[#111615] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingStageTest ? 'animate-bounce' : ''}`} />
                    <span>{isSendingStageTest ? 'Sending...' : '⚡ Test Send'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Line Bar */}
              <div className="bg-[#0d1312] border border-[#232f2e] px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-mono">
                <Mail className="w-4 h-4 text-[#fed65b] shrink-0" />
                <span className="text-gray-400 font-bold shrink-0">Subject:</span>
                <span className="text-gray-200 truncate">{selectedTemplatePreview.subject}</span>
              </div>
            </div>

            {/* Stage Frame Container */}
            <div className="bg-[#0b0f0e] border border-[#232e2c] rounded-2xl p-4 flex justify-center items-center min-h-[580px]">
              <div 
                className={`transition-all duration-300 h-[560px] rounded-xl overflow-hidden shadow-2xl border border-[#232f2e] bg-[#0f1413] ${
                  viewportMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[640px]'
                }`}
              >
                <iframe
                  title="Live Email Preview Stage"
                  srcDoc={selectedTemplatePreview.html}
                  className="w-full h-full border-0 bg-[#0f1413]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#151c1b] border border-[#232f2e] p-6 rounded-2xl shadow-xl space-y-6 animate-in fade-in duration-200">
          
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0d1312] border border-[#232f2e] p-4 rounded-xl">
              <span className="text-gray-400 text-xs font-label-caps uppercase tracking-wider block">Total Dispatches</span>
              <p className="text-2xl font-bold font-display text-white mt-1.5">{logs.length}</p>
            </div>

            <div className="bg-[#0d1312] border border-[#232f2e] p-4 rounded-xl">
              <span className="text-emerald-400 text-xs font-label-caps uppercase tracking-wider block">Successfully Delivered</span>
              <p className="text-2xl font-bold font-display text-emerald-400 mt-1.5">{totalSent}</p>
            </div>

            <div className="bg-[#0d1312] border border-[#232f2e] p-4 rounded-xl">
              <span className="text-[#fed65b] text-xs font-label-caps uppercase tracking-wider block">Delivery Success Rate</span>
              <p className="text-2xl font-bold font-display text-[#fed65b] mt-1.5">{deliverySuccessRate}%</p>
            </div>

            <div className="bg-[#0d1312] border border-[#232f2e] p-4 rounded-xl">
              <span className="text-blue-400 text-xs font-label-caps uppercase tracking-wider block">Admin Alert Inbox</span>
              <p className="text-xs font-mono text-gray-200 mt-2 truncate" title={settings.admin_email}>
                {settings.admin_email}
              </p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="border-t border-[#232f2e] pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#fed65b]" />
                Recent Resend Email Audit Trail Logs
              </h3>
              <span className="text-xs text-gray-400 font-mono">Last 50 Entries</span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-12 bg-[#0d1312] rounded-2xl border border-[#232f2e] space-y-3">
                <Mail className="w-10 h-10 text-gray-500 mx-auto opacity-50" />
                <p className="text-sm font-semibold text-gray-300">No Email Audit Logs Recorded Yet</p>
                <p className="text-xs text-gray-500">
                  Transactional emails sent for Orders, Shipments, and Support Tickets will log here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#232f2e]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0d1312] text-gray-400 font-label-caps uppercase text-[10px] tracking-wider border-b border-[#232f2e]">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">Subject Line</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2524] bg-[#151c1b]">
                    {logs.map((log) => {
                      const isSuccess = log.status === 'sent';
                      const formattedDate = log.created_at 
                        ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Just now';

                      return (
                        <tr key={log.id || Math.random()} className="hover:bg-[#18211f] transition-colors">
                          <td className="p-4 font-mono text-gray-400 whitespace-nowrap">{formattedDate}</td>
                          <td className="p-4 font-mono font-medium text-white truncate max-w-[160px]">{log.to_email}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-[#0d1312] border border-[#232f2e] text-[#fed65b]">
                              {log.email_type}
                            </span>
                          </td>
                          <td className="p-4 truncate max-w-[260px] text-gray-300">{log.subject}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isSuccess 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {isSuccess ? '✓ Sent' : '✕ Failed'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-3 py-1 bg-[#1b2524] hover:bg-[#232f2e] text-gray-200 text-xs font-label-caps uppercase font-bold rounded-lg border border-[#2f3e3d] transition-colors cursor-pointer"
                            >
                              View Info
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
        </div>
      )}

      {/* TAB 3: SETTINGS & DIRECT DISPATCH */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
          
          {/* Left Column: Direct Test Email Form */}
          <div className="bg-[#151c1b] border border-[#232f2e] p-5 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-[#232f2e] pb-3">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Send className="w-4 h-4 text-[#fed65b]" />
                Instant Resend Test Dispatcher
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Send a live test email directly using your configured Resend API key.
              </p>
            </div>

            <form onSubmit={handleSendTest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="suganyyvi77@gmail.com"
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Note: Verified domain active (send@irisjev.in). Emails will deliver directly to recipient addresses.
                </p>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Sending via Resend...' : '⚡ Send Test Email Now'}</span>
              </button>
            </form>

            {/* Test Result Box */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.success ? 'Delivered via Resend!' : 'Delivery Notice'}</span>
                </div>
                {testResult.id && <p className="font-mono text-[11px]">Resend Message ID: {testResult.id}</p>}
                {testResult.error && <p className="mt-1">{testResult.error}</p>}
              </div>
            )}
          </div>

          {/* Right 2 Columns: Resend Credentials & Triggers Config */}
          <div className="lg:col-span-2 bg-[#151c1b] border border-[#232f2e] p-5 rounded-2xl shadow-xl space-y-4">
            <div className="border-b border-[#232f2e] pb-3">
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#fed65b]" />
                Resend Credentials & Event Triggers
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage your API credentials, sender domain, and active transaction triggers.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                    Resend API Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={settings.resend_api_key}
                    onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                    placeholder="re_..."
                    className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                    Admin Notification Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.admin_email}
                    onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    placeholder="suganyyvi77@gmail.com"
                    className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                    From Sender Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.from_name}
                    onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                    placeholder="Irisjev Wooden Crafts"
                    className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs focus:outline-none focus:border-[#fed65b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-1">
                    From Email Address
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.from_email}
                    onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                    placeholder="send@irisjev.in"
                    className="w-full p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#fed65b]"
                  />
                </div>
              </div>

              {/* Automated Notification Triggers */}
              <div className="pt-2 border-t border-[#232f2e]">
                <span className="block text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold mb-2">
                  Automated Transactional Email Triggers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-start gap-2.5 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] cursor-pointer hover:border-[#fed65b]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.order_notifications_enabled}
                      onChange={(e) => setSettings({ ...settings, order_notifications_enabled: e.target.checked })}
                      className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Order Confirmations</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Send invoices to customer & admin</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] cursor-pointer hover:border-[#fed65b]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.shipping_notifications_enabled}
                      onChange={(e) => setSettings({ ...settings, shipping_notifications_enabled: e.target.checked })}
                      className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Shipping AWBs</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Send courier tracking details</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] cursor-pointer hover:border-[#fed65b]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.ticket_notifications_enabled}
                      onChange={(e) => setSettings({ ...settings, ticket_notifications_enabled: e.target.checked })}
                      className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Support Tickets</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Send updates on concierge replies</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] cursor-pointer hover:border-[#fed65b]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.inquiry_notifications_enabled}
                      onChange={(e) => setSettings({ ...settings, inquiry_notifications_enabled: e.target.checked })}
                      className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Contact & Inquiries Alert</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Send alerts on custom commissions</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] cursor-pointer hover:border-[#fed65b]/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.welcome_discount_enabled}
                      onChange={(e) => setSettings({ ...settings, welcome_discount_enabled: e.target.checked })}
                      className="mt-0.5 rounded text-[#fed65b] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Welcome 10% Discount</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Send 10% voucher code on signup</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-[#fed65b] hover:bg-[#ffe28a] text-[#1b1c1c] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151c1b] border border-[#232f2e] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[#232f2e] flex items-center justify-between bg-[#0d1312]">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#fed65b]" />
                <span>Email Delivery Audit Details</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#0d1312] p-3 rounded-xl border border-[#232f2e] font-mono">
                <div>
                  <span className="text-gray-500 block">Recipient:</span>
                  <span className="text-gray-200 truncate block">{selectedLog.to_email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Sender:</span>
                  <span className="text-gray-200 truncate block">{selectedLog.from_email || DEFAULT_FROM_EMAIL}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Type:</span>
                  <span className="text-[#fed65b] block">{selectedLog.email_type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Resend Message ID:</span>
                  <span className="text-emerald-400 truncate block">{selectedLog.resend_id || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-bold font-label-caps block mb-1">Subject:</span>
                <p className="p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-gray-200">{selectedLog.subject}</p>
              </div>

              {selectedLog.error_message && (
                <div>
                  <span className="text-red-400 font-bold font-label-caps block mb-1">Error Message:</span>
                  <pre className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 font-mono whitespace-pre-wrap">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-gray-400 font-bold font-label-caps block mb-1">Metadata:</span>
                  <pre className="p-2.5 bg-[#0d1312] border border-[#232f2e] rounded-xl text-gray-300 font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
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
