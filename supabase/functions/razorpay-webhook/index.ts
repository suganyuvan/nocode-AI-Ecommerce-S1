// Supabase Edge Function: razorpay-webhook
// Fallback Webhook System for Razorpay events (payment.captured, order.paid, payment.failed)
import { createClient } from "jsr:@supabase/supabase-js@2";

async function verifyWebhookSignature(secret: string, rawBody: string, expectedSignature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return generatedSignature.toLowerCase() === expectedSignature.toLowerCase();
}

Deno.serve(async (req: Request) => {
  // Return OK on GET/HEAD if health-checked
  if (req.method === 'GET' || req.method === 'HEAD') {
    return new Response(JSON.stringify({ status: 'active', service: 'razorpay-webhook' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://kimkttzdxnkekcoeuvop.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const signatureHeader = req.headers.get('x-razorpay-signature') || '';
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET') || 'kjtTkV7lqaCx0wUMQgUgDoKO';

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), { status: 400 });
  }

  // Verify Signature
  let isSignatureValid = false;
  if (signatureHeader && webhookSecret) {
    isSignatureValid = await verifyWebhookSignature(webhookSecret, rawBody, signatureHeader);
  } else {
    // If testing without signature header, log warning
    console.warn('Webhook received without signature header or webhook secret');
  }

  let eventPayload: any = null;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }

  const event = eventPayload?.event || 'unknown';
  const paymentEntity = eventPayload?.payload?.payment?.entity;
  const orderEntity = eventPayload?.payload?.order?.entity;

  const rzpOrderId = paymentEntity?.order_id || orderEntity?.id || null;
  const rzpPaymentId = paymentEntity?.id || null;
  const paymentMethod = paymentEntity?.method || 'online';
  const notes = paymentEntity?.notes || orderEntity?.notes || {};
  const orderNumber = notes?.order_number || null;

  console.log(`Received Razorpay webhook event: ${event}, Order ID: ${rzpOrderId}, Payment ID: ${rzpPaymentId}`);

  let processStatus = 'processed';
  let errorMessage: string | null = null;

  try {
    if (event === 'payment.captured' || event === 'order.paid') {
      const updateData: any = {
        status: 'paid',
        payment_status: 'captured',
        webhook_verified: true,
        updated_at: new Date().toISOString(),
      };

      if (rzpPaymentId) {
        updateData.razorpay_payment_id = rzpPaymentId;
        updateData.payment_info = `Razorpay (${paymentMethod.toUpperCase()}) - [Webhook Fallback]`;
      }
      if (rzpOrderId) {
        updateData.razorpay_order_id = rzpOrderId;
      }

      // Match order by razorpay_order_id OR order_number
      let query = supabase.from('orders').update(updateData);
      if (rzpOrderId) {
        query = query.eq('razorpay_order_id', rzpOrderId);
      } else if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      }

      const { data, error } = await query.select();
      if (error) {
        console.error('Error updating order on webhook payment.captured:', error);
        errorMessage = error.message;
        processStatus = 'order_update_failed';
      } else {
        console.log('Successfully updated order from webhook:', data);
      }
    } else if (event === 'payment.failed') {
      const updateData: any = {
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('orders').update(updateData);
      if (rzpOrderId) {
        query = query.eq('razorpay_order_id', rzpOrderId);
      } else if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      }

      await query;
      console.log(`Payment failed recorded for order ${rzpOrderId || orderNumber}`);
    }

    // Log the webhook in webhook_logs table for audit & fallback verification
    await supabase.from('webhook_logs').insert([{
      event_type: event,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      payload: eventPayload,
      status: processStatus,
      error_message: errorMessage || (isSignatureValid ? null : 'Unverified signature'),
    }]);

  } catch (dbErr: any) {
    console.error('Database error processing webhook:', dbErr);
  }

  // Always return 200 to Razorpay so it doesn't retry indefinitely
  return new Response(
    JSON.stringify({ received: true, event, valid_signature: isSignatureValid }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
