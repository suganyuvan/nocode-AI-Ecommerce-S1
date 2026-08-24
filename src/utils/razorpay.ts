import { supabase } from './supabaseClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  order?: any;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentSuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    animation?: boolean;
  };
}

/**
 * Dynamically loads the Razorpay Standard Checkout SDK script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Creates a Razorpay Order via Supabase Edge Function
 */
export const createRazorpayOrder = async (
  amountInRupees: number,
  currency = 'INR',
  receipt?: string,
  notes?: Record<string, any>
): Promise<RazorpayOrderResponse> => {
  const amountInPaise = Math.round(amountInRupees * 100);

  try {
    const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
      body: {
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      },
    });

    if (error) {
      console.error('Error invoking razorpay-create-order function:', error);
      throw new Error(error.message || 'Failed to create Razorpay order');
    }

    if (!data?.orderId) {
      throw new Error(data?.error || 'Invalid response from order creation server');
    }

    return data as RazorpayOrderResponse;
  } catch (err: any) {
    // Fallback: Direct call to Edge Function URL if invoke had client header issues
    console.warn('Supabase functions.invoke fallback triggering fetch:', err.message);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kimkttzdxnkekcoeuvop.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      }),
    });

    const json = await response.json();
    if (!response.ok || !json.orderId) {
      throw new Error(json.error || 'Failed to initialize payment gateway order');
    }

    return json as RazorpayOrderResponse;
  }
};

/**
 * Verifies Razorpay payment signature via Supabase Edge Function
 */
export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id?: string;
  order_number?: string;
}): Promise<{ success: boolean; verified: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
      body: payload,
    });

    if (error) {
      console.error('Payment verification function error:', error);
      throw new Error(error.message || 'Payment signature verification failed');
    }

    return data;
  } catch (err: any) {
    console.warn('Fallback direct verify fetch triggering:', err.message);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kimkttzdxnkekcoeuvop.supabase.co';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const response = await fetch(`${supabaseUrl}/functions/v1/razorpay-verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || 'Failed to verify payment signature');
    }

    return json;
  }
};
