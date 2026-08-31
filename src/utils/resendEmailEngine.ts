import { supabase } from './supabaseClient';

export interface EmailSettings {
  id?: number;
  resend_api_key: string;
  from_email: string;
  from_name: string;
  admin_email: string;
  order_notifications_enabled: boolean;
  shipping_notifications_enabled: boolean;
  ticket_notifications_enabled: boolean;
  inquiry_notifications_enabled: boolean;
  welcome_discount_enabled: boolean;
}

export interface EmailLog {
  id?: string;
  to_email: string;
  from_email?: string;
  subject: string;
  email_type: string;
  status: 'sent' | 'failed';
  resend_id?: string;
  error_message?: string;
  metadata?: any;
  created_at?: string;
}

export const DEFAULT_RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
export const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL || 'suganyyvi77@gmail.com';
export const DEFAULT_FROM_EMAIL = import.meta.env.VITE_RESEND_SENDER_EMAIL || 'send@irisjev.in';
export const DEFAULT_FROM_NAME = 'Irisjev Wooden Crafts';

/**
 * Fetch current email notification settings from Supabase
 */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data && !error) {
      return {
        resend_api_key: data.resend_api_key || DEFAULT_RESEND_KEY,
        from_email: data.from_email || DEFAULT_FROM_EMAIL,
        from_name: data.from_name || DEFAULT_FROM_NAME,
        admin_email: data.admin_email || DEFAULT_ADMIN_EMAIL,
        order_notifications_enabled: data.order_notifications_enabled ?? true,
        shipping_notifications_enabled: data.shipping_notifications_enabled ?? true,
        ticket_notifications_enabled: data.ticket_notifications_enabled ?? true,
        inquiry_notifications_enabled: data.inquiry_notifications_enabled ?? true,
        welcome_discount_enabled: data.welcome_discount_enabled ?? true,
      };
    }
  } catch (e) {
    console.warn('Could not fetch email settings from DB, using defaults:', e);
  }

  return {
    resend_api_key: DEFAULT_RESEND_KEY,
    from_email: DEFAULT_FROM_EMAIL,
    from_name: DEFAULT_FROM_NAME,
    admin_email: DEFAULT_ADMIN_EMAIL,
    order_notifications_enabled: true,
    shipping_notifications_enabled: true,
    ticket_notifications_enabled: true,
    inquiry_notifications_enabled: true,
    welcome_discount_enabled: true,
  };
}

/**
 * Core function to send an email via Resend REST API and log to Supabase
 */
export async function sendResendEmail({
  to,
  subject,
  html,
  emailType = 'custom',
  metadata = {},
  apiKeyOverride
}: {
  to: string | string[];
  subject: string;
  html: string;
  emailType?: string;
  metadata?: any;
  apiKeyOverride?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const settings = await getEmailSettings();
  const apiKey = apiKeyOverride || settings.resend_api_key || DEFAULT_RESEND_KEY;
  const fromAddress = `${settings.from_name || DEFAULT_FROM_NAME} <${settings.from_email || DEFAULT_FROM_EMAIL}>`;

  // Standardize recipient array
  const recipients = Array.isArray(to) ? to : [to];
  const primaryRecipient = recipients[0] || settings.admin_email;

  try {
    let data: any = null;
    let isSuccess = false;
    let errorMessage = '';

    // Primary Dispatch: Use Supabase Edge Function (Guaranteed 0 CORS errors across all origins)
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('resend-send-email', {
        body: {
          from: fromAddress,
          to: recipients,
          subject: subject,
          html: html,
          apiKey: apiKey,
        },
      });

      if (!edgeError && edgeData?.id) {
        data = edgeData;
        isSuccess = true;
      } else if (edgeError) {
        errorMessage = edgeError.message || JSON.stringify(edgeError);
      }
    } catch (edgeErr: any) {
      errorMessage = edgeErr?.message || 'Edge function relay failed';
    }

    // Fallback Dispatch: If Edge function was unreachable, try local Vite proxy or direct endpoint
    if (!isSuccess) {
      try {
        const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? '/api/resend/emails'
          : 'https://api.resend.com/emails';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipients,
            subject: subject,
            html: html,
          }),
        });

        const resData = await response.json();
        if (response.ok && resData.id) {
          data = resData;
          isSuccess = true;
        } else {
          errorMessage = resData.message || `Resend Error ${response.status}: ${JSON.stringify(resData)}`;
        }
      } catch (fetchErr: any) {
        if (!errorMessage) errorMessage = fetchErr?.message || 'Network fetch failed';
      }
    }

    if (isSuccess && data?.id) {
      // Log successful delivery to Supabase
      try {
        await supabase.from('email_logs').insert([{
          to_email: Array.isArray(to) ? to.join(', ') : to,
          from_email: fromAddress,
          subject: subject,
          email_type: emailType,
          status: 'sent',
          resend_id: data.id,
          metadata: metadata,
        }]);
      } catch (logErr) {
        console.warn('Failed to insert email log in Supabase:', logErr);
      }

      return { success: true, id: data.id };
    } else {
      const errorMsg = data?.message || errorMessage || 'Resend delivery failed';
      
      // Log failed delivery to Supabase
      try {
        await supabase.from('email_logs').insert([{
          to_email: Array.isArray(to) ? to.join(', ') : to,
          from_email: fromAddress,
          subject: subject,
          email_type: emailType,
          status: 'failed',
          error_message: errorMsg,
          metadata: metadata,
        }]);
      } catch (logErr) {
        console.warn('Failed to insert error log in Supabase:', logErr);
      }

      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    const errorMsg = err?.message || 'Network exception while connecting to Resend API';
    try {
      await supabase.from('email_logs').insert([{
        to_email: Array.isArray(to) ? to.join(', ') : to,
        from_email: fromAddress,
        subject: subject,
        email_type: emailType,
        status: 'failed',
        error_message: errorMsg,
        metadata: metadata,
      }]);
    } catch (logErr) {
      console.warn('Failed to insert exception log in Supabase:', logErr);
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Base Email Wrapper with Irisjev Luxury Gold & Obsidian Styling
 */
function wrapInLuxuryEmailTemplate(contentHtml: string, previewText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Irisjev Wooden Crafts</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f1413; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #f4f2ee; }
    .container { max-width: 600px; margin: 20px auto; background-color: #17201e; border: 1px solid #283634; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #17201e 0%, #0d1312 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #fed65b; }
    .brand-title { color: #fed65b; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .brand-sub { color: #a19f99; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #d6d3cd; }
    .footer { background-color: #0d1312; padding: 24px; text-align: center; font-size: 11px; color: #747878; border-top: 1px solid #232e2c; }
    .btn-gold { display: inline-block; background-color: #fed65b; color: #111615; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
    .card { background-color: #1c2624; border: 1px solid #2a3a37; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th { text-align: left; padding: 8px; color: #fed65b; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #2a3a37; }
    .table td { padding: 10px 8px; border-bottom: 1px solid #222e2b; font-size: 13px; color: #ece9e2; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; background-color: rgba(254, 214, 91, 0.15); color: #fed65b; border: 1px solid rgba(254, 214, 91, 0.3); }
  </style>
</head>
<body>
  <div style="display: none; font-size: 1px; color: #333333; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">Irisjev Wooden Crafts</h1>
      <p class="brand-sub">Sacred Heritage & Fine Timber Masterpieces</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Irisjev Wooden Crafts • Swarna Craftsmanship Studio</p>
      <p style="margin: 0;">Madurai & Chennai, Tamil Nadu, India • Dedicated Concierge: support@irisjev.com</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * 1. Send Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(orderData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{ name: string; quantity: number; selectedTimber?: string; unitPrice: number }>;
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  shippingCharge?: number;
  gstAmount?: number;
  paymentMethod?: string;
  shippingAddress?: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.order_notifications_enabled) return;

  const itemsRows = orderData.items.map(item => `
    <tr>
      <td>
        <strong>${item.name}</strong>
        ${item.selectedTimber ? `<br><span style="font-size: 11px; color: #fed65b;">Timber: ${item.selectedTimber}</span>` : ''}
      </td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${(item.unitPrice * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Order Confirmation #${orderData.orderNumber}</h2>
    <p>Dear <strong>${orderData.customerName}</strong>,</p>
    <p>Thank you for commissioning your heritage wooden masterpiece with Irisjev Wooden Crafts. We are delighted to confirm that your order has been received and initialized in our carving atelier.</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span class="badge">Status: Confirmed</span>
        <span style="color: #a19f99; font-size: 12px;">Payment: ${orderData.paymentMethod || 'Prepaid'}</span>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Masterpiece Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="border-top: 1px solid #2a3a37; padding-top: 12px; margin-top: 12px; text-align: right; font-size: 13px;">
        ${orderData.discountAmount ? `<p style="margin: 4px 0; color: #4ade80;">Discount Applied: -₹${orderData.discountAmount.toLocaleString('en-IN')}</p>` : ''}
        ${orderData.shippingCharge !== undefined ? `<p style="margin: 4px 0; color: #a19f99;">Shipping: ${orderData.shippingCharge === 0 ? 'FREE' : `₹${orderData.shippingCharge}`}</p>` : ''}
        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #fed65b;">
          Total Amount: ₹${orderData.totalAmount.toLocaleString('en-IN')}
        </p>
      </div>
    </div>

    ${orderData.shippingAddress ? `
      <div style="background-color: #17201e; border-left: 3px solid #fed65b; padding: 12px 16px; margin: 20px 0; font-size: 12px;">
        <strong style="color: #fed65b;">Delivery Destination:</strong><br>
        <span style="color: #ece9e2;">${orderData.shippingAddress}</span>
      </div>
    ` : ''}

    <p style="font-size: 12px; color: #a19f99;">
      Our master wood artisans will oversee the final inspection, bespoke seasoning, and velvet protective crating before dispatch. You will receive real-time courier tracking codes as soon as your parcel ships.
    </p>

    <div style="text-align: center;">
      <a href="https://irisjev.com" class="btn-gold">Track Order on Irisjev</a>
    </div>
  `;

  const fullHtml = wrapInLuxuryEmailTemplate(htmlContent, `Order #${orderData.orderNumber} confirmed with Irisjev Wooden Crafts`);

  // 1. Send to Customer
  if (orderData.customerEmail) {
    await sendResendEmail({
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderNumber} - Irisjev Wooden Crafts`,
      html: fullHtml,
      emailType: 'order_confirmation',
      metadata: { order_number: orderData.orderNumber, total: orderData.totalAmount }
    });
  }

  // 2. Also send alert to Admin
  if (settings.admin_email && settings.admin_email !== orderData.customerEmail) {
    const adminAlertHtml = wrapInLuxuryEmailTemplate(`
      <h2 style="color: #fed65b; margin-top: 0;">✨ New Order Alert #${orderData.orderNumber}</h2>
      <p>A new order has been received on the Irisjev store!</p>
      <div class="card">
        <p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
        <p><strong>Phone:</strong> ${orderData.customerPhone || 'N/A'}</p>
        <p><strong>Total Value:</strong> ₹${orderData.totalAmount.toLocaleString('en-IN')}</p>
        <p><strong>Payment Mode:</strong> ${orderData.paymentMethod || 'Prepaid'}</p>
        <p><strong>Items:</strong> ${orderData.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
      </div>
      <div style="text-align: center;">
        <a href="https://irisjev.com/admin/orders" class="btn-gold">Open in Admin Orders</a>
      </div>
    `, `New Order #${orderData.orderNumber} - ₹${orderData.totalAmount.toLocaleString('en-IN')}`);

    await sendResendEmail({
      to: settings.admin_email,
      subject: `[NEW ORDER] #${orderData.orderNumber} - ₹${orderData.totalAmount.toLocaleString('en-IN')}`,
      html: adminAlertHtml,
      emailType: 'admin_order_alert',
      metadata: { order_number: orderData.orderNumber }
    });
  }
}

/**
 * 2. Send Order Shipped & AWB Tracking Email
 */
export async function sendOrderShippedEmail(shipmentData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  fulfillmentNote?: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.shipping_notifications_enabled) return;

  const htmlContent = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Your Order Has Been Dispatched! 🚚</h2>
    <p>Dear <strong>${shipmentData.customerName}</strong>,</p>
    <p>Great news! Your handcrafted wooden masterpiece for Order <strong>#${shipmentData.orderNumber}</strong> has been carefully packed, quality-inspected, and handed over to our premier logistics partner.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span class="badge">Shipment Status: In Transit</span>
        <span style="color: #fed65b; font-weight: bold; font-size: 13px;">${shipmentData.courierName}</span>
      </div>

      <div style="margin: 16px 0; background-color: #0d1312; padding: 14px; border-radius: 8px; border: 1px solid #232e2c;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #a19f99; text-transform: uppercase; letter-spacing: 1px;">Airway Bill / Tracking Code</p>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #fed65b; font-family: monospace;">${shipmentData.trackingNumber}</p>
      </div>

      ${shipmentData.estimatedDelivery ? `
        <p style="margin: 8px 0; font-size: 13px; color: #ece9e2;">
          <strong>Estimated Delivery:</strong> <span style="color: #4ade80;">${shipmentData.estimatedDelivery}</span>
        </p>
      ` : ''}

      ${shipmentData.fulfillmentNote ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #2a3a37; font-size: 12px; color: #d6d3cd;">
          <strong style="color: #fed65b;">Logistics Note:</strong> ${shipmentData.fulfillmentNote}
        </div>
      ` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${shipmentData.trackingUrl || `https://irisjev.com/track`}" class="btn-gold">Track Live Consignment</a>
    </div>
  `;

  const fullHtml = wrapInLuxuryEmailTemplate(htmlContent, `Order #${shipmentData.orderNumber} Dispatched - AWB ${shipmentData.trackingNumber}`);

  if (shipmentData.customerEmail) {
    await sendResendEmail({
      to: shipmentData.customerEmail,
      subject: `Order #${shipmentData.orderNumber} Dispatched - Tracking AWB: ${shipmentData.trackingNumber}`,
      html: fullHtml,
      emailType: 'order_shipped',
      metadata: { order_number: shipmentData.orderNumber, tracking_number: shipmentData.trackingNumber }
    });
  }
}

/**
 * 3. Send Customer Support Ticket Creation Email
 */
export async function sendSupportTicketCreatedEmail(ticketData: {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  orderNumber?: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.ticket_notifications_enabled) return;

  const htmlContent = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Support Inquiry Received #${ticketData.ticketNumber}</h2>
    <p>Dear <strong>${ticketData.customerName}</strong>,</p>
    <p>We have received your support inquiry regarding <strong>"${ticketData.subject}"</strong>. Our dedicated concierge team is reviewing your request.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <span class="badge">Ticket Status: In Review</span>
        <span style="color: #fed65b; font-size: 12px; font-weight: bold;">Priority: ${ticketData.priority}</span>
      </div>
      <p style="margin: 6px 0; font-size: 13px;"><strong>Category:</strong> ${ticketData.category}</p>
      ${ticketData.orderNumber ? `<p style="margin: 6px 0; font-size: 13px;"><strong>Linked Order:</strong> #${ticketData.orderNumber}</p>` : ''}
      <div style="margin-top: 12px; padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #d6d3cd; border: 1px solid #232e2c;">
        ${ticketData.description}
      </div>
    </div>

    <p style="font-size: 12px; color: #a19f99;">
      You can track and reply to this ticket directly within your <a href="https://irisjev.com" style="color: #fed65b;">Irisjev Account Portal</a>.
    </p>
  `;

  const fullHtml = wrapInLuxuryEmailTemplate(htmlContent, `Support Ticket #${ticketData.ticketNumber} Received`);

  // 1. Send confirmation to Customer
  if (ticketData.customerEmail) {
    await sendResendEmail({
      to: ticketData.customerEmail,
      subject: `Support Ticket #${ticketData.ticketNumber} Received - Irisjev Concierge`,
      html: fullHtml,
      emailType: 'ticket_created',
      metadata: { ticket_number: ticketData.ticketNumber }
    });
  }

  // 2. Alert Admin
  if (settings.admin_email) {
    const adminTicketHtml = wrapInLuxuryEmailTemplate(`
      <h2 style="color: #fed65b; margin-top: 0;">🎫 New Customer Support Ticket #${ticketData.ticketNumber}</h2>
      <div class="card">
        <p><strong>Customer:</strong> ${ticketData.customerName} (${ticketData.customerEmail})</p>
        <p><strong>Category:</strong> ${ticketData.category}</p>
        <p><strong>Priority:</strong> <span style="color: #ef4444; font-weight: bold;">${ticketData.priority}</span></p>
        <p><strong>Subject:</strong> ${ticketData.subject}</p>
        <div style="margin-top: 12px; padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #ece9e2;">
          ${ticketData.description}
        </div>
      </div>
      <div style="text-align: center;">
        <a href="https://irisjev.com/admin/support-tickets" class="btn-gold">Reply to Ticket in Admin</a>
      </div>
    `, `New Support Ticket #${ticketData.ticketNumber} (${ticketData.priority})`);

    await sendResendEmail({
      to: settings.admin_email,
      subject: `[SUPPORT TICKET] #${ticketData.ticketNumber} - ${ticketData.subject}`,
      html: adminTicketHtml,
      emailType: 'admin_ticket_alert',
      metadata: { ticket_number: ticketData.ticketNumber }
    });
  }
}

/**
 * 4. Send Support Ticket Concierge Response Email
 */
export async function sendSupportTicketResponseEmail(responseData: {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  adminResponse: string;
  status: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.ticket_notifications_enabled) return;

  const htmlContent = `
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Concierge Response to Ticket #${responseData.ticketNumber}</h2>
    <p>Dear <strong>${responseData.customerName}</strong>,</p>
    <p>Our concierge team has provided an update regarding your inquiry <strong>"${responseData.subject}"</strong>:</p>

    <div class="card" style="border-left: 3px solid #fed65b;">
      <span class="badge" style="margin-bottom: 8px;">Status: ${responseData.status.toUpperCase()}</span>
      <div style="margin-top: 8px; font-size: 14px; color: #ffffff; line-height: 1.7;">
        ${responseData.adminResponse}
      </div>
    </div>

    <p style="font-size: 12px; color: #a19f99;">
      If you need further assistance, you can reply directly from your Irisjev Account or reply to this message.
    </p>

    <div style="text-align: center;">
      <a href="https://irisjev.com" class="btn-gold">View in Account Portal</a>
    </div>
  `;

  const fullHtml = wrapInLuxuryEmailTemplate(htmlContent, `Update on Ticket #${responseData.ticketNumber}`);

  if (responseData.customerEmail) {
    await sendResendEmail({
      to: responseData.customerEmail,
      subject: `Update on Support Ticket #${responseData.ticketNumber} - Irisjev Concierge`,
      html: fullHtml,
      emailType: 'ticket_response',
      metadata: { ticket_number: responseData.ticketNumber, status: responseData.status }
    });
  }
}

/**
 * 5. Send Test Email (Direct Verification via Resend API)
 */
export async function sendTestEmail(targetEmail: string, customSubject?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const subject = customSubject || 'Hello from Irisjev Wooden Crafts - Resend Notification Engine Active';
  const htmlContent = wrapInLuxuryEmailTemplate(`
    <h2 style="color: #fed65b; margin-top: 0;">⚡ Resend Email Notification Gateway Active</h2>
    <p>Hello! This is a real-time verification email from the <strong>Irisjev Wooden Crafts</strong> notification engine.</p>
    
    <div class="card">
      <p style="margin: 4px 0;"><strong>Delivered via:</strong> Resend API Gateway</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #4ade80; font-weight: bold;">Verified & Operational</span></p>
    </div>

    <p style="font-size: 12px; color: #a19f99;">
      All automated customer notifications (Order Confirmations, Shipping Tracking Codes, and Customer Support Tickets) are now active and delivering through Resend.
    </p>
  `, 'Resend Email Notification Gateway Active');

  return await sendResendEmail({
    to: targetEmail,
    subject: subject,
    html: htmlContent,
    emailType: 'test_email',
    metadata: { test: true }
  });
}

/**
 * 6. Send Welcome 10% Discount Email to New Users
 */
export async function sendWelcomeDiscountEmail(userData: {
  customerName: string;
  customerEmail: string;
  couponCode?: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.welcome_discount_enabled) return;

  const code = userData.couponCode || 'WELCOME10';

  const htmlContent = `
    <div style="text-align: center; padding: 10px 0 20px 0;">
      <span class="badge" style="font-size: 11px; padding: 6px 16px;">Welcome to Irisjev Heritage</span>
      <h2 style="color: #fed65b; margin: 16px 0 8px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">
        Enjoy 10% Off Your First Masterpiece
      </h2>
      <p style="color: #d6d3cd; font-size: 14px; max-width: 480px; margin: 0 auto 20px auto;">
        Dear <strong>${userData.customerName}</strong>, welcome to the prestigious circle of Irisjev Wooden Crafts collectors.
      </p>
    </div>

    <div class="card" style="text-align: center; border: 2px dashed #fed65b; background-color: #17201e; padding: 28px 20px;">
      <p style="margin: 0 0 6px 0; font-size: 11px; color: #a19f99; text-transform: uppercase; letter-spacing: 2px;">Your Exclusive Welcome Voucher</p>
      <div style="display: inline-block; background-color: #0d1312; border: 1px solid #fed65b; padding: 12px 28px; border-radius: 12px; margin: 12px 0;">
        <span style="font-family: monospace; font-size: 26px; font-weight: bold; color: #fed65b; letter-spacing: 4px;">${code}</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #4ade80; font-weight: bold;">
        Save 10% Instantly On Any Sacred Sculpture or Custom Timber Commission
      </p>
    </div>

    <div style="background-color: #1c2624; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h4 style="color: #ffffff; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Why Irisjev Heritage?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #a19f99; font-size: 12px; line-height: 1.8;">
        <li>Master Sthapathi hand-carved precision following Shilpa Shastras</li>
        <li>100% sustainably harvested Teakwood, Rosewood, and Sandalwood</li>
        <li>Velvet-lined protective crating with insured global express delivery</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://irisjev.com" class="btn-gold">Explore The Collection & Claim 10%</a>
    </div>
  `;

  const fullHtml = wrapInLuxuryEmailTemplate(htmlContent, `Welcome to Irisjev - Here is your 10% OFF coupon code: ${code}`);

  if (userData.customerEmail) {
    await sendResendEmail({
      to: userData.customerEmail,
      subject: `Welcome to Irisjev Wooden Crafts - Your 10% Welcome Gift (${code})`,
      html: fullHtml,
      emailType: 'welcome_discount',
      metadata: { coupon_code: code }
    });
  }
}

/**
 * 7. Send Contact & Bespoke Inquiry Email Alert
 */
export async function sendContactInquiryEmail(inquiryData: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  inquiryType?: string;
}) {
  const settings = await getEmailSettings();
  if (!settings.inquiry_notifications_enabled) return;

  const type = inquiryData.inquiryType || 'General Inquiry / Contact Form';

  // 1. Send confirmation to Customer
  const customerHtml = wrapInLuxuryEmailTemplate(`
    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">We Have Received Your Inquiry</h2>
    <p>Dear <strong>${inquiryData.name}</strong>,</p>
    <p>Thank you for reaching out to Irisjev Wooden Crafts. Our bespoke craftsmanship specialists have received your inquiry regarding <strong>"${inquiryData.subject || type}"</strong>.</p>

    <div class="card">
      <span class="badge" style="margin-bottom: 8px;">Inquiry Type: ${type}</span>
      <p style="margin: 8px 0; font-size: 13px;"><strong>Your Message:</strong></p>
      <div style="padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #ece9e2; border: 1px solid #232e2c;">
        ${inquiryData.message}
      </div>
    </div>

    <p style="font-size: 12px; color: #a19f99;">
      A dedicated master artisan or support concierge will contact you shortly via email or WhatsApp to assist you.
    </p>
  `, `Inquiry Received - Irisjev Wooden Crafts`);

  if (inquiryData.email) {
    await sendResendEmail({
      to: inquiryData.email,
      subject: `Inquiry Received - Irisjev Wooden Crafts Concierge`,
      html: customerHtml,
      emailType: 'contact_inquiry_customer',
      metadata: { name: inquiryData.name, type }
    });
  }

  // 2. Alert Admin Inbox
  if (settings.admin_email) {
    const adminAlertHtml = wrapInLuxuryEmailTemplate(`
      <h2 style="color: #fed65b; margin-top: 0;">✨ New Contact / Bespoke Inquiry Alert</h2>
      <p>A new visitor inquiry has been submitted on the Irisjev storefront!</p>

      <div class="card">
        <p><strong>Name:</strong> ${inquiryData.name}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Phone:</strong> ${inquiryData.phone || 'N/A'}</p>
        <p><strong>Type:</strong> <span class="badge">${type}</span></p>
        <p><strong>Subject:</strong> ${inquiryData.subject || 'N/A'}</p>
        <div style="margin-top: 12px; padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #ece9e2; border: 1px solid #232e2c;">
          ${inquiryData.message}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="mailto:${inquiryData.email}" class="btn-gold">Reply Directly via Email</a>
      </div>
    `, `New Contact Inquiry from ${inquiryData.name}`);

    await sendResendEmail({
      to: settings.admin_email,
      subject: `[INQUIRY ALERT] ${inquiryData.name} - ${inquiryData.subject || type}`,
      html: adminAlertHtml,
      emailType: 'contact_inquiry_admin',
      metadata: { name: inquiryData.name, email: inquiryData.email }
    });
  }
}

/**
 * Metadata list and generator for Email Template Previews
 */
export const EMAIL_EVENT_LIST = [
  {
    id: 'order_confirmation',
    title: 'Order Confirmation',
    category: 'E-COMMERCE / SALES',
    recipient: 'Customer',
    icon: 'ShoppingBag',
    trigger: 'Customer successfully completes checkout on storefront',
    description: 'Detailed invoice with item breakdown, timber selection, pricing, shipping address, and tracking button.',
    subject: 'Order Confirmation #IRJ-8842 - Irisjev Wooden Crafts',
  },
  {
    id: 'admin_order_alert',
    title: 'Admin Order Alert',
    category: 'STORE / OPERATIONS',
    recipient: 'Store Owner / Admin',
    icon: 'BellRing',
    trigger: 'Triggered whenever a customer completes checkout',
    description: 'Instant notification to store administrator with buyer contact details and direct link to admin orders.',
    subject: '✨ New Order Alert #IRJ-8842 (₹49,410)',
  },
  {
    id: 'order_shipped',
    title: 'Order Status Update (Shipped)',
    category: 'LOGISTICS & TRACKING',
    recipient: 'Customer',
    icon: 'Truck',
    trigger: 'Admin updates order status to shipped / enters AWB',
    description: 'Informs customer that package is dispatched with courier name, AWB tracking ID, and live tracker CTA.',
    subject: 'Order #IRJ-8842 Dispatched - Tracking AWB: BLUEDART-88291029',
  },
  {
    id: 'welcome_discount',
    title: 'Lead Welcome & 10% Discount Coupon',
    category: 'MARKETING / GROWTH',
    recipient: 'New Subscriber / Lead',
    icon: 'Gift',
    trigger: 'New visitor registers or unlocks 10% promo popup',
    description: 'Warm welcome email with customized discount promo badge and instant shop CTA.',
    subject: 'Welcome to Irisjev Wooden Crafts - Your 10% Welcome Gift (WELCOME10)',
  },
  {
    id: 'ticket_created',
    title: 'Support Ticket Creation',
    category: 'CUSTOMER SUPPORT',
    recipient: 'Customer & Admin',
    icon: 'HelpCircle',
    trigger: 'Customer files support inquiry in account portal',
    description: 'Instant confirmation with ticket ID, priority indicator, and full inquiry copy.',
    subject: 'Support Ticket #TCK-4091 Received - Irisjev Concierge',
  },
  {
    id: 'ticket_response',
    title: 'Concierge Ticket Response',
    category: 'CUSTOMER SUPPORT',
    recipient: 'Customer',
    icon: 'MessageSquare',
    trigger: 'Admin posts reply to customer support ticket',
    description: 'Notifies customer with concierge response text and link to account portal.',
    subject: 'Update on Support Ticket #TCK-4091 - Irisjev Concierge',
  },
  {
    id: 'contact_inquiry',
    title: 'Contact & Bespoke Inquiry',
    category: 'LEADS & COMMISSIONS',
    recipient: 'Visitor & Admin',
    icon: 'Mail',
    trigger: 'Visitor submits bespoke mandapam / architectural query',
    description: 'Sends confirmation to visitor and instant alert email to admin inbox.',
    subject: 'Inquiry Received - Irisjev Wooden Crafts Concierge',
  },
  {
    id: 'test_email',
    title: 'System Resend Verification',
    category: 'SYSTEM HEALTH',
    recipient: 'Configured Test Email',
    icon: 'ShieldCheck',
    trigger: 'Triggered manually from Admin Resend Hub',
    description: 'Verification email testing direct Resend REST API connectivity and deliverability.',
    subject: 'Resend Notification Verification - Irisjev Wooden Crafts',
  },
];

export function getSampleEmailTemplateHtml(eventId: string): { subject: string; html: string } {
  switch (eventId) {
    case 'admin_order_alert': {
      const htmlContent = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background-color: rgba(254, 214, 91, 0.2); color: #fed65b; font-size: 11px; padding: 6px 16px;">✨ NEW STORE ORDER</span>
          <h2 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 22px;">New Order #IRJ-8842 Received</h2>
          <p style="color: #a19f99; font-size: 13px; margin: 0;">A customer just completed checkout on Irisjev Wooden Crafts.</p>
        </div>

        <div class="card" style="background-color: #17201e; border: 1px solid #283634;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #ece9e2;">
            <tr>
              <td style="padding: 8px 0; color: #a19f99; width: 120px;">Customer:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">Ananya Sharma</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a19f99;">Email:</td>
              <td style="padding: 8px 0; font-mono; color: #fed65b;">customer@example.com</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a19f99;">Phone:</td>
              <td style="padding: 8px 0;">+91 98765 43210</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a19f99;">Location:</td>
              <td style="padding: 8px 0;">Jubilee Hills, Hyderabad, Telangana</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #a19f99;">Payment Method:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #4ade80;">PREPAID (RAZORPAY UPI)</td>
            </tr>
            <tr style="border-top: 1px solid #2a3a37;">
              <td style="padding: 12px 0 4px 0; font-weight: bold; color: #ffffff;">Order Value:</td>
              <td style="padding: 12px 0 4px 0; font-size: 18px; font-weight: bold; color: #fed65b;">₹49,410 (2 items)</td>
            </tr>
          </table>

          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #232e2c; font-size: 12px; color: #d6d3cd;">
            <strong style="color: #fed65b;">Items Purchased:</strong><br>
            • Hand-Carved Ganesha Teak Shrine (Burma Teakwood) x1<br>
            • Brass Inlaid Puja Diya Stand (Rosewood) x2
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://irisjev.com/admin/orders" class="btn-gold">Open in Admin Orders Manager</a>
        </div>
      `;
      return {
        subject: '✨ New Order Alert #IRJ-8842 (₹49,410)',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'New Order #IRJ-8842 received - ₹49,410'),
      };
    }

    case 'order_confirmation': {
      const htmlContent = `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Order Confirmation #IRJ-8842</h2>
        <p>Dear <strong>Ananya Sharma</strong>,</p>
        <p>Thank you for commissioning your heritage wooden masterpiece with Irisjev Wooden Crafts. We are delighted to confirm that your order has been received and initialized in our carving atelier.</p>
        
        <div class="card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span class="badge">Status: Confirmed</span>
            <span style="color: #a19f99; font-size: 12px;">Payment: Razorpay UPI</span>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Masterpiece Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Hand-Carved Ganesha Teak Shrine</strong><br>
                  <span style="font-size: 11px; color: #fed65b;">Timber: Burma Teakwood</span>
                </td>
                <td style="text-align: center;">1</td>
                <td style="text-align: right;">₹48,500</td>
              </tr>
              <tr>
                <td>
                  <strong>Brass Inlaid Puja Diya Stand</strong><br>
                  <span style="font-size: 11px; color: #fed65b;">Timber: Rosewood</span>
                </td>
                <td style="text-align: center;">2</td>
                <td style="text-align: right;">₹6,400</td>
              </tr>
            </tbody>
          </table>

          <div style="border-top: 1px solid #2a3a37; padding-top: 12px; margin-top: 12px; text-align: right; font-size: 13px;">
            <p style="margin: 4px 0; color: #4ade80;">Discount Applied (WELCOME10): -₹5,490</p>
            <p style="margin: 4px 0; color: #a19f99;">Shipping: FREE (White-Glove Insured)</p>
            <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #fed65b;">
              Total Amount: ₹49,410
            </p>
          </div>
        </div>

        <div style="background-color: #17201e; border-left: 3px solid #fed65b; padding: 12px 16px; margin: 20px 0; font-size: 12px;">
          <strong style="color: #fed65b;">Delivery Destination:</strong><br>
          <span style="color: #ece9e2;">Plot 42, Jubilee Hills, Hyderabad, Telangana - 500033</span>
        </div>

        <p style="font-size: 12px; color: #a19f99;">
          Our master wood artisans will oversee the final inspection, bespoke seasoning, and velvet protective crating before dispatch.
        </p>

        <div style="text-align: center;">
          <a href="https://irisjev.com" class="btn-gold">Track Order on Irisjev</a>
        </div>
      `;
      return {
        subject: 'Order Confirmation #IRJ-8842 - Irisjev Wooden Crafts',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Order #IRJ-8842 confirmed with Irisjev Wooden Crafts'),
      };
    }

    case 'order_shipped': {
      const htmlContent = `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Your Order Has Been Dispatched! 🚚</h2>
        <p>Dear <strong>Ananya Sharma</strong>,</p>
        <p>Great news! Your handcrafted wooden masterpiece for Order <strong>#IRJ-8842</strong> has been carefully packed, quality-inspected, and handed over to our premier logistics partner.</p>

        <div class="card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span class="badge">Shipment Status: In Transit</span>
            <span style="color: #fed65b; font-weight: bold; font-size: 13px;">Blue Dart Express</span>
          </div>

          <div style="margin: 16px 0; background-color: #0d1312; padding: 14px; border-radius: 8px; border: 1px solid #232e2c;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #a19f99; text-transform: uppercase; letter-spacing: 1px;">Airway Bill / Tracking Code</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #fed65b; font-family: monospace;">BLUEDART-88291029</p>
          </div>

          <p style="margin: 8px 0; font-size: 13px; color: #ece9e2;">
            <strong>Estimated Delivery:</strong> <span style="color: #4ade80;">September 4, 2026 (Before 6 PM)</span>
          </p>

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #2a3a37; font-size: 12px; color: #d6d3cd;">
            <strong style="color: #fed65b;">Logistics Note:</strong> Fragile Temple Carving Crating • Hand-Delivered with Signature Verification.
          </div>
        </div>

        <div style="text-align: center;">
          <a href="https://irisjev.com/track" class="btn-gold">Track Live Consignment</a>
        </div>
      `;
      return {
        subject: 'Order #IRJ-8842 Dispatched - Tracking AWB: BLUEDART-88291029',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Order #IRJ-8842 Dispatched - AWB BLUEDART-88291029'),
      };
    }

    case 'ticket_created': {
      const htmlContent = `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Support Inquiry Received #TCK-4091</h2>
        <p>Dear <strong>Vikramaditya Rao</strong>,</p>
        <p>We have received your support inquiry regarding <strong>"Custom Dimensions for Teak Mandapam"</strong>. Our dedicated concierge team is reviewing your request.</p>

        <div class="card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span class="badge">Ticket Status: In Review</span>
            <span style="color: #fed65b; font-size: 12px; font-weight: bold;">Priority: High</span>
          </div>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Category:</strong> Custom Commission Request</p>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Linked Order:</strong> #IRJ-8842</p>
          <div style="margin-top: 12px; padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #d6d3cd; border: 1px solid #232e2c;">
            "We would like to request an additional 6 inches of height for the dome mandapam carved pillar base. Please advise on lead time."
          </div>
        </div>

        <p style="font-size: 12px; color: #a19f99;">
          You can track and reply to this ticket directly within your <a href="https://irisjev.com" style="color: #fed65b;">Irisjev Account Portal</a>.
        </p>
      `;
      return {
        subject: 'Support Ticket #TCK-4091 Received - Irisjev Concierge',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Support Ticket #TCK-4091 Received'),
      };
    }

    case 'ticket_response': {
      const htmlContent = `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Concierge Response to Ticket #TCK-4091</h2>
        <p>Dear <strong>Vikramaditya Rao</strong>,</p>
        <p>Our concierge team has provided an update regarding your inquiry <strong>"Custom Dimensions for Teak Mandapam"</strong>:</p>

        <div class="card" style="border-left: 3px solid #fed65b;">
          <span class="badge" style="margin-bottom: 8px;">Status: RESOLVED</span>
          <div style="margin-top: 8px; font-size: 14px; color: #ffffff; line-height: 1.7;">
            Namaste Mr. Rao, our Chief Sthapathi has reviewed your custom dimension adjustment. We have extended the carved pillar base by 6 inches using Grade-A Seasoned Teak. Your updated CAD drawing has been uploaded to your account portal.
          </div>
        </div>

        <p style="font-size: 12px; color: #a19f99;">
          If you need further assistance, you can reply directly from your Irisjev Account or reply to this message.
        </p>

        <div style="text-align: center;">
          <a href="https://irisjev.com" class="btn-gold">View in Account Portal</a>
        </div>
      `;
      return {
        subject: 'Update on Support Ticket #TCK-4091 - Irisjev Concierge',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Update on Ticket #TCK-4091'),
      };
    }

    case 'welcome_discount': {
      const htmlContent = `
        <div style="text-align: center; padding: 10px 0 20px 0;">
          <span class="badge" style="font-size: 11px; padding: 6px 16px;">Welcome to Irisjev Heritage</span>
          <h2 style="color: #fed65b; margin: 16px 0 8px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">
            Enjoy 10% Off Your First Masterpiece
          </h2>
          <p style="color: #d6d3cd; font-size: 14px; max-width: 480px; margin: 0 auto 20px auto;">
            Dear <strong>Priya Sundaram</strong>, welcome to the prestigious circle of Irisjev Wooden Crafts collectors.
          </p>
        </div>

        <div class="card" style="text-align: center; border: 2px dashed #fed65b; background-color: #17201e; padding: 28px 20px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #a19f99; text-transform: uppercase; letter-spacing: 2px;">Your Exclusive Welcome Voucher</p>
          <div style="display: inline-block; background-color: #0d1312; border: 1px solid #fed65b; padding: 12px 28px; border-radius: 12px; margin: 12px 0;">
            <span style="font-family: monospace; font-size: 26px; font-weight: bold; color: #fed65b; letter-spacing: 4px;">WELCOME10</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #4ade80; font-weight: bold;">
            Save 10% Instantly On Any Sacred Sculpture or Custom Timber Commission
          </p>
        </div>

        <div style="background-color: #1c2624; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h4 style="color: #ffffff; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Why Irisjev Heritage?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #a19f99; font-size: 12px; line-height: 1.8;">
            <li>Master Sthapathi hand-carved precision following Shilpa Shastras</li>
            <li>100% sustainably harvested Teakwood, Rosewood, and Sandalwood</li>
            <li>Velvet-lined protective crating with insured global express delivery</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://irisjev.com" class="btn-gold">Explore The Collection & Claim 10%</a>
        </div>
      `;
      return {
        subject: 'Welcome to Irisjev Wooden Crafts - Your 10% Welcome Gift (WELCOME10)',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Welcome to Irisjev - Here is your 10% OFF coupon code: WELCOME10'),
      };
    }

    case 'contact_inquiry': {
      const htmlContent = `
        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">We Have Received Your Inquiry</h2>
        <p>Dear <strong>Rajesh K. Varma</strong>,</p>
        <p>Thank you for reaching out to Irisjev Wooden Crafts. Our bespoke craftsmanship specialists have received your inquiry regarding <strong>"Architectural Door Carving"</strong>.</p>

        <div class="card">
          <span class="badge" style="margin-bottom: 8px;">Inquiry Type: Temple Architecture & Carved Doors</span>
          <p style="margin: 8px 0; font-size: 13px;"><strong>Your Message:</strong></p>
          <div style="padding: 12px; background-color: #0d1312; border-radius: 8px; font-size: 12px; color: #ece9e2; border: 1px solid #232e2c;">
            "We are constructing a traditional villa in Bengaluru and require a pair of 8-foot Burma Teak carved main entrance doors with brass motif work. Please share portfolio details."
          </div>
        </div>

        <p style="font-size: 12px; color: #a19f99;">
          A dedicated master artisan or support concierge will contact you shortly via email or WhatsApp to assist you.
        </p>
      `;
      return {
        subject: 'Inquiry Received - Irisjev Wooden Crafts Concierge',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Inquiry Received - Irisjev Wooden Crafts'),
      };
    }

    default: {
      const htmlContent = `
        <h2 style="color: #fed65b; margin-top: 0;">⚡ Resend Email Notification Gateway Active</h2>
        <p>Hello! This is a real-time verification email from the <strong>Irisjev Wooden Crafts</strong> notification engine.</p>
        
        <div class="card">
          <p style="margin: 4px 0;"><strong>Delivered via:</strong> Resend API Gateway (send@irisjev.in)</p>
          <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #4ade80; font-weight: bold;">Verified & Operational</span></p>
        </div>

        <p style="font-size: 12px; color: #a19f99;">
          All automated customer notifications are active and delivering through Resend.
        </p>
      `;
      return {
        subject: 'Resend Notification Verification - Irisjev Wooden Crafts',
        html: wrapInLuxuryEmailTemplate(htmlContent, 'Resend Gateway Health Verification'),
      };
    }
  }
}


