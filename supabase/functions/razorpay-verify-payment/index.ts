// Supabase Edge Function: razorpay-verify-payment
// Verifies HMAC SHA-256 signature, updates order status to 'paid', and logs transaction to webhook_logs
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function verifyHmacSha256(secret: string, data: string, expectedSignature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || 'kjtTkV7lqaCx0wUMQgUgDoKO';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://kimkttzdxnkekcoeuvop.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, order_number } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required Razorpay payment parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payloadToVerify = `${razorpay_order_id}|${razorpay_payment_id}`;
    const isValid = await verifyHmacSha256(keySecret, payloadToVerify, razorpay_signature);

    if (!isValid) {
      console.error('Signature verification failed for order:', razorpay_order_id);
      return new Response(
        JSON.stringify({ error: 'Payment signature verification failed', verified: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If verification succeeded, update database order AND insert audit log into webhook_logs
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const updateData: any = {
        status: 'paid',
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_info: `Razorpay Verified (${razorpay_payment_id})`,
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('orders').update(updateData);
      if (order_id) {
        query = query.eq('id', order_id);
      } else if (razorpay_order_id) {
        query = query.eq('razorpay_order_id', razorpay_order_id);
      } else if (order_number) {
        query = query.eq('order_number', order_number);
      }

      const { data: updatedOrder, error: orderErr } = await query.select();
      if (orderErr) {
        console.error('Failed to update order status in DB:', orderErr);
      }

      // Record in webhook_logs table so every payment is tracked and visible in Supabase dashboard
      const { error: logErr } = await supabase.from('webhook_logs').insert([{
        event_type: 'payment.verified',
        razorpay_order_id,
        razorpay_payment_id,
        payload: {
          event: 'payment.verified',
          order_id,
          order_number: order_number || updatedOrder?.[0]?.order_number,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          verified_at: new Date().toISOString(),
          status: 'paid',
        },
        status: 'processed',
        error_message: null,
      }]);

      if (logErr) {
        console.error('Error writing to webhook_logs:', logErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        message: 'Payment verified and captured successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
