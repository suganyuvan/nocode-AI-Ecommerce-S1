import { supabase } from './supabaseClient';
import { Coupon, CouponUsage, CouponValidationParams, CouponValidationResult } from '../types';

const LOCAL_STORAGE_KEY = 'irisjev_coupons_cache';
const LOCAL_STORAGE_USAGES_KEY = 'irisjev_coupon_usages_cache';

// Default Fallback Coupons Data
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'WELCOME10',
    description: '10% Welcome discount for first-time woodcraft collectors',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_amount: 5000,
    min_cart_amount: 1000,
    min_usage_count: 0,
    max_usage_count: 500,
    max_usage_per_customer: 1,
    current_usage_count: 0,
    customer_order_eligibility: 'first_order_only',
    start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 365).toISOString(),
    is_active: true,
  },
  {
    id: 'coupon-2',
    code: 'REPEAT15',
    description: '15% Loyalty appreciation discount for repeat customers',
    discount_type: 'percentage',
    discount_value: 15,
    max_discount_amount: 7500,
    min_cart_amount: 2000,
    min_usage_count: 0,
    max_usage_count: 200,
    max_usage_per_customer: 2,
    current_usage_count: 0,
    customer_order_eligibility: 'repeat_orders_only',
    start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 180).toISOString(),
    is_active: true,
  },
  {
    id: 'coupon-3',
    code: 'FESTIVE500',
    description: 'Flat ₹500 discount on royal wooden panel orders above ₹3,000',
    discount_type: 'fixed',
    discount_value: 500,
    max_discount_amount: null,
    min_cart_amount: 3000,
    min_usage_count: 0,
    max_usage_count: 100,
    max_usage_per_customer: 1,
    current_usage_count: 0,
    customer_order_eligibility: 'all',
    start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 90).toISOString(),
    is_active: true,
  },
  {
    id: 'coupon-4',
    code: 'SUPERVIP',
    description: 'Exclusive 20% discount for customers with 3+ previous orders',
    discount_type: 'percentage',
    discount_value: 20,
    max_discount_amount: 10000,
    min_cart_amount: 5000,
    min_usage_count: 0,
    max_usage_count: 50,
    max_usage_per_customer: 3,
    current_usage_count: 0,
    customer_order_eligibility: 'custom_range',
    min_previous_orders: 3,
    max_previous_orders: 99,
    start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 120).toISOString(),
    is_active: true,
  },
  {
    id: 'coupon-5',
    code: 'FREESHIP3',
    description: 'Free Insured Shipping for loyal customers with 3+ past completed orders',
    discount_type: 'free_shipping',
    discount_value: 0,
    max_discount_amount: null,
    min_cart_amount: 0,
    min_usage_count: 0,
    max_usage_count: 500,
    max_usage_per_customer: 5,
    current_usage_count: 0,
    customer_order_eligibility: 'custom_range',
    min_previous_orders: 3,
    start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 365).toISOString(),
    is_active: true,
  }
];

// Helper to get local stored coupons
const getLocalCoupons = (): Coupon[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: Coupon[] = JSON.parse(raw);
      const localUsages = getLocalUsages();
      // If no local usages exist, ensure mock usage counts are zeroed out
      if (localUsages.length === 0) {
        return parsed.map(c => {
          const matchUsage = localUsages.filter(u => u.coupon_id === c.id || u.coupon_code?.toUpperCase() === c.code.toUpperCase()).length;
          return { ...c, current_usage_count: matchUsage };
        });
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load local coupons:', e);
  }
  return INITIAL_COUPONS;
};


// Helper to save local coupons
const saveLocalCoupons = (coupons: Coupon[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.warn('Failed to save local coupons:', e);
  }
};

// Helper to get local stored usages
const getLocalUsages = (): CouponUsage[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local coupon usages:', e);
  }
  return [];
};

// Helper to save local usages
const saveLocalUsages = (usages: CouponUsage[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USAGES_KEY, JSON.stringify(usages));
  } catch (e) {
    console.warn('Failed to save local usages:', e);
  }
};

/**
 * Fetch all coupons from Supabase DB or LocalStorage fallback
 */
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getLocalCoupons();
    }

    // Query exact usage counts from coupon_usages to guarantee accuracy
    const { data: usages } = await supabase
      .from('coupon_usages')
      .select('coupon_id, coupon_code');

    const usageMap: Record<string, number> = {};
    if (usages) {
      usages.forEach((u: any) => {
        if (u.coupon_id) usageMap[u.coupon_id] = (usageMap[u.coupon_id] || 0) + 1;
        if (u.coupon_code) usageMap[u.coupon_code.toUpperCase()] = (usageMap[u.coupon_code.toUpperCase()] || 0) + 1;
      });
    }

    const formattedData: Coupon[] = data.map((item: any) => {
      const realUsage = usageMap[item.id] !== undefined
        ? usageMap[item.id]
        : (usageMap[item.code.toUpperCase()] !== undefined ? usageMap[item.code.toUpperCase()] : Number(item.current_usage_count || 0));

      return {
        ...item,
        discount_value: Number(item.discount_value),
        max_discount_amount: item.max_discount_amount ? Number(item.max_discount_amount) : null,
        min_cart_amount: Number(item.min_cart_amount),
        min_usage_count: Number(item.min_usage_count || 0),
        max_usage_count: item.max_usage_count ? Number(item.max_usage_count) : null,
        max_usage_per_customer: Number(item.max_usage_per_customer || 1),
        current_usage_count: realUsage,
        min_previous_orders: item.min_previous_orders ? Number(item.min_previous_orders) : undefined,
        max_previous_orders: item.max_previous_orders ? Number(item.max_previous_orders) : undefined,
      };
    });

    saveLocalCoupons(formattedData);
    return formattedData;
  } catch (e) {
    console.warn('Using offline coupons cache:', e);
    return getLocalCoupons();
  }
}

/**
 * Save or update a coupon
 */
export async function saveCoupon(coupon: Partial<Coupon>): Promise<{ success: boolean; data?: Coupon; error?: string }> {
  const isNew = !coupon.id || coupon.id.startsWith('coupon-');
  const nowStr = new Date().toISOString();
  
  const payload = {
    code: (coupon.code || '').trim().toUpperCase(),
    description: coupon.description || '',
    discount_type: coupon.discount_type || 'percentage',
    discount_value: Number(coupon.discount_value || 0),
    max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
    min_cart_amount: Number(coupon.min_cart_amount || 0),
    min_usage_count: Number(coupon.min_usage_count || 0),
    max_usage_count: coupon.max_usage_count ? Number(coupon.max_usage_count) : null,
    max_usage_per_customer: Number(coupon.max_usage_per_customer || 1),
    customer_order_eligibility: coupon.customer_order_eligibility || 'all',
    min_previous_orders: coupon.min_previous_orders ? Number(coupon.min_previous_orders) : 0,
    max_previous_orders: coupon.max_previous_orders ? Number(coupon.max_previous_orders) : null,
    start_date: coupon.start_date || nowStr,
    expiry_date: coupon.expiry_date || new Date(Date.now() + 86400000 * 30).toISOString(),
    is_active: coupon.is_active ?? true,
    updated_at: nowStr,
  };

  try {
    if (coupon.id && !isNew) {
      // Update in Supabase
      const { data, error } = await supabase
        .from('coupons')
        .update(payload)
        .eq('id', coupon.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local storage
      const local = getLocalCoupons();
      const updated = local.map(c => c.id === coupon.id ? { ...c, ...data } : c);
      saveLocalCoupons(updated);
      return { success: true, data };
    } else {
      // Insert in Supabase
      const { data, error } = await supabase
        .from('coupons')
        .insert([{ ...payload, current_usage_count: coupon.current_usage_count || 0 }])
        .select()
        .single();

      if (error) throw error;

      const local = getLocalCoupons();
      saveLocalCoupons([data, ...local]);
      return { success: true, data };
    }
  } catch (e: any) {
    console.warn('Falling back to local storage save:', e.message);
    const local = getLocalCoupons();
    const mockId = coupon.id || `coupon-${Date.now()}`;
    const mockSavedCoupon: Coupon = {
      id: mockId,
      code: payload.code,
      description: payload.description,
      discount_type: payload.discount_type as any,
      discount_value: payload.discount_value,
      max_discount_amount: payload.max_discount_amount,
      min_cart_amount: payload.min_cart_amount,
      min_usage_count: payload.min_usage_count,
      max_usage_count: payload.max_usage_count,
      max_usage_per_customer: payload.max_usage_per_customer,
      current_usage_count: coupon.current_usage_count || 0,
      customer_order_eligibility: payload.customer_order_eligibility as any,
      min_previous_orders: payload.min_previous_orders,
      max_previous_orders: payload.max_previous_orders || undefined,
      start_date: payload.start_date,
      expiry_date: payload.expiry_date,
      is_active: payload.is_active,
    };

    const existingIdx = local.findIndex(c => c.id === mockId || c.code === payload.code);
    if (existingIdx >= 0) {
      local[existingIdx] = mockSavedCoupon;
    } else {
      local.unshift(mockSavedCoupon);
    }
    saveLocalCoupons(local);
    return { success: true, data: mockSavedCoupon };
  }
}

/**
 * Toggle active state of coupon
 */
export async function toggleCouponActive(id: string, newActiveState: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) console.warn('Supabase toggle update notice:', error);
  } catch (e) {
    console.warn('Local toggle update');
  }

  const local = getLocalCoupons();
  const updated = local.map(c => c.id === id ? { ...c, is_active: newActiveState } : c);
  saveLocalCoupons(updated);
  return true;
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    await supabase.from('coupons').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete notice:', e);
  }

  const local = getLocalCoupons();
  saveLocalCoupons(local.filter(c => c.id !== id));
  return true;
}

/**
 * Fetch customer's total completed past orders count from Supabase
 */
export async function getCustomerPastOrderCount(email: string): Promise<number> {
  if (!email || !email.trim()) return 0;
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Get customer ID
    const { data: customerData } = await supabase
      .from('customers')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (customerData?.id) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerData.id);

      if (typeof count === 'number') return count;
    }
  } catch (e) {
    console.warn('Order count query exception:', e);
  }

  // Fallback to checking local order storage if available
  try {
    const rawLocalOrders = localStorage.getItem('irisjev_orders_cache');
    if (rawLocalOrders) {
      const orders = JSON.parse(rawLocalOrders);
      return orders.filter((o: any) => o.customerEmail?.toLowerCase() === cleanEmail || o.customers?.email?.toLowerCase() === cleanEmail).length;
    }
  } catch (e) {
    console.warn('Local order count error:', e);
  }

  return 0;
}

/**
 * Fetch usages count for a customer on a specific coupon
 */
export async function getCustomerCouponUsageCount(couponId: string, email: string): Promise<number> {
  if (!email || !email.trim()) return 0;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { count, error } = await supabase
      .from('coupon_usages')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', couponId)
      .eq('customer_email', cleanEmail);

    if (!error && typeof count === 'number') return count;
  } catch (e) {
    console.warn('Supabase usage query exception:', e);
  }

  const localUsages = getLocalUsages();
  return localUsages.filter(u => u.coupon_id === couponId && u.customer_email.toLowerCase() === cleanEmail).length;
}

/**
 * Comprehensive Backend Engine Validation
 * Validates against:
 * 1. Code match & active status
 * 2. Schedule validity (start_date <= currentDateTime <= expiry_date)
 * 3. Global Usage Limits (current_usage_count < max_usage_count & current_usage_count >= min_usage_count)
 * 4. Min Cart Amount requirement
 * 5. Customer Repeated Order Eligibility (All, 1st Order, Repeat Orders, Custom Range)
 * 6. Max Usage Per Customer
 */
export async function validateCoupon(params: CouponValidationParams): Promise<CouponValidationResult> {
  const cleanCode = (params.code || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Please enter a valid coupon code.',
      errorReason: 'EMPTY_CODE'
    };
  }

  const allCoupons = await fetchCoupons();
  const coupon = allCoupons.find(c => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Coupon code "${cleanCode}" is invalid.`,
      errorReason: 'NOT_FOUND'
    };
  }

  // 1. Check Master Active Toggle
  if (!coupon.is_active) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" is currently inactive or disabled by admin.`,
      errorReason: 'INACTIVE'
    };
  }

  const checkTime = params.currentDateTime ? new Date(params.currentDateTime).getTime() : Date.now();
  const startTime = new Date(coupon.start_date).getTime();
  const expiryTime = new Date(coupon.expiry_date).getTime();

  // 2. Check Schedule (Start Date)
  if (checkTime < startTime) {
    const formattedStart = new Date(coupon.start_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" is scheduled to become active on ${formattedStart}.`,
      errorReason: 'NOT_STARTED_YET'
    };
  }

  // 3. Check Schedule (Expiry Date)
  if (checkTime > expiryTime) {
    const formattedExpiry = new Date(coupon.expiry_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" expired on ${formattedExpiry}.`,
      errorReason: 'EXPIRED'
    };
  }

  // 4. Check Global Usage Count Limits
  if (coupon.max_usage_count !== null && coupon.max_usage_count !== undefined && coupon.current_usage_count >= coupon.max_usage_count) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" has reached its maximum total usage limit of ${coupon.max_usage_count} redemptions.`,
      errorReason: 'MAX_GLOBAL_USAGE_REACHED'
    };
  }

  if (coupon.min_usage_count > 0 && coupon.current_usage_count < coupon.min_usage_count) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" requires a minimum of ${coupon.min_usage_count} global claims before it unlocks.`,
      errorReason: 'MIN_GLOBAL_USAGE_NOT_MET'
    };
  }

  // 5. Check Minimum Cart Subtotal
  if (params.cartSubtotal < coupon.min_cart_amount) {
    const shortage = coupon.min_cart_amount - params.cartSubtotal;
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Add ₹${shortage.toLocaleString('en-IN')} more to your cart to use code "${cleanCode}" (Min ₹${coupon.min_cart_amount.toLocaleString('en-IN')}).`,
      errorReason: 'MIN_CART_NOT_MET'
    };
  }

  // 6. Check Customer Repeated Order Eligibility
  let pastOrderCount = params.customerOrderCount;
  if (pastOrderCount === undefined && params.customerEmail) {
    pastOrderCount = await getCustomerPastOrderCount(params.customerEmail);
  }
  pastOrderCount = pastOrderCount || 0;

  if (coupon.customer_order_eligibility === 'first_order_only' && pastOrderCount > 0) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" is valid for your 1st order only. You have ${pastOrderCount} previous order(s).`,
      errorReason: 'FIRST_ORDER_ONLY'
    };
  }

  if (coupon.customer_order_eligibility === 'repeat_orders_only' && pastOrderCount === 0) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      message: `Coupon "${cleanCode}" is exclusive to repeat customers with existing order history.`,
      errorReason: 'REPEAT_ORDERS_ONLY'
    };
  }

  if (coupon.customer_order_eligibility === 'custom_range') {
    const minRequired = coupon.min_previous_orders || 0;
    const maxAllowed = coupon.max_previous_orders;

    if (pastOrderCount < minRequired) {
      return {
        isValid: false,
        coupon,
        discountAmount: 0,
        message: `Coupon "${cleanCode}" requires at least ${minRequired} previous orders. You currently have ${pastOrderCount}.`,
        errorReason: 'ORDER_RANGE_NOT_MET'
      };
    }

    if (maxAllowed !== undefined && maxAllowed !== null && pastOrderCount > maxAllowed) {
      return {
        isValid: false,
        coupon,
        discountAmount: 0,
        message: `Coupon "${cleanCode}" is capped for customers with max ${maxAllowed} orders.`,
        errorReason: 'ORDER_RANGE_EXCEEDED'
      };
    }
  }

  // 7. Check Per-Customer Usage Limits
  if (params.customerEmail && coupon.max_usage_per_customer > 0) {
    const customerUses = await getCustomerCouponUsageCount(coupon.id, params.customerEmail);
    if (customerUses >= coupon.max_usage_per_customer) {
      return {
        isValid: false,
        coupon,
        discountAmount: 0,
        message: `You have already used coupon "${cleanCode}" the maximum allowed ${coupon.max_usage_per_customer} time(s).`,
        errorReason: 'MAX_CUSTOMER_USAGE_EXCEEDED'
      };
    }
  }

  // Calculate Discount Amount
  let rawDiscount = 0;
  if (coupon.discount_type === 'percentage') {
    rawDiscount = (params.cartSubtotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && rawDiscount > coupon.max_discount_amount) {
      rawDiscount = coupon.max_discount_amount;
    }
  } else if (coupon.discount_type === 'free_shipping') {
    rawDiscount = params.shippingFee || 0;
  } else {
    rawDiscount = Math.min(params.cartSubtotal, coupon.discount_value);
  }

  const roundedDiscount = Math.round(rawDiscount * 100) / 100;

  let discountDescription = '';
  const subtotalFormatted = `₹${Math.round(params.cartSubtotal).toLocaleString('en-IN')}`;

  if (coupon.discount_type === 'free_shipping') {
    discountDescription = `Free Insured Shipping unlocked!`;
  } else if (coupon.discount_type === 'percentage') {
    const rawPercentDiscount = (params.cartSubtotal * coupon.discount_value) / 100;
    if (coupon.max_discount_amount && rawPercentDiscount > coupon.max_discount_amount) {
      discountDescription = `${coupon.discount_value}% off Subtotal (${subtotalFormatted}), capped at ₹${Number(coupon.max_discount_amount).toLocaleString('en-IN')}`;
    } else {
      discountDescription = `${coupon.discount_value}% off Subtotal (${subtotalFormatted})`;
    }
  } else {
    discountDescription = `Flat ₹${Number(coupon.discount_value).toLocaleString('en-IN')} off Subtotal (${subtotalFormatted})`;
  }

  return {
    isValid: true,
    coupon,
    discountAmount: roundedDiscount,
    message: `Coupon applied! ${discountDescription}`,
  };
}

/**
 * Record a successful redemption on order placement
 */
export async function recordCouponUsage(
  couponId: string,
  couponCode: string,
  customerEmail: string,
  orderId?: string,
  discountApplied: number = 0
): Promise<boolean> {
  const cleanCode = couponCode.toUpperCase();
  const cleanEmail = (customerEmail || 'guest@irisjev.com').toLowerCase();
  const nowStr = new Date().toISOString();

  try {
    // Call RPC or update directly in Supabase
    const { error: rpcErr } = await supabase.rpc('record_coupon_redemption', {
      p_coupon_id: couponId,
      p_coupon_code: cleanCode,
      p_customer_email: cleanEmail,
      p_order_id: orderId || null,
      p_discount_applied: discountApplied,
    });

    if (rpcErr) {
      // Fallback manual update in Supabase tables
      const { data } = await supabase.from('coupons').select('current_usage_count').eq('id', couponId).single();
      if (data) {
        await supabase.from('coupons').update({ current_usage_count: (data.current_usage_count || 0) + 1 }).eq('id', couponId);
      }

      await supabase.from('coupon_usages').insert([{
        coupon_id: couponId,
        coupon_code: cleanCode,
        customer_email: cleanEmail,
        order_id: orderId || null,
        discount_applied: discountApplied,
        used_at: nowStr
      }]);
    }
  } catch (e) {
    console.warn('Supabase usage recording notice:', e);
  }

  // Always update local cache as well
  const localCoupons = getLocalCoupons();
  const updatedCoupons = localCoupons.map(c => {
    if (c.id === couponId || c.code === cleanCode) {
      return { ...c, current_usage_count: (c.current_usage_count || 0) + 1 };
    }
    return c;
  });
  saveLocalCoupons(updatedCoupons);

  const localUsages = getLocalUsages();
  const newUsage: CouponUsage = {
    id: `usage-${Date.now()}`,
    coupon_id: couponId,
    coupon_code: cleanCode,
    customer_email: cleanEmail,
    order_id: orderId,
    discount_applied: discountApplied,
    used_at: nowStr
  };
  saveLocalUsages([newUsage, ...localUsages]);

  return true;
}

/**
 * Fetch all usage audit logs
 */
export async function fetchCouponUsages(): Promise<CouponUsage[]> {
  try {
    const { data, error } = await supabase
      .from('coupon_usages')
      .select('*')
      .order('used_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('Using local usages cache:', e);
  }

  return getLocalUsages();
}
