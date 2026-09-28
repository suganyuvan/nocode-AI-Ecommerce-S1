import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import {
  WHATSAPP_CONFIG,
  BUSINESS_PHONE_NUMBER,
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

export interface WhatsAppErrorDetails {
  isError: boolean;
  code?: number;
  message: string;
  is24hWindowError: boolean;
}

export function parseWhatsAppErrorDetails(log: any): WhatsAppErrorDetails {
  if (!log) return { isError: false, message: '', is24hWindowError: false };

  let errorRaw = log.error_details;
  if (!errorRaw && log.status === 'failed' && log.payload?.errors) {
    errorRaw = log.payload.errors;
  }
  if (!errorRaw && typeof log.payload === 'string') {
    errorRaw = log.payload;
  }
  if (!errorRaw && log.payload?.error) {
    errorRaw = log.payload.error;
  }

  if (!errorRaw) {
    return { isError: false, message: '', is24hWindowError: false };
  }

  let parsed: any = null;
  if (typeof errorRaw === 'object') {
    parsed = errorRaw;
  } else if (typeof errorRaw === 'string') {
    try {
      parsed = JSON.parse(errorRaw);
    } catch (e) {
      parsed = errorRaw;
    }
  }

  // Handle array e.g. [{"code":131047,"title":"Re-engagement message", ...}]
  if (Array.isArray(parsed) && parsed.length > 0) {
    const err = parsed[0];
    const code = err.code;
    const details = err.error_data?.details || err.message || err.title || 'WhatsApp Cloud API Delivery Failure';
    const is24h = code === 131047 || String(details).toLowerCase().includes('24 hours') || String(details).toLowerCase().includes('re-engagement');

    if (is24h) {
      return {
        isError: true,
        code: 131047,
        message: '⚠️ 24-Hour Customer Window Expired: Over 24 hours have passed since customer last replied to this number. Free-form text messages are blocked by Meta. Send an approved Meta WhatsApp Template to re-engage.',
        is24hWindowError: true,
      };
    }

    return {
      isError: true,
      code,
      message: `⚠️ Meta API Error ${code ? `(#${code})` : ''}: ${details}`,
      is24hWindowError: false,
    };
  }

  // Handle object e.g. { code: 131047, message: "..." }
  if (parsed && typeof parsed === 'object') {
    const code = parsed.code || parsed.error?.code;
    const details = parsed.error_data?.details || parsed.message || parsed.error?.message || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
    const is24h = code === 131047 || String(details).toLowerCase().includes('24 hours') || String(details).toLowerCase().includes('re-engagement');

    if (is24h) {
      return {
        isError: true,
        code: 131047,
        message: '⚠️ 24-Hour Customer Window Expired: Over 24 hours have passed since customer last replied to this number. Free-form text messages are blocked by Meta. Send an approved Meta WhatsApp Template to re-engage.',
        is24hWindowError: true,
      };
    }

    return {
      isError: true,
      code,
      message: `⚠️ Meta API Error ${code ? `(#${code})` : ''}: ${details}`,
      is24hWindowError: false,
    };
  }

  // Handle plain string
  const str = String(parsed);
  const is24h = str.includes('131047') || str.toLowerCase().includes('24 hours') || str.toLowerCase().includes('re-engagement');
  if (is24h) {
    return {
      isError: true,
      code: 131047,
      message: '⚠️ 24-Hour Customer Window Expired: Over 24 hours have passed since customer last replied to this number. Free-form text messages are blocked by Meta. Send an approved Meta WhatsApp Template to re-engage.',
      is24hWindowError: true,
    };
  }

  return {
    isError: true,
    message: `⚠️ ${str}`,
    is24hWindowError: false,
  };
}

export function extractLogMessageText(log: any): string {
  if (!log) return '';

  // Check if log represents a failed message or contains error_details
  if (log.status === 'failed' || log.error_details) {
    const errInfo = parseWhatsAppErrorDetails(log);
    if (errInfo.isError && errInfo.message) {
      return errInfo.message;
    }
  }

  const payload = log.payload;

  if (typeof payload?.text === 'string') return payload.text;
  if (typeof payload?.text?.body === 'string') return payload.text.body;
  if (typeof payload?.raw?.text?.body === 'string') return payload.raw.text.body;
  if (typeof payload?.body === 'string') return payload.body;
  if (typeof payload?.text === 'object' && payload?.text?.body) return String(payload.text.body);

  if (payload?.template?.name) {
    return `[Template Sent: ${payload.template.name}]`;
  }

  if (typeof log.error_details === 'string' && log.error_details) {
    const errInfo = parseWhatsAppErrorDetails(log);
    return errInfo.message || log.error_details;
  }

  if (typeof payload === 'string') {
    if (payload.startsWith('[') || payload.startsWith('{')) {
      const errInfo = parseWhatsAppErrorDetails({ error_details: payload });
      if (errInfo.isError) return errInfo.message;
    }
    return payload;
  }

  return `[${log.message_type || log.status || 'WhatsApp Message'}]`;
}

export function WhatsAppSettingsManager() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'messenger' | 'logs' | 'automations' | 'chat'>('simulator');

  // Selected Template & Params State
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(APPROVED_TEMPLATES[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(APPROVED_TEMPLATES[0].defaultParams);
  const [recipientPhone, setRecipientPhone] = useState('8608449937');

  // Direct Messenger State
  const [directPhone, setDirectPhone] = useState('+91 8608449937');
  const [directMessageText, setDirectMessageText] = useState('Hello from Swarna Wooden Crafts! Your custom wood sculpture inquiry has been received.');

  // Live Customer Chat Window States
  const [selectedChatPhone, setSelectedChatPhone] = useState<string | null>(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [sendingChatReply, setSendingChatReply] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatNotice, setChatNotice] = useState<string | null>(null);

  // Live Customer Chat Re-engagement Template States
  const [chatSendMode, setChatSendMode] = useState<'text' | 'template'>('text');
  const [chatTemplate, setChatTemplate] = useState<WhatsAppTemplate>(APPROVED_TEMPLATES[0]);
  const [chatTemplateParams, setChatTemplateParams] = useState<Record<string, string>>(APPROVED_TEMPLATES[0].defaultParams);

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

  // Live polling for incoming messages when chat tab is active
  useEffect(() => {
    let interval: any;
    if (activeTab === 'chat') {
      fetchLogs();
      interval = setInterval(() => {
        fetchLogs();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

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
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

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
      console.error('Failed to fetch whatsapp_logs:', err);
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

  // Group logs into unique customer conversations by phone number
  const conversationsMap: Record<string, { phone: string; messages: any[]; lastMessage: any; unreadCount: number }> = {};

  combinedLogs.forEach((log) => {
    const rawPhone = log.recipient_phone || log.payload?.from || log.payload?.to || log.payload?.recipient_id || '';
    const cleanPhone = cleanPhoneNumber(rawPhone);
    if (!cleanPhone || cleanPhone === BUSINESS_PHONE_NUMBER) return;

    if (!conversationsMap[cleanPhone]) {
      conversationsMap[cleanPhone] = {
        phone: cleanPhone,
        messages: [],
        lastMessage: log,
        unreadCount: 0,
      };
    }

    conversationsMap[cleanPhone].messages.push(log);
    const isUnread = log.status === 'received' || log.message_type === 'inbound_customer_reply';
    if (isUnread) {
      conversationsMap[cleanPhone].unreadCount += 1;
    }
  });

  const conversationList = Object.values(conversationsMap).map(conv => ({
    ...conv,
    messages: conv.messages.sort((a, b) => new Date(a.created_at || Date.now()).getTime() - new Date(b.created_at || Date.now()).getTime()),
    lastMessage: conv.messages[conv.messages.length - 1],
  })).sort((a, b) => new Date(b.lastMessage?.created_at || Date.now()).getTime() - new Date(a.lastMessage?.created_at || Date.now()).getTime());

  const filteredConversations = conversationList.filter(c => 
    !chatSearchQuery.trim() || 
    c.phone.includes(chatSearchQuery.trim()) || 
    extractLogMessageText(c.lastMessage).toLowerCase().includes(chatSearchQuery.trim().toLowerCase())
  );

  const activeConversation = conversationList.find(c => c.phone === selectedChatPhone) || (conversationList.length > 0 ? conversationList[0] : null);

  const totalInboundCount = combinedLogs.filter(l => (l.status === 'received' || l.message_type === 'inbound_customer_reply') && cleanPhoneNumber(l.recipient_phone) !== BUSINESS_PHONE_NUMBER).length;

  // Switch template & reset parameters in Chat panel
  const handleSelectChatTemplate = (tpl: WhatsAppTemplate) => {
    setChatTemplate(tpl);
    setChatTemplateParams({ ...tpl.defaultParams });
  };

  // Send Direct Text Reply to selected customer
  const handleSendChatReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPhone = selectedChatPhone || activeConversation?.phone || (conversationList.length > 0 ? conversationList[0].phone : '');
    if (!targetPhone || !chatReplyText.trim()) {
      setChatNotice('Please select a customer conversation thread to reply.');
      return;
    }

    setSendingChatReply(true);
    setChatNotice(null);

    const bodyText = chatReplyText.trim();
    const result = await sendWhatsAppTextMessage({
      to: targetPhone,
      body: bodyText,
    });

    setSendingChatReply(false);

    if (result.success) {
      setChatReplyText('');
      setChatNotice('Reply transmitted to Meta WhatsApp API successfully!');
      setTimeout(() => setChatNotice(null), 3500);

      const newLocal = {
        id: `local-reply-${Date.now()}`,
        recipient_phone: targetPhone,
        message_type: 'direct_text_reply',
        status: 'sent',
        message_id: result.messageId || 'wamid.local_reply',
        created_at: new Date().toISOString(),
        payload: { text: bodyText, type: 'text' },
      };
      setLocalLogs((prev) => [newLocal, ...prev]);
      fetchLogs();
    } else {
      const errInfo = parseWhatsAppErrorDetails({ error_details: result.error });
      if (errInfo.is24hWindowError || result.error?.includes('131047')) {
        setChatSendMode('template');
        setChatNotice('⚠️ Message failed (Error 131047): 24-hour customer window expired. Auto-switched to Approved Template mode for re-engagement.');
      } else {
        setChatNotice(`Failed to send reply: ${errInfo.message || result.error || 'Meta API error'}`);
      }
    }
  };

  // Send Approved Template Reply to selected customer (re-engagement outside 24h window)
  const handleSendChatTemplateReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPhone = selectedChatPhone || activeConversation?.phone || (conversationList.length > 0 ? conversationList[0].phone : '');
    if (!targetPhone) {
      setChatNotice('Please select a customer conversation thread.');
      return;
    }

    setSendingChatReply(true);
    setChatNotice(null);

    const bodyParams = chatTemplate.paramLabels.map((p) => ({
      type: 'text',
      text: chatTemplateParams[p.key] || p.key,
    }));

    const components = bodyParams.length > 0 ? [{ type: 'body', parameters: bodyParams }] : undefined;

    const result = await sendWhatsAppTemplateMessage({
      to: targetPhone,
      templateName: chatTemplate.name,
      languageCode: chatTemplate.language || 'en',
      components,
    });

    setSendingChatReply(false);

    if (result.success) {
      setChatNotice(`✅ Approved Template "${chatTemplate.name}" dispatched to Meta WhatsApp API!`);
      setTimeout(() => setChatNotice(null), 4000);

      const newLocal = {
        id: `local-template-reply-${Date.now()}`,
        recipient_phone: targetPhone,
        message_type: `template_${chatTemplate.name}`,
        status: 'sent',
        message_id: result.messageId || 'wamid.local_tpl_reply',
        created_at: new Date().toISOString(),
        payload: { template: { name: chatTemplate.name }, components },
      };
      setLocalLogs((prev) => [newLocal, ...prev]);
      fetchLogs();
    } else {
      const errInfo = parseWhatsAppErrorDetails({ error_details: result.error });
      setChatNotice(`Failed to send template: ${errInfo.message || result.error || 'Meta API error'}`);
    }
  };

  // Helper to simulate an inbound customer reply directly into chat thread
  const handleSimulateInboundCustomerMessage = async () => {
    const targetPhone = selectedChatPhone || activeConversation?.phone;
    if (!targetPhone) return;

    const sampleInboundText = "Namaste! I am checking on my custom wood sculpture order delivery status.";
    const newInbound = {
      recipient_phone: targetPhone,
      message_type: 'inbound_customer_reply',
      status: 'received',
      message_id: `wamid.simulated_inbound_${Date.now()}`,
      payload: { text: sampleInboundText, type: 'text' },
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('whatsapp_logs').insert([newInbound]);
      setLocalLogs((prev) => [newInbound, ...prev]);
      setChatNotice('✅ Inbound customer message simulated & added to chat thread!');
      setTimeout(() => setChatNotice(null), 3500);
      fetchLogs();
    } catch (err) {
      console.error('Failed to simulate inbound message:', err);
    }
  };

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

        <button
          type="button"
          onClick={() => {
            setActiveTab('chat');
            fetchLogs();
          }}
          className={`py-3 flex items-center gap-2 border-b-2 font-extrabold cursor-pointer transition-all relative ${activeTab === 'chat'
              ? 'border-[#10b981] text-[#34d399]'
              : 'border-transparent text-gray-400 hover:text-white'
            }`}
        >
          <MessageSquare className="w-4 h-4 text-[#34d399]" />
          <span>LIVE CUSTOMER CHAT</span>
          {totalInboundCount > 0 && (
            <span className="bg-[#10b981] text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
              {totalInboundCount}
            </span>
          )}
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

      {/* 5. TAB CONTENT 5: LIVE CUSTOMER CHAT WINDOW */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-fadeIn min-h-[580px]">
          
          {/* LEFT COLUMN: CONVERSATIONS LIST (4 COLS) */}
          <div className="lg:col-span-4 bg-[#0f1714] p-4 rounded-3xl border border-[#1b2b24] shadow-xl flex flex-col">
            
            {/* Search Bar & Header */}
            <div className="pb-3 border-b border-[#1b2b24] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-label-caps uppercase tracking-wider text-gray-300 font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#34d399]" />
                  <span>Conversations ({conversationList.length})</span>
                </span>
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="text-gray-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title="Refresh Conversations"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Search phone number..."
                className="w-full bg-[#0b1410] border border-[#1b2b24] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#10b981] font-mono"
              />
            </div>

            {/* Conversations List Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-2 pt-3 custom-scrollbar max-h-[480px]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-50" />
                  <p>No WhatsApp customer conversations found.</p>
                  <p className="text-[11px] text-gray-600 mt-1">Send a live test message or submit a website inquiry to initialize chat.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedChatPhone === conv.phone;
                  const lastMsg = conv.lastMessage;
                  const lastText = extractLogMessageText(lastMsg);
                  const isIncoming = lastMsg?.status === 'received' || lastMsg?.message_type === 'inbound_customer_reply';

                  return (
                    <div
                      key={conv.phone}
                      onClick={() => setSelectedChatPhone(conv.phone)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-3 ${
                        isSelected
                          ? 'bg-[#14261f] border-[#10b981] shadow-md'
                          : 'bg-[#0b1410] border-[#1b2b24] hover:border-gray-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white tracking-wide truncate">
                            +{conv.phone}
                          </span>
                          {isIncoming && (
                            <span className="bg-purple-950 text-purple-300 border border-purple-700/50 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              INBOUND
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">
                          {lastText}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500 block font-mono">
                          {new Date(lastMsg?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="inline-block mt-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTIVE CHAT WINDOW (8 COLS) */}
          <div className="lg:col-span-8 bg-[#0f1714] rounded-3xl border border-[#1b2b24] shadow-xl flex flex-col overflow-hidden min-h-[520px]">
            {activeConversation ? (
              <>
                {(() => {
                  const inboundMsgs = activeConversation.messages.filter(l => l.status === 'received' || l.message_type === 'inbound_customer_reply' || l.message_type === 'inbound_text');
                  const lastInbound = inboundMsgs.length > 0 ? inboundMsgs[inboundMsgs.length - 1] : null;
                  const hoursSinceInbound = lastInbound ? (Date.now() - new Date(lastInbound.created_at).getTime()) / (1000 * 60 * 60) : Infinity;
                  const has24hFail = activeConversation.messages.some(l => parseWhatsAppErrorDetails(l).is24hWindowError);
                  const isOutside24hWindow = !lastInbound || hoursSinceInbound > 24 || has24hFail;

                  return (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 bg-[#0b1410] border-b border-[#1b2b24] flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#05291b] border border-[#10b981]/30 text-[#34d399] flex items-center justify-center font-bold">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                              <span>+{activeConversation.phone}</span>
                              {isOutside24hWindow ? (
                                <span className="bg-amber-950 text-amber-300 border border-amber-800/40 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span>24h Window Expired</span>
                                </span>
                              ) : (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>24h Window Active</span>
                                </span>
                              )}
                            </h3>
                            <p className="text-[11px] text-gray-400">
                              Swarna Wooden Crafts Concierge Session
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSimulateInboundCustomerMessage}
                            className="bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/50 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Test & verify incoming customer message rendering in UI"
                          >
                            <Bot className="w-3.5 h-3.5 text-purple-300" />
                            <span>Simulate Inbound Reply</span>
                          </button>
                          <a
                            href={`https://wa.me/${activeConversation.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#05291b] hover:bg-[#083d29] text-[#34d399] border border-[#10b981]/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* 24-Hour Window Warning Banner */}
                      {isOutside24hWindow && (
                        <div className="bg-[#241709] border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 text-xs text-amber-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>Meta 24-Hour Window Inactive:</strong> Free-form text replies will fail (Error 131047). Use approved WhatsApp templates to re-engage this customer.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setChatSendMode('template')}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0"
                          >
                            Use Approved Template
                          </button>
                        </div>
                      )}

                      {/* Chat Thread Messages Area */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-95 custom-scrollbar min-h-[320px] max-h-[380px]">
                        {activeConversation.messages.map((log, msgIdx) => {
                          const isCustomer = log.status === 'received' || log.message_type === 'inbound_customer_reply' || log.message_type === 'inbound_text';
                          const errInfo = (log.status === 'failed' || log.error_details) ? parseWhatsAppErrorDetails(log) : null;
                          const isFailed = !!errInfo?.isError;
                          const msgText = extractLogMessageText(log);
                          const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={log.id ? `${log.id}-${msgIdx}` : `msg-${msgIdx}-${log.created_at || Date.now()}`}
                              className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                            >
                              <div
                                className={`max-w-[85%] p-3.5 rounded-2xl text-xs shadow-md space-y-2 ${
                                  isFailed
                                    ? 'bg-[#3b151b] border border-red-500/50 text-red-100 rounded-tr-none'
                                    : isCustomer
                                    ? 'bg-[#182620] border border-[#243d33] text-[#e4f5ed] rounded-tl-none'
                                    : 'bg-[#054d32] border border-[#0d7a52] text-white rounded-tr-none'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-[10px] font-bold opacity-80">
                                  <span className="flex items-center gap-1.5">
                                    {isFailed ? (
                                      <>
                                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-red-300 font-extrabold uppercase">Delivery Failed</span>
                                      </>
                                    ) : isCustomer ? (
                                      'Customer Inquiry'
                                    ) : (
                                      'Swarna Crafts Concierge'
                                    )}
                                  </span>
                                  <span className="font-mono">{timeStr}</span>
                                </div>

                                <p className="whitespace-pre-wrap leading-relaxed text-xs pt-1 font-body-md">
                                  {msgText}
                                </p>

                                {isFailed && errInfo?.is24hWindowError && (
                                  <div className="pt-2 border-t border-red-500/30 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-amber-300 font-medium">
                                      💡 Send an approved Meta template to re-engage.
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChatSendMode('template');
                                        setChatNotice('Switched to Approved Template mode for re-engagement.');
                                      }}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shrink-0"
                                    >
                                      Send Template
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Feedback Notice */}
                      {chatNotice && (
                        <div className="px-4 py-2 bg-emerald-950/90 border-t border-emerald-800/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{chatNotice}</span>
                        </div>
                      )}

                      {/* Mode Switcher Tabs + Reply Box */}
                      <div className="p-4 bg-[#0b1410] border-t border-[#1b2b24] space-y-3">
                        {/* Mode Switcher */}
                        <div className="flex items-center gap-2 border-b border-[#1b2b24] pb-3">
                          <button
                            type="button"
                            onClick={() => setChatSendMode('text')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              chatSendMode === 'text'
                                ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                : 'bg-[#0f1714] text-gray-400 hover:text-white border border-[#1b2b24]'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>💬 Direct Free-Form Reply</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setChatSendMode('template')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              chatSendMode === 'template'
                                ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                : 'bg-[#0f1714] text-gray-400 hover:text-white border border-[#1b2b24]'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>📋 Approved Template (Re-engagement)</span>
                          </button>
                        </div>

                        {/* MODE 1: DIRECT FREE-FORM TEXT REPLY */}
                        {chatSendMode === 'text' && (
                          <form onSubmit={handleSendChatReply} className="space-y-3">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span className="font-bold flex items-center gap-1.5 text-gray-300">
                                <Sparkles className="w-3.5 h-3.5 text-[#34d399]" />
                                <span>Quick Reply Snippets:</span>
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setChatReplyText('Namaste! Thank you for contacting Swarna Wooden Crafts. Our master carvers are reviewing your inquiry.')}
                                  className="bg-[#14261f] hover:bg-[#1f3a30] text-[#34d399] border border-[#10b981]/30 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  💬 Greeting
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatReplyText(`Your order is currently being handcrafted with white-glove precision. Track status at: https://swarnawoodencrafts.com/track`)}
                                  className="bg-[#14261f] hover:bg-[#1f3a30] text-[#34d399] border border-[#10b981]/30 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  📦 Order Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatReplyText('We offer premium Grade-A Teakwood, Sandalwood, and Rosewood timber for custom deity sculptures. What size do you require?')}
                                  className="bg-[#14261f] hover:bg-[#1f3a30] text-[#34d399] border border-[#10b981]/30 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  🪵 Timber Options
                                </button>
                              </div>
                            </div>

                            <div className="flex items-end gap-3">
                              <textarea
                                rows={2}
                                value={chatReplyText}
                                onChange={(e) => setChatReplyText(e.target.value)}
                                placeholder={`Type WhatsApp reply to +${activeConversation.phone}...`}
                                className="flex-1 bg-[#0f1714] border border-[#1b2b24] text-white p-3 rounded-2xl text-xs focus:outline-none focus:border-[#10b981] resize-none font-body-md"
                              />

                              <button
                                type="submit"
                                disabled={sendingChatReply || !chatReplyText.trim()}
                                className="bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-extrabold px-5 py-3.5 rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
                              >
                                {sendingChatReply ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 text-black" />
                                    <span>SEND REPLY</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* MODE 2: APPROVED TEMPLATE RE-ENGAGEMENT */}
                        {chatSendMode === 'template' && (
                          <form onSubmit={handleSendChatTemplateReply} className="space-y-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                                Choose Approved Meta WhatsApp Template:
                              </label>
                              <select
                                value={chatTemplate.id}
                                onChange={(e) => {
                                  const tpl = APPROVED_TEMPLATES.find((t) => t.id === e.target.value);
                                  if (tpl) handleSelectChatTemplate(tpl);
                                }}
                                className="w-full bg-[#0f1714] border border-[#1b2b24] text-white px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#10b981] cursor-pointer"
                              >
                                {APPROVED_TEMPLATES.map((tpl) => (
                                  <option key={tpl.id} value={tpl.id}>
                                    {tpl.name} ({tpl.category}) — {tpl.description}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Parameter Fields */}
                            {chatTemplate.paramLabels.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#070d0a] p-3 rounded-xl border border-[#1b2b24]">
                                {chatTemplate.paramLabels.map((p) => (
                                  <div key={p.key} className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <label className="font-bold text-gray-300">{p.label}</label>
                                    </div>
                                    <input
                                      type="text"
                                      value={chatTemplateParams[p.key] || ''}
                                      onChange={(e) => setChatTemplateParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                                      className="w-full px-2.5 py-1.5 bg-[#0b1410] border border-[#1b2b24] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              type="submit"
                              disabled={sendingChatReply}
                              className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 uppercase tracking-wider"
                            >
                              {sendingChatReply ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 text-black" />
                                  <span>Dispatch Approved Template Message to +{activeConversation.phone}</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-600 opacity-40" />
                <h4 className="text-sm font-bold text-gray-300">Select a Conversation</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Choose a customer phone number from the left panel to open the active WhatsApp chat thread.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
