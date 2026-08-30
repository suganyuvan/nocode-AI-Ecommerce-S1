import { supabase } from './supabaseClient';
import { OutgoingWebhook, WebhookDelivery } from '../types';

export const AVAILABLE_WEBHOOK_EVENTS = [
  { id: 'order.created', label: '📦 Order Created', desc: 'Fired immediately when a customer places a new order' },
  { id: 'order.paid', label: '💳 Order Paid / Verified', desc: 'Fired when payment is captured & verified' },
  { id: 'order.shipped', label: '🚚 Order Shipped / Dispatched', desc: 'Fired when courier AWB & tracking code is assigned' },
  { id: 'order.delivered', label: '✅ Order Delivered', desc: 'Fired when order status changes to Delivered' },
  { id: 'order.cancelled', label: '❌ Order Cancelled', desc: 'Fired if an order is cancelled or refunded' },
  { id: 'ticket.created', label: '🎫 Support Ticket Created', desc: 'Fired when a customer submits a new inquiry ticket' },
  { id: 'ticket.responded', label: '💬 Support Response Sent', desc: 'Fired when concierge responds to a ticket' },
  { id: 'customer.registered', label: '👤 Customer Registered', desc: 'Fired when a new user profile is created' },
  { id: 'lead.created', label: '✨ Lead / Inquiry Received', desc: 'Fired when newsletter or inquiry form is submitted' },
];

/**
 * Dispatches an event payload to all active subscribed outgoing webhook URLs
 */
export async function dispatchWebhookEvent(eventName: string, data: any) {
  try {
    // 1. Fetch active webhooks from Supabase
    const { data: webhooks, error } = await supabase
      .from('outgoing_webhooks')
      .select('*')
      .eq('is_active', true);

    if (error || !webhooks || webhooks.length === 0) {
      return;
    }

    // 2. Filter webhooks subscribed to this event or 'all'
    const targetWebhooks = webhooks.filter((wh: OutgoingWebhook) => {
      if (!wh.url || !wh.url.startsWith('http')) return false;
      const eventsList = Array.isArray(wh.events) ? wh.events : [];
      return eventsList.includes(eventName) || eventsList.includes('all') || eventsList.length === 0;
    });

    if (targetWebhooks.length === 0) return;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      source: 'Irisjev Wooden Crafts Webhook Gateway',
      environment: 'production',
      data: data,
    };

    // 3. Dispatch to all endpoints in parallel
    await Promise.allSettled(
      targetWebhooks.map(async (wh: OutgoingWebhook) => {
        const startTime = Date.now();
        let responseStatus = 0;
        let responseBody = '';
        let status: 'success' | 'failed' = 'failed';

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Irisjev-Event': eventName,
            'X-Irisjev-Delivery': `del-${Date.now()}`,
            'X-Irisjev-Signature': wh.secret_key ? `sha256=${wh.secret_key}` : 'unsigned',
            ...(wh.headers || {})
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const res = await fetch(wh.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          responseStatus = res.status;
          const text = await res.text();
          responseBody = text.slice(0, 1000); // Record up to 1000 chars

          if (res.ok) {
            status = 'success';
          }
        } catch (err: any) {
          responseStatus = 0;
          responseBody = err?.message || 'Network request failed or timed out';
          status = 'failed';
        }

        const durationMs = Date.now() - startTime;

        // 4. Log delivery result in Supabase
        try {
          await supabase.from('webhook_deliveries').insert([{
            webhook_id: wh.id || null,
            event_name: eventName,
            target_url: wh.url,
            payload: payload,
            response_status: responseStatus,
            response_body: responseBody,
            duration_ms: durationMs,
            status: status,
          }]);
        } catch (logErr) {
          console.warn('Failed to log webhook delivery:', logErr);
        }
      })
    );
  } catch (err) {
    console.warn('Webhook dispatch exception:', err);
  }
}

/**
 * Sends an immediate live test webhook to verify an endpoint URL
 */
export async function sendTestWebhook(
  url: string, 
  eventName: string = 'order.created', 
  secretKey?: string,
  customData?: any
): Promise<{ success: boolean; status: number; body: string; durationMs: number; error?: string }> {
  const startTime = Date.now();
  const sampleData = customData || {
    order_number: 'SWARNA-SAMPLE-99',
    customer: {
      full_name: 'Heritage Collector (Test)',
      email: 'collector@example.com',
      phone: '+91 9876543210',
      city: 'Chennai',
      state: 'Tamil Nadu'
    },
    total_amount: 145000,
    currency: 'INR',
    status: 'confirmed',
    payment_status: 'paid',
    items: [
      { product_name: 'Handcrafted Dancing Shiva Bronze-Timber Sculpture', quantity: 1, unit_price: 145000 }
    ]
  };

  const payload = {
    event: eventName,
    test: true,
    timestamp: new Date().toISOString(),
    source: 'Irisjev Wooden Crafts Webhook Gateway',
    data: sampleData,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Irisjev-Event': eventName,
      'X-Irisjev-Test': 'true',
      'X-Irisjev-Signature': secretKey ? `sha256=${secretKey}` : 'test_secret',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const body = await res.text();

    return {
      success: res.ok,
      status: res.status,
      body: body.slice(0, 1500),
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      status: 0,
      body: '',
      durationMs,
      error: err?.message || 'Failed to connect to the target webhook URL. Please ensure CORS or server connectivity.'
    };
  }
}
