/**
 * Netlify Function: whatsapp-send
 * Securely proxies Meta WhatsApp Cloud API requests server-side.
 * 
 * Server-side Environment Variables required:
 * - META_WHATSAPP_ACCESS_TOKEN (Required)
 * - META_WHATSAPP_PHONE_NUMBER_ID (Optional, defaults to 1442648035597125)
 * - META_WHATSAPP_API_VERSION (Optional, defaults to v21.0)
 */

exports.handler = async function (event, context) {
  // CORS Headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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

    const payload = bodyData.payload || bodyData;
    const customPhoneId = bodyData.customPhoneId;

    // Retrieve secret token from server environment only
    const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneId = customPhoneId || process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1442648035597125';
    const apiVersion = process.env.META_WHATSAPP_API_VERSION || 'v21.0';

    if (!token) {
      console.error('[whatsapp-send] Missing META_WHATSAPP_ACCESS_TOKEN in server environment.');
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'WhatsApp service is temporarily unavailable. (Server access token missing)',
        }),
      };
    }

    // Validate payload and recipient phone number
    if (!payload || !payload.to) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid recipient phone number',
        }),
      };
    }

    // Clean phone number format
    let cleanPhone = String(payload.to).replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    // Prevent sending messages to business sender number itself
    if (cleanPhone === '918608449937') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Cannot send WhatsApp Cloud API message to the business sender number itself (+91 8608449937). Please select a customer phone number.',
        }),
      };
    }

    payload.to = cleanPhone;

    // Construct Meta Graph API URL
    const metaUrl = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

    // Perform secure server-side call to Meta Graph API
    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[whatsapp-send Meta Error]', response.status, JSON.stringify(responseData));

      let safeErrorMessage = 'Unable to send the message. Please try again.';
      if (response.status === 401) {
        safeErrorMessage = 'WhatsApp service authentication error. Please verify server access token configuration.';
      } else if (responseData?.error?.message) {
        safeErrorMessage = responseData.error.message;
      }

      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          recipientPhone: cleanPhone,
          error: safeErrorMessage,
          rawResponse: responseData,
        }),
      };
    }

    const messageId = responseData?.messages?.[0]?.id || 'wa-msg-ok';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId,
        recipientPhone: cleanPhone,
        rawResponse: responseData,
      }),
    };
  } catch (err) {
    console.error('[whatsapp-send Exception]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'WhatsApp service is temporarily unavailable.',
      }),
    };
  }
};
