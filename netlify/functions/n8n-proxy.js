/**
 * Netlify Function: n8n-proxy
 * Securely proxies outgoing webhook requests to n8n webhooks server-side, eliminating browser CORS errors.
 * 
 * Server-side Environment Variables optional/recommended:
 * - N8N_WEBHOOK_URL
 * - N8N_WEBHOOK_SECRET
 */

export const handler = async (event, context) => {
  // CORS Headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Irisjev-Event, X-Irisjev-Delivery, X-Irisjev-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Restrict to POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    let bodyData = {};
    if (event.body) {
      bodyData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    // Determine target webhook URL from payload or server environment
    const targetUrl = bodyData.targetUrl || process.env.N8N_WEBHOOK_URL;
    const payload = bodyData.payload || bodyData.data || bodyData;
    const eventName = bodyData.eventName || 'event';
    const customHeaders = bodyData.headers || {};

    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      console.error('[n8n-proxy] Missing or invalid target webhook URL.');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'n8n webhook URL is not configured.',
        }),
      };
    }

    // Build headers to send server-side to n8n webhook
    const forwardHeaders = {
      'Content-Type': 'application/json',
      'X-Irisjev-Event': eventName,
      'X-Irisjev-Delivery': `del-${Date.now()}`,
      ...customHeaders,
    };

    if (process.env.N8N_WEBHOOK_SECRET) {
      forwardHeaders['X-Irisjev-Signature'] = `sha256=${process.env.N8N_WEBHOOK_SECRET}`;
    }

    // Execute server-to-server request to n8n webhook
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await res.text();
    const safeBody = responseText.slice(0, 2000);

    return {
      statusCode: res.ok ? 200 : res.status,
      headers,
      body: JSON.stringify({
        success: res.ok,
        status: res.status,
        body: safeBody,
      }),
    };
  } catch (err) {
    console.error('[n8n-proxy Exception]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        status: 0,
        error: 'Unable to reach n8n webhook. Request failed or timed out.',
      }),
    };
  }
};
