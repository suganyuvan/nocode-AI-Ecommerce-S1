import { supabase } from './supabaseClient';

export const WHATSAPP_CONFIG = {
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '1442648035597125',
  businessAccountId: import.meta.env.VITE_WHATSAPP_BUSINESS_ACCOUNT_ID || '831276670043386',
  accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '',
  graphApiVersion: 'v21.0',
};

/**
 * Sanitizes phone number to Meta WhatsApp Cloud API format (E.164 without leading +)
 * e.g. "+91 8610554711" -> "918610554711"
 * e.g. "8610554711" -> "918610554711" (default India code if 10 digits)
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  recipientPhone?: string;
  error?: string;
  rawResponse?: any;
}

/**
 * Low-level HTTP caller for Meta Graph API WhatsApp Cloud Endpoint
 */
export async function sendWhatsAppApiPayload(
  payload: any,
  customToken?: string,
  customPhoneId?: string
): Promise<WhatsAppSendResult> {
  const phoneId = customPhoneId || WHATSAPP_CONFIG.phoneNumberId;
  const token = customToken || WHATSAPP_CONFIG.accessToken;
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.graphApiVersion}/${phoneId}/messages`;

  if (!token) {
    console.error('Meta WhatsApp Cloud API Error: Missing Access Token (VITE_WHATSAPP_ACCESS_TOKEN)');
    return {
      success: false,
      recipientPhone: payload.to,
      error: 'Missing Meta WhatsApp Access Token. Please configure VITE_WHATSAPP_ACCESS_TOKEN in your environment.',
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.error?.message || `HTTP ${response.status}: Meta API Request Failed`;
      console.error('Meta WhatsApp Cloud API Error:', responseData);
      
      // Log to Supabase audit log if available
      logWhatsAppEventToSupabase({
        recipient_phone: payload.to,
        message_type: payload.type,
        status: 'failed',
        error_details: errorMsg,
        payload,
      });

      return {
        success: false,
        recipientPhone: payload.to,
        error: errorMsg,
        rawResponse: responseData,
      };
    }

    const messageId = responseData?.messages?.[0]?.id || 'wa-msg-ok';

    // Log success to Supabase
    logWhatsAppEventToSupabase({
      recipient_phone: payload.to,
      message_type: payload.type,
      status: 'sent',
      message_id: messageId,
      payload,
    });

    return {
      success: true,
      messageId,
      recipientPhone: payload.to,
      rawResponse: responseData,
    };
  } catch (err: any) {
    console.error('WhatsApp API Fetch Error:', err);
    return {
      success: false,
      recipientPhone: payload.to,
      error: err.message || 'Network error connecting to Meta WhatsApp Cloud API',
    };
  }
}

export const BUSINESS_PHONE_NUMBER = '918608449937';

/**
 * Send custom text message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppTextMessage(params: {
  to: string;
  body: string;
  previewUrl?: boolean;
}): Promise<WhatsAppSendResult> {
  const formattedPhone = cleanPhoneNumber(params.to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid recipient phone number' };
  }

  // Prevent sending API messages to business's own WABA phone number
  if (formattedPhone === BUSINESS_PHONE_NUMBER) {
    return {
      success: false,
      recipientPhone: formattedPhone,
      error: 'Cannot send WhatsApp Cloud API message to the business sender number itself (+91 8608449937). Please select a customer phone number.',
    };
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      body: params.body,
    },
  };

  if (params.previewUrl) {
    payload.text.preview_url = true;
  }

  return sendWhatsAppApiPayload(payload);
}

/**
 * Send approved Meta WhatsApp Template Message (e.g. hello_world)
 */
export async function sendWhatsAppTemplateMessage(params: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}): Promise<WhatsAppSendResult> {
  const formattedPhone = cleanPhoneNumber(params.to);
  if (!formattedPhone) {
    return { success: false, error: 'Invalid phone number' };
  }

  const payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: params.templateName,
      language: {
        code: params.languageCode || 'en',
      },
    },
  };

  if (params.components && params.components.length > 0) {
    payload.template.components = params.components;
  }

  return sendWhatsAppApiPayload(payload);
}

/**
 * High-Level Notification: Order Confirmation WhatsApp Alert
 * Sends approved Meta Template 'order_confirmation_01' for business-initiated notification (outside 24h window)
 */
export async function sendOrderConfirmationWhatsApp(params: {
  recipientPhone: string;
  recipientName: string;
  orderNumber: string;
  totalAmount?: number;
  currency?: string;
  itemsCount?: number;
  trackingUrl?: string;
}): Promise<WhatsAppSendResult> {
  const trackUrl = params.trackingUrl || `https://swarnawoodencrafts.com/track?order=${encodeURIComponent(params.orderNumber)}`;

  // Send approved Meta template payload (type: "template") required for business-initiated messaging
  return sendWhatsAppTemplateMessage({
    to: params.recipientPhone,
    templateName: 'order_confirmation_01',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.recipientName || 'Valued Customer' },
          { type: 'text', text: params.orderNumber },
          { type: 'text', text: trackUrl },
        ],
      },
    ],
  });
}

/**
 * High-Level Notification: Dispatch & Shipping Tracking WhatsApp Alert
 * Sends approved Meta Template 'order_shipped' for business-initiated notification
 */
export async function sendShippingUpdateWhatsApp(params: {
  recipientPhone: string;
  recipientName: string;
  orderNumber: string;
  trackingNumber: string;
  courierName: string;
}): Promise<WhatsAppSendResult> {
  const trackUrl = `https://swarnawoodencrafts.com/track?order=${encodeURIComponent(params.trackingNumber)}`;

  return sendWhatsAppTemplateMessage({
    to: params.recipientPhone,
    templateName: 'order_shipped',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.recipientName || 'Valued Customer' },
          { type: 'text', text: params.orderNumber },
          { type: 'text', text: `${params.courierName} (AWB: ${params.trackingNumber})` },
          { type: 'text', text: trackUrl },
        ],
      },
    ],
  });
}

/**
 * High-Level Notification: Bespoke Custom Inquiry Confirmation WhatsApp Alert
 */
export async function sendBespokeInquiryWhatsApp(params: {
  recipientPhone: string;
  recipientName: string;
  inquiryDetails: string;
}): Promise<WhatsAppSendResult> {
  const messageText = `✨ *Swarna Wooden Crafts Concierge*

Dear ${params.recipientName || 'Patron'},

We have received your custom woodcraft commission inquiry:
"${params.inquiryDetails.slice(0, 120)}${params.inquiryDetails.length > 120 ? '...' : ''}"

One of our 8th-generation Viswakarma master carvers will review your requirements and reach out directly with timber selection options & design estimates.

Warm regards,
*Swarna Wooden Crafts Guild*`;

  return sendWhatsAppTextMessage({
    to: params.recipientPhone,
    body: messageText,
  });
}

/**
 * High-Level Notification: Abandoned Cart Recovery WhatsApp Link
 */
export async function sendAbandonedCartRecoveryWhatsApp(params: {
  recipientPhone: string;
  recipientName?: string;
  productNames?: string[];
  couponCode?: string;
}): Promise<WhatsAppSendResult> {
  const itemsText = params.productNames && params.productNames.length > 0 
    ? params.productNames.join(', ')
    : 'your selected wooden masterpiece';

  const couponText = params.couponCode 
    ? `\n🎁 Use voucher code *${params.couponCode}* for 10% OFF.`
    : '';

  const messageText = `🪵 *Swarna Wooden Crafts*

Hello ${params.recipientName || 'Collector'},

We noticed you left ${itemsText} in your cart.${couponText}

Complete your heirloom woodcraft order here:
https://swarnawoodencrafts.com/checkout

Need help choosing timber (Teak vs Sandalwood)? Reply directly to chat with our master carvers!`;

  return sendWhatsAppTextMessage({
    to: params.recipientPhone,
    body: messageText,
  });
}

/**
 * Diagnostic test tool to verify Meta API connection on Live Business Phone Numbers
 */
export async function testWhatsAppConnection(targetPhone: string): Promise<WhatsAppSendResult> {
  const cleanPhone = cleanPhoneNumber(targetPhone);
  
  // Use direct text message for live business phone profile
  return sendWhatsAppTextMessage({
    to: cleanPhone,
    body: `✨ Meta WhatsApp Cloud API connection test successful! Connected to Swarna Wooden Crafts (Phone Profile ID: ${WHATSAPP_CONFIG.phoneNumberId}).`,
  });
}

/**
 * Helper to log WhatsApp event records into Supabase if table exists
 */
async function logWhatsAppEventToSupabase(logData: any) {
  try {
    await supabase.from('whatsapp_logs').insert([{
      ...logData,
      created_at: new Date().toISOString(),
    }]);
  } catch (err) {
    // Non-blocking fallback
  }
}
