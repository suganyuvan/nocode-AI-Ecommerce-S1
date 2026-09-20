// Supabase Edge Function: whatsapp-webhook
// Meta WhatsApp Cloud API Production Webhook Handler
// Handles GET (Meta Verification Challenge) & POST (Delivery Status Updates & Inbound Customer Messages)
import { createClient } from "jsr:@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'swarna_whatsapp_verify_token_2026';

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. META WEBHOOK VERIFICATION (GET REQUEST)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log(`Meta Webhook Verification GET Request. Mode: ${mode}, Token: ${token}`);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Meta Webhook Verification SUCCESSFUL!');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      console.error('Meta Webhook Verification FAILED. Token mismatch.');
      return new Response('Forbidden: Verification token mismatch', { status: 403 });
    }
  }

  // 2. INBOUND WEBHOOK EVENTS & STATUS RECEIPTS (POST REQUEST)
  if (req.method === 'POST') {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://kimkttzdxnkekcoeuvop.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const body = await req.json();
      console.log('Meta Webhook Event Body:', JSON.stringify(body));

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value) {
        // Handle Delivery Status Updates (sent, delivered, read, failed)
        if (value.statuses && value.statuses.length > 0) {
          for (const statusObj of value.statuses) {
            const recipientPhone = statusObj.recipient_id;
            const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
            const messageId = statusObj.id; // Meta wamid
            const errors = statusObj.errors ? JSON.stringify(statusObj.errors) : null;

            console.log(`WhatsApp Status Update: Message ${messageId} -> ${status} for +${recipientPhone}`);

            // TASK 5: Update existing audit log record matching Meta wamid (message_id)
            const { data, error } = await supabase
              .from('whatsapp_logs')
              .update({
                status: status,
                error_details: errors,
                payload: statusObj,
              })
              .eq('message_id', messageId)
              .select();

            if (error) {
              console.error('Error updating whatsapp_logs by message_id:', error);
            }

            // If no record matched (e.g. external dispatch or direct Meta message), insert new row
            if (!data || data.length === 0) {
              await supabase.from('whatsapp_logs').insert([{
                recipient_phone: recipientPhone,
                message_type: 'webhook_status_update',
                status: status,
                message_id: messageId,
                error_details: errors,
                payload: statusObj,
              }]);
            }
          }
        }

        // Handle Incoming Customer Messages
        if (value.messages && value.messages.length > 0) {
          for (const msgObj of value.messages) {
            const senderPhone = msgObj.from;
            const messageType = msgObj.type;
            const messageBody = msgObj.text?.body || `[${messageType}]`;
            const messageId = msgObj.id;

            console.log(`Incoming WhatsApp Message from +${senderPhone}: "${messageBody}"`);

            // Insert audit log for incoming customer reply
            await supabase.from('whatsapp_logs').insert([{
              recipient_phone: senderPhone,
              message_type: 'inbound_customer_reply',
              status: 'received',
              message_id: messageId,
              payload: { text: messageBody, type: messageType, raw: msgObj },
            }]);
          }
        }
      }
    } catch (err: any) {
      console.error('Error processing Meta Webhook payload:', err);
    }

    // Always return 200 OK to Meta so it acknowledges receipt
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
});
