import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import {
  WHATSAPP_CONFIG,
  sendWhatsAppTextMessage,
  sendWhatsAppTemplateMessage,
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
  testWhatsAppConnection,
  cleanPhoneNumber,
  sendWhatsAppApiPayload
} from '../../utils/whatsappCloudApiEngine';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Key,
  Building,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Bot,
  Bell,
  Clock,
  Settings,
  Eye,
  EyeOff,
  Database,
  Terminal,
  Sparkles,
  Layers,
  Sliders,
  Zap,
  PhoneCall,
  FileText,
  CheckCheck,
  CheckCircle
} from 'lucide-react';

const SQL_SETUP_QUERY = `-- SQL Migration Script for Meta WhatsApp Cloud API Integration
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT,
  message_type TEXT,
  status TEXT,
  message_id TEXT,
  error_details TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to whatsapp_logs" ON whatsapp_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on whatsapp_logs" ON whatsapp_logs
  FOR SELECT USING (true);`;

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  description: string;
  language: string;
  parameterCount: number;
  bodyTemplate: string;
  defaultParams: Record<string, string>;
  paramLabels: { key: string; label: string; sub: string }[];
}

const APPROVED_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'order_confirmation_01',
    name: 'order_confirmation_01',
    category: 'UTILITY',
    description: 'Instant notification sent to customer upon successful order placement.',
    language: 'en',
    parameterCount: 3,
    bodyTemplate: `Hi {{1}}, 👋\n\nThank you for your purchase from *Swarna Wooden Crafts*\n\nYour order *{{2}}* is now being prepared with care. We'll keep you updated once it's ready for dispatch.\n\nFor any questions, simply reply to this WhatsApp message.\n\nView your order below 👇\n{{3}}`,
    defaultParams: {
      '{{1}}': 'Aaranya',
      '{{2}}': 'ORD-98241',
      '{{3}}': 'https://swarnawoodencrafts.com/track?order=ORD-98241',
    },
    paramLabels: [
      { key: '{{1}}', label: 'Param {{1}}: Customer Name', sub: 'First name or full name of customer' },
      { key: '{{2}}', label: 'Param {{2}}: Order Number', sub: 'Unique order identifier' },
      { key: '{{3}}', label: 'Param {{3}}: Order / Tracking URL', sub: 'Link to view order & tracking updates' },
    ],
  },
  {
    id: 'order_shipped',
    name: 'order_shipped',
    category: 'UTILITY',
    description: 'Sent when the order is dispatched with courier tracking details.',
    language: 'en',
    parameterCount: 3,
    bodyTemplate: `Hi {{1}}, 🚚\n\nGreat news! Your handcrafted wooden order *{{2}}* has been dispatched via *{{3}}*.\n\nTrack your live shipment delivery status & milestones here:\nhttps://swarnawoodencrafts.com/track?order={{2}}\n\nThank you for choosing Swarna Wooden Crafts.`,
    defaultParams: {
      '{{1}}': 'Nirmal Raj',
      '{{2}}': 'SWARNA-505175',
      '{{3}}': 'BlueDart Express (AWB-DEL-2153-IN)',
    },
    paramLabels: [
      { key: '{{1}}', label: 'Param {{1}}: Customer Name', sub: 'Name of the recipient' },
      { key: '{{2}}', label: 'Param {{2}}: Order / Tracking AWB', sub: 'Order number or courier tracking AWB' },
      { key: '{{3}}', label: 'Param {{3}}: Courier Details', sub: 'Courier company & consignment note' },
    ],
  },
  {
    id: 'bespoke_inquiry_received',
    name: 'bespoke_inquiry_received',
    category: 'UTILITY',
    description: 'Proactive notification confirming receipt of custom wood carving inquiry.',
    language: 'en',
    parameterCount: 2,
    bodyTemplate: `Namaste {{1}}, 🙏\n\nWe have received your custom woodcraft commission inquiry for *{{2}}*.\n\nOne of our 8th-generation Viswakarma master carvers will review your requirements and reach out with timber selection options & design estimates.\n\nSwarna Wooden Crafts Concierge`,
    defaultParams: {
      '{{1}}': 'Vikramaditya',
      '{{2}}': 'Teakwood Temple Door Panel with Ganesha Motif',
    },
    paramLabels: [
      { key: '{{1}}', label: 'Param {{1}}: Customer Name', sub: 'Patron or customer full name' },
      { key: '{{2}}', label: 'Param {{2}}: Custom Project Summary', sub: 'Brief description of custom commission' },
    ],
  },
  {
    id: 'abandoned_cart_reminder',
    name: 'abandoned_cart_reminder',
    category: 'MARKETING',
    description: 'Automated recovery message for customers who left items in cart.',
    language: 'en',
    parameterCount: 3,
    bodyTemplate: `Hello {{1}}, 🪵\n\nWe noticed you left *{{2}}* in your cart. Claim 10% OFF your first order with voucher code *SWARNA10*.\n\nComplete your heirloom order below 👇\n{{3}}`,
    defaultParams: {
      '{{1}}': 'Priyesh',
      '{{2}}': 'Hand-carved Sandalwood Deity Sculpture',
      '{{3}}': 'https://swarnawoodencrafts.com/checkout',
    },
    paramLabels: [
      { key: '{{1}}', label: 'Param {{1}}: Customer Name', sub: 'First name of patron' },
      { key: '{{2}}', label: 'Param {{2}}: Product Name', sub: 'Main item left in shopping cart' },
      { key: '{{3}}', label: 'Param {{3}}: Checkout Link', sub: 'Direct URL to resume checkout' },
    ],
  },
  {
    id: 'hello_world',
    name: 'hello_world',
    category: 'UTILITY',
    description: 'Meta standard sample message to test live Cloud API connectivity.',
    language: 'en',
    parameterCount: 0,
    bodyTemplate: `Welcome and congratulations! This message demonstrates your official Meta WhatsApp Cloud API integration with Swarna Wooden Crafts.`,
    defaultParams: {},
    paramLabels: [],
  },
];

export function WhatsAppSettingsManager() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'messenger' | 'logs' | 'automations'>('simulator');

  // Selected Template & Params State
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(APPROVED_TEMPLATES[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(APPROVED_TEMPLATES[0].defaultParams);
  const [recipientPhone, setRecipientPhone] = useState('9094251268');

  // Direct Messenger State
  const [directPhone, setDirectPhone] = useState('+91 9094251268');
  const [directMessageText, setDirectMessageText] = useState('Hello from Swarna Wooden Crafts! Your custom wood sculpture inquiry has been received.');

  // Dispatch State
  const [sending, setSending] = useState(false);
  const [resultNotice, setResultNotice] = useState<{ type: 'success' | 'error'; message: string; rawResponse?: any } | null>(null);

  // Credentials & Tokens
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Audit Logs
  const [logs, setLogs] = useState<any[]>([]);
  const [localLogs, setLocalLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  // Settings Toggles
  const [autoOrderConfirm, setAutoOrderConfirm] = useState(true);
  const [autoShippingUpdate, setAutoShippingUpdate] = useState(true);
  const [autoBespokeInquiry, setAutoBespokeInquiry] = useState(true);

  // Switch template & reset parameters
  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
    setParamValues({ ...tpl.defaultParams });
    setResultNotice(null);
  };

  const handleParamChange = (key: string, val: string) => {
    setParamValues((prev) => ({ ...prev, [key]: val }));
  };

  // Render live substituted WhatsApp message preview text
  const renderLivePreviewText = () => {
    let text = selectedTemplate.bodyTemplate;
    Object.keys(paramValues).forEach((key) => {
      const val = paramValues[key] || key;
      text = text.replaceAll(key, val);
    });
    return text;
  };

  // Render accurate status badge for message progression (SENT -> DELIVERED -> READ / FAILED)
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-[#05291b] text-[#34d399] border border-[#10b981]/40">
          <CheckCircle2 className="w-3 h-3 text-[#34d399]" />
          <span>DELIVERED</span>
        </span>
      );
    }
    if (s === 'read') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-emerald-900 text-emerald-100 border border-emerald-500/50">
          <CheckCheck className="w-3 h-3 text-emerald-300" />
          <span>READ</span>
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800/40">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span>FAILED</span>
        </span>
      );
    }
    if (s === 'received') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-800/40">
          <MessageSquare className="w-3 h-3 text-purple-300" />
          <span>INBOUND</span>
        </span>
      );
    }
    // Default initial API response (SENT / ACCEPTED)
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 bg-blue-950/80 text-blue-300 border border-blue-800/40">
        <Clock className="w-3 h-3 text-blue-300" />
        <span>SENT</span>
      </span>
    );
  };

  useEffect(() => {
    const isSetupDone = localStorage.getItem('irisjev_whatsapp_db_setup') === 'true';
    if (isSetupDone) {
      fetchLogs();
    } else {
      setTableMissing(true);
    }
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('404') || error.message?.includes('does not exist')) {
          setTableMissing(true);
          localStorage.removeItem('irisjev_whatsapp_db_setup');
        }
      } else if (data) {
        setLogs(data);
        setTableMissing(false);
        localStorage.setItem('irisjev_whatsapp_db_setup', 'true');
      }
    } catch (err) {
      setTableMissing(true);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Send Template or Text Payload to Meta API
  const handleSendLiveTest = async () => {
    if (!recipientPhone.trim()) return;

    setSending(true);
    setResultNotice(null);

    const targetPhoneClean = cleanPhoneNumber(recipientPhone);

    try {
      // Build parameters array for Meta template body component
      const bodyParams = selectedTemplate.paramLabels.map((p) => ({
        type: 'text',
        text: paramValues[p.key] || p.key,
      }));

      const components = bodyParams.length > 0 ? [
        {
          type: 'body',
          parameters: bodyParams,
        }
      ] : undefined;

      let res: any;

      // Send official Meta WhatsApp template payload (type: "template")
      res = await sendWhatsAppTemplateMessage({
        to: targetPhoneClean,
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.language || 'en',
        components,
      });

      let fallbackUsed = false;
      // Fallback for live business numbers if template is restricted (Error #131058 for hello_world) or uncreated (Error #132001)
      if (!res.success && (
        res.error?.includes('131058') ||
        res.error?.includes('132001') ||
        res.error?.toLowerCase().includes('public test numbers') ||
        res.error?.toLowerCase().includes('template name does not exist')
      )) {
        const renderedText = renderLivePreviewText();
        const textRes = await sendWhatsAppTextMessage({
          to: targetPhoneClean,
          body: renderedText,
        });

        if (textRes.success) {
          res = textRes;
          fallbackUsed = true;
        }
      }

      // Record local session log entry with initial status 'sent' (NOT delivered until webhook confirms)
      const newLocalEntry = {
        id: `local-${Date.now()}`,
        recipient_phone: targetPhoneClean,
        message_type: selectedTemplate.name,
        status: res.success ? 'sent' : 'failed',
        message_id: res.messageId || 'wa-msg-live',
        error_details: res.error,
        created_at: new Date().toISOString(),
      };
      setLocalLogs((prev) => [newLocalEntry, ...prev]);

      if (res.success) {
        setResultNotice({
          type: 'success',
          message: `✅ Message accepted by Meta (WAM-ID: ${res.messageId}). Delivery status will update when WhatsApp sends a webhook event.`,
          rawResponse: res.rawResponse,
        });
      } else {
        setResultNotice({
          type: 'error',
          message: `❌ Meta API Error: ${res.error || 'Request rejected by Meta'}`,
          rawResponse: res.rawResponse,
        });
      }
    } catch (err: any) {
      setResultNotice({
        type: 'error',
        message: `Error: ${err.message || 'Failed to dispatch Meta WhatsApp payload'}`,
      });
    } finally {
      setSending(false);
      fetchLogs();
    }
  };

  // Direct messenger dispatch
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim() || !directMessageText.trim()) return;

    setSending(true);
    setResultNotice(null);

    const targetPhoneClean = cleanPhoneNumber(directPhone);

    try {
      const res = await sendWhatsAppTextMessage({
        to: targetPhoneClean,
        body: directMessageText,
      });

      const newLocalEntry = {
        id: `local-${Date.now()}`,
        recipient_phone: targetPhoneClean,
        message_type: 'direct_text',
        status: res.success ? 'sent' : 'failed',
        message_id: res.messageId || 'wa-direct-msg',
        error_details: res.error,
        created_at: new Date().toISOString(),
      };
      setLocalLogs((prev) => [newLocalEntry, ...prev]);

      if (res.success) {
        setResultNotice({
          type: 'success',
          message: `✅ Direct message accepted by Meta (WAM-ID: ${res.messageId}). Delivery status will update when WhatsApp sends a webhook event.`,
          rawResponse: res.rawResponse,
        });
      } else {
        setResultNotice({
          type: 'error',
          message: `❌ Meta API Error: ${res.error || 'Failed to dispatch message'}`,
          rawResponse: res.rawResponse,
        });
      }
    } catch (err: any) {
      setResultNotice({
        type: 'error',
        message: `Error: ${err.message}`,
      });
    } finally {
      setSending(false);
      fetchLogs();
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const combinedLogs = [...localLogs, ...logs].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-16 bg-[#090d0b] text-[#e1e3e0] min-h-screen p-4 sm:p-6 rounded-3xl">

      {/* 1. TOP HEADER - WHATSAPP NOTIFICATION HUB (MATCHING USER SCREENSHOT EXACTLY) */}
      <div className="bg-[#0f1714] border border-[#1b2b24] p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              WhatsApp Notification Hub
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-[#05291b] text-[#34d399] border border-[#10b981]/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Active & Verified</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Automated customer notifications for order confirmation, live tracking dispatches, delay updates, and direct support messaging via verified WhatsApp Business Platform.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchLogs}
            className="px-4 py-2.5 bg-[#16211c] hover:bg-[#1e2e28] text-gray-200 border border-[#273d34] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Sync Status</span>
          </button>

          <a
            href="https://business.facebook.com/latest/settings/whatsapp_account/?business_id=1569497597992166&selected_asset_id=831276670043386"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Meta WhatsApp Manager</span>
          </a>
        </div>
      </div>

      {/* DATABASE SETUP BANNER IF TABLE NOT CREATED YET */}
      {tableMissing && (
        <div className="bg-[#1c1809] border border-[#d97706]/40 p-5 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#451a03] text-[#f59e0b] flex items-center justify-center shrink-0 border border-[#b45309]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#fef3c7]">Supabase DB Setup Required: <code className="bg-[#451a03] px-2 py-0.5 rounded text-xs font-mono text-[#fde68a]">whatsapp_logs</code> Table</h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  Run the SQL script to enable permanent audit logging in your Supabase database.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyToClipboard(SQL_SETUP_QUERY, 'sql')}
                className="bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project/kimkttzdxnkekcoeuvop/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#101714] text-amber-300 border border-[#b45309]/50 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('irisjev_whatsapp_db_setup', 'true');
                  fetchLogs();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Verify Table Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP STATS ROW - 4 DARK STAT CARDS (MATCHING USER SCREENSHOT EXACTLY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: BUSINESS PHONE */}
        <div className="bg-[#0f1714] p-5 rounded-2xl border border-[#1b2b24] shadow-md flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-gray-400 font-bold block">
              BUSINESS PHONE
            </span>
            <span className="font-mono text-lg font-bold text-white block">+91 8608449937</span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Verified Profile: Swarna Wooden Crafts</span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#05291b] border border-[#10b981]/30 text-[#34d399] flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: PHONE NUMBER ID */}
        <div className="bg-[#0f1714] p-5 rounded-2xl border border-[#1b2b24] shadow-md flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-gray-400 font-bold block">
              PHONE NUMBER ID
            </span>
            <span className="font-mono text-lg font-bold text-white block">1442648035597125</span>
            <span className="text-[11px] text-gray-400 block pt-1">
              Cloud API Endpoint Active
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#05291b] border border-[#10b981]/30 text-[#34d399] flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: WABA ACCOUNT ID */}
        <div className="bg-[#0f1714] p-5 rounded-2xl border border-[#1b2b24] shadow-md flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-gray-400 font-bold block">
              WABA ACCOUNT ID
            </span>
            <span className="font-mono text-lg font-bold text-white block">831276670043386</span>
            <span className="text-[11px] text-gray-400 block pt-1">
              Irisjev Wooden Crafts
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#05291b] border border-[#10b981]/30 text-[#34d399] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: HEALTH RATING */}
        <div className="bg-[#0f1714] p-5 rounded-2xl border border-[#1b2b24] shadow-md flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-gray-400 font-bold block">
              HEALTH RATING
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-mono text-lg font-extrabold text-white block">HIGH QUALITY</span>
              <span className="bg-[#05291b] text-[#34d399] border border-[#10b981]/40 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                GREEN
              </span>
            </div>
            <span className="text-[11px] text-gray-400 block pt-1">
              Standard Throughput Tier
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#05291b] border border-[#10b981]/30 text-[#34d399] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 3. TAB NAVIGATION BAR (MATCHING USER SCREENSHOT EXACTLY) */}
      <div className="border-b border-[#1b2b24] flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-label-caps uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`py-3 flex items-center gap-2 border-b-2 font-extrabold cursor-pointer transition-all ${activeTab === 'simulator'
              ? 'border-[#10b981] text-[#34d399]'
              : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>TEMPLATE STUDIO & LIVE SIMULATOR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messenger')}
          className={`py-3 flex items-center gap-2 border-b-2 font-extrabold cursor-pointer transition-all ${activeTab === 'messenger'
              ? 'border-[#10b981] text-[#34d399]'
              : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Send className="w-4 h-4" />
          <span>DIRECT MESSENGER</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`py-3 flex items-center gap-2 border-b-2 font-extrabold cursor-pointer transition-all ${activeTab === 'logs'
              ? 'border-[#10b981] text-[#34d399]'
              : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>MESSAGE AUDIT LOGS ({combinedLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('automations')}
          className={`py-3 flex items-center gap-2 border-b-2 font-extrabold cursor-pointer transition-all ${activeTab === 'automations'
              ? 'border-[#10b981] text-[#34d399]'
              : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <Settings className="w-4 h-4" />
          <span>AUTOMATIONS & SETTINGS</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: TEMPLATE STUDIO & LIVE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fadeIn">

          {/* LEFT COLUMN: APPROVED META TEMPLATES (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[11px] font-label-caps uppercase tracking-widest text-gray-400 font-bold block">
              APPROVED META TEMPLATES
            </span>

            <div className="space-y-3">
              {APPROVED_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${selectedTemplate.id === tpl.id
                      ? 'bg-[#14241d] border-[#10b981] shadow-lg ring-1 ring-[#10b981]'
                      : 'bg-[#0f1714] border-[#1b2b24] hover:border-gray-700'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">{tpl.name}</span>
                    <span className="bg-[#05291b] text-[#34d399] border border-[#10b981]/40 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                    <span>Lang: {tpl.language}</span>
                    <span>{tpl.parameterCount} Parameters</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: SPLIT LIVE WHATSAPP PREVIEW + PARAMETER INPUTS (8 COLS) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0f1714] p-6 rounded-3xl border border-[#1b2b24] shadow-xl">

            {/* MIDDLE: LIVE WHATSAPP PREVIEW SIMULATOR MOCKUP */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Smartphone className="w-4 h-4 text-[#34d399]" />
                <span>LIVE WHATSAPP PREVIEW</span>
                <span className="text-gray-500 font-normal">Template: <span className="text-[#34d399] font-mono">{selectedTemplate.name}</span></span>
              </div>

              {/* REALISTIC WHATSAPP PHONE FRAME */}
              <div className="bg-[#0b1410] rounded-3xl border border-[#1b2b24] overflow-hidden shadow-2xl flex flex-col h-[520px]">

                {/* Phone Header Bar */}
                <div className="bg-[#121d18] px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#059669] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    SW
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-white">Swarna Wooden Crafts</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                    </div>
                    <span className="text-[10px] text-gray-400 block">Official Business Account</span>
                  </div>
                  <span className="ml-auto text-[10px] text-gray-400">19:40</span>
                </div>

                {/* WhatsApp Chat Wall Wallpaper */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#080e0b] bg-opacity-90">
                  <div className="text-center">
                    <span className="bg-[#14201a] text-gray-400 text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                      Today
                    </span>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="bg-[#0e2a1f] border border-[#10b981]/30 text-emerald-50 p-4 rounded-2xl rounded-tl-xs text-xs space-y-2 shadow-md leading-relaxed whitespace-pre-wrap">
                    {renderLivePreviewText()}

                    <div className="flex justify-end items-center gap-1 pt-1 text-[9px] text-emerald-300/70">
                      <span>19:40</span>
                      <CheckCheck className="w-3 h-3 text-[#34d399]" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT SIDE: LIVE PARAMETER VALUES & TEST SENDER */}
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  LIVE PARAMETER VALUES
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Edit positional variables to dynamically test template output.
                </p>
              </div>

              {/* Dynamic Inputs for {{1}}, {{2}}, {{3}} */}
              <div className="space-y-4">
                {selectedTemplate.paramLabels.map((p) => (
                  <div key={p.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-gray-200">{p.label}</label>
                      <span className="text-[10px] text-gray-400">{p.sub}</span>
                    </div>
                    <input
                      type="text"
                      value={paramValues[p.key] || ''}
                      onChange={(e) => handleParamChange(p.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0b1410] border border-[#1b2b24] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#10b981] transition-colors"
                    />
                  </div>
                ))}

                {selectedTemplate.parameterCount === 0 && (
                  <p className="text-xs text-gray-400 italic">This template requires no positional parameters.</p>
                )}
              </div>

              {/* SEND TEST MESSAGE TO PHONE NUMBER */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                  SEND TEST MESSAGE TO PHONE NUMBER
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="9094251268"
                    className="flex-1 px-3.5 py-2.5 bg-[#0b1410] border border-[#1b2b24] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#10b981]"
                  />

                  <button
                    type="button"
                    onClick={handleSendLiveTest}
                    disabled={sending}
                    className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 text-xs uppercase tracking-wider shrink-0 disabled:opacity-50"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Live Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notice Output */}
              {resultNotice && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-fadeIn ${resultNotice.type === 'success'
                    ? 'bg-[#05291b] text-emerald-200 border-[#10b981]/40'
                    : 'bg-[#2a1012] text-red-200 border-red-500/40'
                  }`}>
                  <div className="flex items-start gap-2 font-bold">
                    {resultNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34d399] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{resultNotice.message}</span>
                  </div>

                  {resultNotice.type === 'error' && (resultNotice.message?.includes('132001') || resultNotice.rawResponse?.error?.code === 132001) && (
                    <div className="bg-[#241215] p-3 rounded-lg border border-red-500/30 text-[11px] text-red-200 leading-relaxed mt-2 space-y-2">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>🛠️ Quick Action Required in Meta WABA Dashboard:</span>
                      </div>
                      <p>
                        Template <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono">{selectedTemplate.name}</code> has not been created in Meta WhatsApp Account <code className="bg-black/50 px-1.5 py-0.5 rounded text-white font-mono">831276670043386</code>.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTemplate.bodyTemplate);
                            alert('Template body text copied!');
                          }}
                          className="px-3 py-1.5 bg-[#451217] hover:bg-[#5e1920] text-red-100 border border-red-400/40 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Body Text</span>
                        </button>

                        <a
                          href="https://business.facebook.com/latest/settings/whatsapp_account/?business_id=1569497597992166&selected_asset_id=831276670043386"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Meta Message Templates</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {resultNotice.rawResponse && (
                    <details className="text-[10px] font-mono bg-black/40 p-2 rounded-lg border border-gray-800">
                      <summary className="cursor-pointer text-gray-400 font-bold">View Meta Raw JSON Response</summary>
                      <pre className="mt-1 text-gray-300">{JSON.stringify(resultNotice.rawResponse, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* 5. TAB CONTENT 2: DIRECT MESSENGER (MATCHING SCREENSHOT 1 EXACTLY) */}
      {activeTab === 'messenger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fadeIn">
          {/* LEFT: DIRECT WHATSAPP MESSAGE DISPATCHER (8 COLS) */}
          <div className="lg:col-span-8 bg-[#0f1714] p-6 sm:p-8 rounded-3xl border border-[#1b2b24] shadow-xl space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h3 className="font-bold text-base uppercase tracking-wider text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#34d399]" />
                <span>DIRECT WHATSAPP MESSAGE DISPATCHER</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Dispatch personalized free-form support messages or urgent order clarifications to customers.
              </p>
            </div>

            <form onSubmit={handleSendDirectMessage} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                  Recipient Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  placeholder="e.g. +91 9094251268 or 9094251268"
                  className="w-full px-4 py-3 bg-[#0b1410] border border-[#1b2b24] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                  Message Content
                </label>
                <textarea
                  rows={5}
                  required
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  className="w-full p-4 bg-[#0b1410] border border-[#1b2b24] rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-[#10b981]"
                  placeholder="Type your WhatsApp notification message here..."
                />
              </div>

              {/* Quick Template Snippets */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Quick Template Snippets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDirectMessageText('Hi! Your handcrafted wooden order #SWARNA-505175 has been dispatched via BlueDart Express. Track live delivery: https://swarnawoodencrafts.com/track?order=SWARNA-505175')}
                    className="px-3 py-1.5 bg-[#05291b] hover:bg-[#093e2a] text-[#34d399] border border-[#10b981]/30 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📦 Dispatched Alert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectMessageText('Hello from Swarna Wooden Crafts! We have received your custom inquiry. Our master artisan concierge will assist you shortly.')}
                    className="px-3 py-1.5 bg-[#05291b] hover:bg-[#093e2a] text-[#34d399] border border-[#10b981]/30 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🗣️ Support Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectMessageText('Namaste! Please confirm your complete delivery pin code & address for your Swarna Wooden Crafts order dispatch.')}
                    className="px-3 py-1.5 bg-[#05291b] hover:bg-[#093e2a] text-[#34d399] border border-[#10b981]/30 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📍 Address Verification</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Direct WhatsApp Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: META 24-HOUR SERVICE WINDOW CARD (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0f1714] p-6 rounded-3xl border border-[#1b2b24] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-[#34d399] font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-[#34d399]" />
                <span>META 24-HOUR SERVICE WINDOW</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Meta allows free-form text messages if the customer initiated a conversation within the past 24 hours. For outbound notifications outside 24h, please use <strong className="text-white">Approved Utility Templates</strong> in Template Studio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: MESSAGE AUDIT LOGS (MATCHING SCREENSHOT 2 EXACTLY) */}
      {activeTab === 'logs' && (
        <div className="space-y-4 animate-fadeIn">
          {/* TOP SEARCH & FILTER BAR */}
          <div className="bg-[#0f1714] p-4 rounded-2xl border border-[#1b2b24] shadow-md flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search phone, template, or WAM-ID..."
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0b1410] border border-[#1b2b24] rounded-xl text-xs text-white focus:outline-none focus:border-[#10b981]"
              />
              <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <select className="bg-[#0b1410] border border-[#1b2b24] text-xs font-bold text-gray-300 px-3 py-2 rounded-xl focus:outline-none cursor-pointer">
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>

              <select className="bg-[#0b1410] border border-[#1b2b24] text-xs font-bold text-gray-300 px-3 py-2 rounded-xl focus:outline-none cursor-pointer">
                <option value="all">All Templates</option>
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
              </select>

              <button
                type="button"
                onClick={fetchLogs}
                className="p-2 bg-[#0b1410] hover:bg-[#12211a] text-gray-300 border border-[#1b2b24] rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Refresh Audit Logs"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER WITH HEADERS */}
          <div className="bg-[#0f1714] rounded-3xl border border-[#1b2b24] shadow-xl overflow-hidden">
            <div className="bg-[#0b1410] px-6 py-3 border-b border-[#1b2b24] grid grid-cols-12 gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <div className="col-span-3">RECIPIENT</div>
              <div className="col-span-3">TEMPLATE / TYPE</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">META WAM-ID</div>
              <div className="col-span-2 text-right">DATE & TIME</div>
            </div>

            <div className="divide-y divide-[#1b2b24]">
              {combinedLogs.length > 0 ? (
                combinedLogs.map((log, idx) => (
                  <div key={log.id || idx} className="px-6 py-4 grid grid-cols-12 gap-4 items-center text-xs hover:bg-[#122019] transition-colors">
                    <div className="col-span-3 font-mono font-bold text-white">
                      +{log.recipient_phone}
                    </div>

                    <div className="col-span-3 text-gray-300 font-medium">
                      {log.message_type || 'direct_text'}
                    </div>

                    <div className="col-span-2">
                      {renderStatusBadge(log.status)}
                    </div>

                    <div className="col-span-2 font-mono text-gray-400 text-[11px] truncate">
                      {log.message_id || 'wa-msg-live'}
                    </div>

                    <div className="col-span-2 text-right font-mono text-gray-400 text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-gray-400 text-xs">
                  No WhatsApp logs found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 4: AUTOMATIONS & SETTINGS (MATCHING SCREENSHOT 3 EXACTLY) */}
      {activeTab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fadeIn">

          {/* LEFT: AUTOMATED NOTIFICATION TRIGGERS (8 COLS) */}
          <div className="lg:col-span-8 bg-[#0f1714] p-6 sm:p-8 rounded-3xl border border-[#1b2b24] shadow-xl space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h3 className="font-bold text-base uppercase tracking-wider text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#34d399]" />
                <span>AUTOMATED NOTIFICATION TRIGGERS</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Configure when WhatsApp messages are automatically dispatched to customers and admins.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Trigger 1: Master Switch */}
              <div className="p-4 bg-[#0b1410] rounded-2xl border border-[#1b2b24] flex justify-between items-center hover:border-gray-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block text-sm">Enable WhatsApp Engine</span>
                  <span className="text-gray-400 block text-[11px]">Master switch for all automated WhatsApp outbound notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoOrderConfirm}
                  onChange={(e) => setAutoOrderConfirm(e.target.checked)}
                  className="w-5 h-5 accent-[#10b981] rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Trigger 2: Order Confirmation */}
              <div className="p-4 bg-[#0b1410] rounded-2xl border border-[#1b2b24] flex justify-between items-center hover:border-gray-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block text-sm">Order Confirmation (order_confirmation_01)</span>
                  <span className="text-gray-400 block text-[11px]">Dispatch instant WhatsApp alert with order summary & tracking URL when customer places an order</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoOrderConfirm}
                  onChange={(e) => setAutoOrderConfirm(e.target.checked)}
                  className="w-5 h-5 accent-[#10b981] rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Trigger 3: Shipping & Dispatch */}
              <div className="p-4 bg-[#0b1410] rounded-2xl border border-[#1b2b24] flex justify-between items-center hover:border-gray-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block text-sm">Dispatch & Tracking Notification (order_shipped)</span>
                  <span className="text-gray-400 block text-[11px]">Send WhatsApp update with live carrier tracking link when status changes to Shipped</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoShippingUpdate}
                  onChange={(e) => setAutoShippingUpdate(e.target.checked)}
                  className="w-5 h-5 accent-[#10b981] rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Trigger 4: Handcrafted Restocking / Inquiry Alert */}
              <div className="p-4 bg-[#0b1410] rounded-2xl border border-[#1b2b24] flex justify-between items-center hover:border-gray-700 transition-colors">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block text-sm">Handcrafted Restocking Alert (dispatch_delay1)</span>
                  <span className="text-gray-400 block text-[11px]">Sends confirmation message when a patron submits a custom wood carving request</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoBespokeInquiry}
                  onChange={(e) => setAutoBespokeInquiry(e.target.checked)}
                  className="w-5 h-5 accent-[#10b981] rounded cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: META WEBHOOK SETUP CARD (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0f1714] p-6 rounded-3xl border border-[#1b2b24] shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-[#34d399] font-bold text-xs uppercase tracking-wider border-b border-gray-800 pb-3">
                <Bot className="w-4 h-4 text-[#34d399]" />
                <span>META WEBHOOK SETUP</span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                To receive delivery receipts (sent, delivered, read) and customer replies, configure this webhook in Meta App Dashboard:
              </p>

              {/* Callback URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  CALLBACK URL:
                </label>
                <div className="flex items-center gap-2 bg-[#0b1410] border border-[#1b2b24] p-2.5 rounded-xl text-[11px] font-mono text-emerald-300">
                  <span className="truncate flex-1">https://kimkttzdxnkekcoeuvop.supabase.co/functions/v1/whatsapp-webhook</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://kimkttzdxnkekcoeuvop.supabase.co/functions/v1/whatsapp-webhook', 'token')}
                    className="text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Verify Token */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  VERIFY TOKEN:
                </label>
                <div className="flex items-center gap-2 bg-[#0b1410] border border-[#1b2b24] p-2.5 rounded-xl text-[11px] font-mono text-emerald-300">
                  <span className="truncate flex-1">swarna_whatsapp_verify_token_2026</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('swarna_whatsapp_verify_token_2026', 'token')}
                    className="text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
