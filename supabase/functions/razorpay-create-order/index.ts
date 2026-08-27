// Supabase Edge Function: razorpay-create-order
// Creates a Razorpay Order with specified amount and currency

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_TSSXHdcPyRcrR8';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || 'kjtTkV7lqaCx0wUMQgUgDoKO';

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: 'Razorpay credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, currency = 'INR', receipt, notes } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Amount must be an integer in smallest currency sub-unit (paise for INR)
    let amountInPaise = Math.round(Number(amount));

    // Razorpay test mode has a maximum limit of ₹5,00,000 (50,000,000 paise).
    // We cap it here to allow test payments to proceed without error.
    if (keyId.startsWith('rzp_test_') && amountInPaise > 50000000) {
      console.warn(`Capping test mode amount from ${amountInPaise} to 50000000 paise`);
      amountInPaise = 50000000;
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    const orderData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error('Razorpay Order creation error:', orderData);
      return new Response(
        JSON.stringify({ error: orderData.error?.description || 'Failed to create Razorpay order', details: orderData }),
        { status: razorpayResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: keyId,
        order: orderData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unexpected error creating Razorpay order:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
