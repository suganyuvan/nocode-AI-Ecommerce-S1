import { useState, useEffect } from 'react';
import { formatPrice } from '../utils/currency';
const COUNTRY_OPTIONS = [
  { code: 'India', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'United States', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'United Kingdom', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'United Arab Emirates', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'Singapore', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'Australia', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'Canada', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'Germany', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
];

import { CartItem, Currency, Customer, Coupon, SavedAddress, ActiveTab } from '../types';
import { supabase } from '../utils/supabaseClient';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '../utils/razorpay';
import { PINCODE_CITY_STATE_MAP, DEFAULT_SHIPPING_PAYMENT_SETTINGS, ALL_INDIAN_STATES } from '../admin/views/ShippingManager';
import { validateIndianPincode, validateCityWithState, validateStreetAddress, fetchLivePincodeData } from '../utils/pincodeValidator';
import { validateCoupon, recordCouponUsage } from '../utils/couponEngine';
import { getSavedAddressList, saveAddressToBook } from '../utils/addressBookManager';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';
import { sendOrderConfirmationEmail } from '../utils/resendEmailEngine';
import { trackCheckoutStart } from '../utils/pageViewAnalyticsEngine';

export interface UseCheckoutStateProps {
  cartItems: CartItem[];
  currency: Currency;
  onClearCart: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  customer?: Customer | null;
}

export const useCheckoutState = ({ cartItems, currency, onClearCart, setActiveTab, customer }: UseCheckoutStateProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [pendingCancelOrderInfo, setPendingCancelOrderInfo] = useState<{ id: string; orderNumber: string; options?: any } | null>(null);

  useEffect(() => {
    trackCheckoutStart();
  }, []);

  // Helper to retrieve saved session delivery info (matching current customer)
  const getSavedSessionDeliveryInfo = () => {
    try {
      const custKey = (customer?.email || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      const scopedKey = custKey ? `irisjev_saved_delivery_info_${custKey}` : '';
      const stored = (scopedKey ? (sessionStorage.getItem(scopedKey) || localStorage.getItem(scopedKey)) : null) ||
                     sessionStorage.getItem('irisjev_saved_delivery_info') || 
                     localStorage.getItem('irisjev_saved_delivery_info');

      if (stored) {
        const parsed = JSON.parse(stored);
        if (!customer || !customer.email || !parsed.customerEmail || parsed.customerEmail.toLowerCase().trim() === customer.email.toLowerCase().trim()) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved session delivery info:', e);
    }
    return null;
  };

  const initialSaved = getSavedSessionDeliveryInfo();

  // Form states for checkout initialized with customer profile or session storage
  const [customerName, setCustomerName] = useState(() => customer?.full_name || initialSaved?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(() => customer?.email || initialSaved?.customerEmail || '');
  const [countryCode, setCountryCode] = useState(() => customer?.country_code || initialSaved?.countryCode || '+91');
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (customer?.phone) return customer.phone.replace(/\D/g, '').slice(-10);
    if (initialSaved?.customerPhone) return initialSaved.customerPhone.replace(/\D/g, '').slice(-10);
    return '';
  });
  const [address, setAddress] = useState(() => customer?.address || initialSaved?.address || '');
  const [city, setCity] = useState(() => customer?.city || initialSaved?.city || '');
  const [state, setState] = useState(() => customer?.state || initialSaved?.state || 'Tamil Nadu');
  const [postalCode, setPostalCode] = useState(() => customer?.postal_code || initialSaved?.postalCode || '');
  const [country, setCountry] = useState(() => initialSaved?.country || 'India');
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod'>('prepaid');
  const [gstRate, setGstRate] = useState(3);
  const [isSessionRestored, setIsSessionRestored] = useState(!!initialSaved);

  // Multiple Saved Addresses State
  const [savedAddressesList, setSavedAddressesList] = useState<SavedAddress[]>(() => getSavedAddressList(customer));
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(() => {
    const list = getSavedAddressList(customer);
    return list.find(a => a.isDefault)?.id || list[0]?.id || null;
  });
  const [shouldSaveToAddressBook, setShouldSaveToAddressBook] = useState(true);

  // Sync saved addresses and fields if customer changes
  useEffect(() => {
    const list = getSavedAddressList(customer);
    setSavedAddressesList(list);
    const defaultAddr = list.find(a => a.isDefault) || list[0];
    if (defaultAddr) {
      setSelectedSavedAddressId(defaultAddr.id);
      if (defaultAddr.fullName) setCustomerName(defaultAddr.fullName);
      if (defaultAddr.email) setCustomerEmail(defaultAddr.email);
      if (defaultAddr.phone) setCustomerPhone(defaultAddr.phone.replace(/\D/g, '').slice(-10));
      if (defaultAddr.address) setAddress(defaultAddr.address);
      if (defaultAddr.city) setCity(defaultAddr.city);
      if (defaultAddr.state) setState(defaultAddr.state);
      if (defaultAddr.postalCode) setPostalCode(defaultAddr.postalCode);
      if (defaultAddr.country) setCountry(defaultAddr.country);
    } else if (customer) {
      setSelectedSavedAddressId(null);
      setCustomerName(customer.full_name || '');
      setCustomerEmail(customer.email || '');
      setCustomerPhone(customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || 'Tamil Nadu');
      setPostalCode(customer.postal_code || '');
    }
  }, [customer]);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedSavedAddressId(addr.id);
    if (addr.fullName) setCustomerName(addr.fullName);
    if (addr.email) setCustomerEmail(addr.email);
    if (addr.phone) setCustomerPhone(addr.phone.replace(/\D/g, '').slice(-10));
    if (addr.address) setAddress(addr.address);
    if (addr.city) setCity(addr.city);
    if (addr.state) setState(addr.state);
    if (addr.postalCode) setPostalCode(addr.postalCode);
    if (addr.country) setCountry(addr.country);
    setErrors({});
  };

  const handleAddNewAddressOption = () => {
    setSelectedSavedAddressId(null);
    setAddress('');
    setCity('');
    setState('Tamil Nadu');
    setPostalCode('');
  };

  // Coupon state in Checkout
  const [checkoutCouponInput, setCheckoutCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscountINR, setCouponDiscountINR] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccessMsg, setCouponSuccessMsg] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Auto-save delivery info to session & local storage whenever user types
  useEffect(() => {
    if (customerName || customerEmail || customerPhone || address || postalCode) {
      const payload = {
        customerName,
        customerEmail,
        countryCode,
        customerPhone,
        address,
        city,
        state,
        postalCode,
        country
      };
      try {
        sessionStorage.setItem('irisjev_saved_delivery_info', JSON.stringify(payload));
        localStorage.setItem('irisjev_saved_delivery_info', JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to auto-save delivery info:', e);
      }
    }
  }, [customerName, customerEmail, countryCode, customerPhone, address, city, state, postalCode, country]);

  // Auto-sync customer details when logged in or restored from session
  useEffect(() => {
    const savedInfo = getSavedSessionDeliveryInfo();
    if (customer) {
      if (customer.full_name) setCustomerName(customer.full_name);
      if (customer.email) setCustomerEmail(customer.email);
      if (customer.phone) {
        const digits = customer.phone.replace(/\D/g, '');
        setCustomerPhone(digits.slice(-10));
      }
      if (customer.address) setAddress(customer.address);
      if (customer.city) setCity(customer.city);
      if (customer.state) setState(customer.state);
      if (customer.postal_code) setPostalCode(customer.postal_code);
    } else if (savedInfo) {
      if (savedInfo.customerName && !customerName) setCustomerName(savedInfo.customerName);
      if (savedInfo.customerEmail && !customerEmail) setCustomerEmail(savedInfo.customerEmail);
      if (savedInfo.customerPhone && !customerPhone) setCustomerPhone(savedInfo.customerPhone);
      if (savedInfo.address && !address) setAddress(savedInfo.address);
      if (savedInfo.city && !city) setCity(savedInfo.city);
      if (savedInfo.state && !state) setState(savedInfo.state);
      if (savedInfo.postalCode && !postalCode) setPostalCode(savedInfo.postalCode);
      setIsSessionRestored(true);
    }
  }, [customer]);

  const handleClearSavedSessionInfo = () => {
    sessionStorage.removeItem('irisjev_saved_delivery_info');
    localStorage.removeItem('irisjev_saved_delivery_info');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddress('');
    setCity('');
    setState('Tamil Nadu');
    setPostalCode('');
    setGeoAddressFound(null);
    setIsSessionRestored(false);
  };

  // Map & Live Location states
  const [localities, setLocalities] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [geoAddressFound, setGeoAddressFound] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shippingSettings, setShippingSettings] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('irisjev_shipping_payment_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read custom shipping settings:', e);
    }
    return DEFAULT_SHIPPING_PAYMENT_SETTINGS;
  });

  // Fetch live postal office suggestions when 6-digit PIN is typed
  useEffect(() => {
    if (country === 'India' && postalCode.trim().length === 6) {
      fetchLivePincodeData(postalCode.trim()).then(res => {
        if (res.status === 'Success') {
          const names = Array.from(new Set(res.postOffices.map(p => p.name)));
          setLocalities(names);
          if (res.district && !city) setCity(res.district);
          if (res.state && !state) setState(res.state);
        } else {
          setLocalities([]);
        }
      });
    } else {
      setLocalities([]);
    }
  }, [postalCode, country]);

  // GPS Location Auto-Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            const detectedState = addr.state || '';
            const detectedCity = addr.city || addr.town || addr.village || addr.county || '';
            const detectedPostcode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
            const roadParts = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood].filter(Boolean);
            const road = roadParts.join(', ');

            setCountry('India');
            if (detectedState) setState(detectedState);
            if (detectedCity) setCity(detectedCity);
            if (detectedPostcode) setPostalCode(detectedPostcode);
            if (road) setAddress(road);
            setGeoAddressFound(data.display_name || `${detectedCity}, ${detectedState}`);
          }
        } catch (e) {
          console.warn('Geolocation lookup failed:', e);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation notice:', err);
        setIsLocating(false);
      },
      { timeout: 6000 }
    );
  };

  // Auto-detect City and State from Pincode prefix when in India
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const maxLen = country === 'India' ? 6 : 10;
    if (val.length <= maxLen) {
      setPostalCode(val);
      if (errors.postalCode) {
        setErrors(prev => ({ ...prev, postalCode: undefined }));
      }
      if (country === 'India' && val.length >= 3) {
        const prefix = val.slice(0, 3);
        if (PINCODE_CITY_STATE_MAP[prefix]) {
          const detected = PINCODE_CITY_STATE_MAP[prefix];
          setCity(detected.city);
          setState(detected.state);
          setErrors(prev => ({ ...prev, city: undefined, state: undefined }));
        }
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only alphabets and spaces/symbols
    if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
      setCustomerName(val);
      if (errors.customerName) {
        setErrors(prev => ({ ...prev, customerName: undefined }));
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerEmail(e.target.value);
    if (errors.customerEmail) {
      setErrors(prev => ({ ...prev, customerEmail: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length <= 15) {
      setCustomerPhone(digits);
      if (errors.customerPhone) {
        setErrors(prev => ({ ...prev, customerPhone: undefined }));
      }
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
      setCity(val);
      if (errors.city) {
        setErrors(prev => ({ ...prev, city: undefined }));
      }
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const matched = COUNTRY_OPTIONS.find(c => c.code === newCountry);
    if (matched) {
      setCountryCode(matched.dialCode);
    }
    if (newCountry === 'India') {
      setState('Karnataka');
    } else {
      setState('');
    }
    if (errors.country) {
      setErrors(prev => ({ ...prev, country: undefined }));
    }
  };

  // Fetch Shipping & Payment Settings from localStorage or Supabase
  useEffect(() => {
    try {
      const stored = localStorage.getItem('irisjev_shipping_payment_settings');
      if (stored) {
        setShippingSettings(JSON.parse(stored));
      } else {
        setShippingSettings(DEFAULT_SHIPPING_PAYMENT_SETTINGS);
      }
    } catch (e) {
      console.warn('Could not read custom shipping settings:', e);
    }
  }, []);

  const rawTotalINR = cartItems.reduce(
    (acc, item) => acc + (item.isGift ? 0 : item.product.priceINR * item.quantity),
    0
  );

  // Dynamic Shipping & Zone Calculation based on Unified Engine
  const calculateDynamicCheckout = () => {
    const cleanPincode = (postalCode || '').trim();
    const cleanState = (state || '').trim().toLowerCase();

    // Default settings fallback
    const activeSettings = shippingSettings || DEFAULT_SHIPPING_PAYMENT_SETTINGS;
    const profiles = activeSettings.profiles || DEFAULT_SHIPPING_PAYMENT_SETTINGS.profiles;

    // 1. Match Zone by Pincode Wildcards
    let matchedProfile = profiles.find((p: any) => {
      if (!p.isEnabled || !p.pincodeWildcards) return false;
      const patterns = p.pincodeWildcards.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      return patterns.some((pattern: string) => {
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return cleanPincode.startsWith(prefix);
        }
        return cleanPincode === pattern;
      });
    });

    // 2. Match Zone by State
    if (!matchedProfile) {
      matchedProfile = profiles.find((p: any) => {
        if (!p.isEnabled) return false;
        return p.applicableStates && p.applicableStates.some((s: string) => s.toLowerCase() === cleanState);
      });
    }

    // 3. Fallback to Default Zone
    if (!matchedProfile) {
      matchedProfile = profiles.find((p: any) => p.isDefault && p.isEnabled) || profiles[0];
    }

    // Free shipping threshold ONLY applies if threshold > 0 AND rawTotalINR >= threshold
    const hasThreshold = matchedProfile && Number(matchedProfile.freeShippingThreshold) > 0;
    const isFree = hasThreshold && rawTotalINR >= Number(matchedProfile.freeShippingThreshold);
    const baseShippingFee = isFree ? 0 : (matchedProfile ? Number(matchedProfile.baseCharge) : 350);

    // COD Validation & Handling Fee
    let isCodAllowed = true;
    let codDisabledReason = '';

    // COD is only available for domestic India in INR
    if (country !== 'India' || currency !== 'INR') {
      isCodAllowed = false;
      codDisabledReason = `Cash on Delivery is only available for domestic orders in India (INR).`;
    } else if (activeSettings.cod) {
      if (!activeSettings.cod.isEnabled) {
        isCodAllowed = false;
        codDisabledReason = 'Cash on Delivery is currently disabled.';
      } else if (activeSettings.cod.minOrder > 0 && rawTotalINR < activeSettings.cod.minOrder) {
        isCodAllowed = false;
        codDisabledReason = `Minimum order of ₹${activeSettings.cod.minOrder} required for COD.`;
      } else if (activeSettings.cod.maxOrder > 0 && rawTotalINR > activeSettings.cod.maxOrder) {
        isCodAllowed = false;
        codDisabledReason = `COD unavailable for orders above ₹${Number(activeSettings.cod.maxOrder).toLocaleString()}.`;
      } else if (cleanPincode.length >= 3 && activeSettings.cod.restrictedPincodes) {
        const blacklist = activeSettings.cod.restrictedPincodes.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        const isBlacklisted = blacklist.some((pattern: string) => {
          if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            return cleanPincode.startsWith(prefix);
          }
          return cleanPincode === pattern;
        });
        if (isBlacklisted) {
          isCodAllowed = false;
          codDisabledReason = `COD is not available for pincode ${cleanPincode}.`;
        }
      }
    }

    const codHandlingFee = (paymentMethod === 'cod' && isCodAllowed && activeSettings.cod) ? (Number(activeSettings.cod.handlingCharge) || 0) : 0;

    // Prepaid Discount
    let prepaidDiscountINR = 0;
    if (paymentMethod === 'prepaid' && activeSettings.prepaid?.isEnabled) {
      if (activeSettings.prepaid.instantDiscountPercent > 0) {
        prepaidDiscountINR = (rawTotalINR * activeSettings.prepaid.instantDiscountPercent) / 100;
      } else if (activeSettings.prepaid.flatDiscount > 0) {
        prepaidDiscountINR = Number(activeSettings.prepaid.flatDiscount);
      }
    }

    return {
      baseShippingFee,
      codHandlingFee,
      totalShippingAndFees: baseShippingFee + codHandlingFee,
      deliveryTimeline: matchedProfile ? matchedProfile.deliveryTimeline : '3-5 Business Days',
      isCodAllowed,
      codDisabledReason,
      prepaidDiscountINR,
      isFreeQualified: isFree,
      matchedProfileName: matchedProfile ? matchedProfile.name : 'Standard Delivery'
    };
  };

  // Auto-apply unlocked welcome coupon if newly registered
  useEffect(() => {
    try {
      const unlocked = localStorage.getItem('irisjev_unlocked_coupon');
      if (unlocked && !appliedCoupon && rawTotalINR > 0) {
        setCheckoutCouponInput(unlocked);
        validateCoupon({
          code: unlocked,
          cartSubtotal: rawTotalINR,
          customerEmail: customerEmail,
          shippingFee: checkoutCalc.baseShippingFee,
        }).then(res => {
          if (res.isValid && res.coupon) {
            setAppliedCoupon(res.coupon);
            setCouponDiscountINR(res.discountAmount);
            setCouponSuccessMsg(`✨ Welcome Offer applied: 10% OFF code ${unlocked}`);
          }
        });
      }
    } catch (err) {
      console.warn('Welcome coupon auto-apply notice:', err);
    }
  }, [rawTotalINR]);

  // Auto re-validate coupon if cart subtotal changes while applied
  useEffect(() => {
    if (appliedCoupon && rawTotalINR > 0) {
      validateCoupon({
        code: appliedCoupon.code,
        cartSubtotal: rawTotalINR,
        customerEmail: customerEmail,
        shippingFee: checkoutCalc.baseShippingFee,
      }).then(res => {
        if (res.isValid) {
          setCouponDiscountINR(res.discountAmount);
          setCouponSuccessMsg(res.message);
          setCouponError('');
        } else {
          setAppliedCoupon(null);
          setCouponDiscountINR(0);
          setCouponSuccessMsg('');
          setCouponError(`Coupon removed: ${res.message}`);
        }
      });
    } else if (rawTotalINR === 0) {
      setAppliedCoupon(null);
      setCouponDiscountINR(0);
      setCouponSuccessMsg('');
    }
  }, [rawTotalINR, customerEmail, appliedCoupon]);

  const handleApplyCouponCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = checkoutCouponInput.trim();
    if (!cleanCode) return;

    setIsValidatingCoupon(true);
    setCouponError('');
    setCouponSuccessMsg('');

    const res = await validateCoupon({
      code: cleanCode,
      cartSubtotal: rawTotalINR,
      customerEmail: customerEmail,
      shippingFee: checkoutCalc.baseShippingFee,
    });

    setIsValidatingCoupon(false);

    if (res.isValid && res.coupon) {
      setAppliedCoupon(res.coupon);
      setCouponDiscountINR(res.discountAmount);
      setCouponSuccessMsg(res.message);
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponDiscountINR(0);
      setCouponSuccessMsg('');
      setCouponError(res.message);
    }
  };

  const handleRemoveCouponCheckout = () => {
    setAppliedCoupon(null);
    setCouponDiscountINR(0);
    setCheckoutCouponInput('');
    setCouponSuccessMsg('');
    setCouponError('');
  };

  const getCouponDiscountText = (coupon: Coupon, subtotal: number) => {
    const subtotalFormatted = formatPrice(subtotal, currency);
    if (coupon.discount_type === 'free_shipping') {
      return `Coupon applied! Free Insured Shipping unlocked!`;
    }
    if (coupon.discount_type === 'percentage') {
      const rawPercentDiscount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && rawPercentDiscount > coupon.max_discount_amount) {
        return `Coupon applied! ${coupon.discount_value}% off Subtotal (${subtotalFormatted}), capped at ₹${Number(coupon.max_discount_amount).toLocaleString('en-IN')}`;
      }
      return `Coupon applied! ${coupon.discount_value}% off Subtotal (${subtotalFormatted})`;
    }
    return `Coupon applied! Flat ₹${Number(coupon.discount_value).toLocaleString('en-IN')} off Subtotal (${subtotalFormatted})`;
  };

  const checkoutCalc = calculateDynamicCheckout();
  const isFreeShippingCoupon = appliedCoupon?.discount_type === 'free_shipping';
  const baseShippingCharge = isFreeShippingCoupon ? 0 : checkoutCalc.baseShippingFee;
  const codHandlingFee = checkoutCalc.codHandlingFee;
  const isCodAllowed = checkoutCalc.isCodAllowed;
  const prepaidDiscountINR = checkoutCalc.prepaidDiscountINR;

  // Total combined discounts (Prepaid discount + Coupon discount)
  const totalDiscountINR = prepaidDiscountINR + couponDiscountINR;

  // Auto-fallback to prepaid if COD is not allowed
  useEffect(() => {
    if (!isCodAllowed && paymentMethod === 'cod') {
      setPaymentMethod('prepaid');
    }
  }, [isCodAllowed, paymentMethod]);

  const gstAmountINR = Math.max(0, ((rawTotalINR - totalDiscountINR) * gstRate) / 100);
  const finalTotalINR = Math.max(0, rawTotalINR - totalDiscountINR + gstAmountINR + baseShippingCharge + codHandlingFee);

  const fullShippingAddress = {
    customerName: customerName.trim(),
    phone: `${countryCode} ${customerPhone.trim()}`.trim(),
    email: customerEmail.trim(),
    address: address.trim(),
    street: address.trim(),
    city: city.trim() || 'Bengaluru',
    state: state.trim() || 'Karnataka',
    postalCode: postalCode.trim() || '560001',
    country: country || 'India',
  };

  const pincodeValidation = country === 'India' ? validateIndianPincode(postalCode, state) : null;
  const cityValidation = country === 'India' ? validateCityWithState(city, state) : { isValid: true };

  // Comprehensive Form Validation
  const validateAllFields = () => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation (alphabets, spaces, min 2 chars)
    const nameTrim = customerName.trim();
    if (!nameTrim) {
      newErrors.customerName = 'Full Name is required.';
    } else if (!/^[A-Za-z\s.'-]+$/.test(nameTrim)) {
      newErrors.customerName = 'Name must only contain alphabet letters and spaces.';
    } else if (nameTrim.length < 2) {
      newErrors.customerName = 'Name must be at least 2 characters.';
    }

    // 2. Email validation
    const emailTrim = customerEmail.trim();
    if (!emailTrim) {
      newErrors.customerEmail = 'Email Address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrim)) {
      newErrors.customerEmail = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    // 3. Mobile Number validation
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.customerPhone = 'Mobile Phone Number is required.';
    } else if (countryCode === '+91') {
      if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
        newErrors.customerPhone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      }
    } else {
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        newErrors.customerPhone = 'Please enter a valid international phone number (7-15 digits).';
      }
    }

    // 4. Street Address / Landmark validation
    const addressCheck = validateStreetAddress(address);
    if (!addressCheck.isValid) {
      newErrors.address = addressCheck.message || 'Please enter a complete delivery address (min 8 characters).';
    }

    // 5. City validation & State consistency
    const cityTrim = city.trim();
    if (!cityTrim) {
      newErrors.city = 'City is required.';
    } else if (!/^[A-Za-z\s.'-]+$/.test(cityTrim)) {
      newErrors.city = 'City must only contain alphabetic letters.';
    } else if (cityTrim.length < 2) {
      newErrors.city = 'City must be at least 2 characters.';
    } else if (country === 'India') {
      const cityCheck = validateCityWithState(cityTrim, state);
      if (!cityCheck.isValid) {
        newErrors.city = cityCheck.message || `City "${cityTrim}" is not located in ${state}.`;
      }
    }

    // 6. State validation
    const stateTrim = state.trim();
    if (!stateTrim) {
      newErrors.state = 'State / Province is required.';
    }

    // 7. PIN / ZIP code validation
    const pinTrim = postalCode.trim();
    if (!pinTrim) {
      newErrors.postalCode = 'PIN / ZIP Code is required.';
    } else if (country === 'India') {
      if (!/^\d{6}$/.test(pinTrim)) {
        newErrors.postalCode = 'Indian PIN code must be exactly 6 numeric digits.';
      } else if (pincodeValidation && pincodeValidation.status === 'mismatch') {
        newErrors.postalCode = pincodeValidation.message;
      }
    } else {
      if (pinTrim.length < 3) {
        newErrors.postalCode = 'Please enter a valid Postal / ZIP code.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate form inputs
    if (!validateAllFields()) {
      setErrorMessage('Please correct the highlighted fields in the delivery form.');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formattedAddressStr = `${address}, ${city}, ${state} ${postalCode}, ${country}`;

      // 1. Ensure Razorpay SDK is loaded if Prepaid
      if (paymentMethod === 'prepaid') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !window.Razorpay) {
          throw new Error('Razorpay payment gateway SDK failed to load. Please check your internet connection.');
        }
      }

      // 2. Check or Upsert Customer
      let customerId = '';
      const { data: existingCustomer, error: findErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (findErr) console.warn('Customer lookup notice:', findErr);

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from('customers')
          .update({
            full_name: customerName,
            phone: customerPhone,
            address: formattedAddressStr,
          })
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error: createErr } = await supabase
          .from('customers')
          .insert([{
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: formattedAddressStr,
          }])
          .select()
          .single();

        if (createErr) throw createErr;
        customerId = newCustomer.id;
      }

      // Save delivery address to address book if selected
      if (shouldSaveToAddressBook) {
        saveAddressToBook({
          id: selectedSavedAddressId || undefined,
          label: 'Delivery Address',
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          address,
          city,
          state,
          postalCode,
          country,
        }, customer || ({ id: customerId, email: customerEmail, full_name: customerName } as any));
      }

      // 3. Create Pending Order in Supabase
      const orderNumber = `SWARNA-${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: customerId,
          subtotal: rawTotalINR,
          discount_amount: totalDiscountINR,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          total_amount: finalTotalINR,
          currency,
          status: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
          payment_status: 'pending',
          payment_info: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Pending)',
          shipping_address: fullShippingAddress,
          shipping_charge: baseShippingCharge,
          gst_rate: gstRate,
          gst_amount: gstAmountINR,
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      if (!newOrder) throw new Error('Failed to initialize order in database');

      // 4. Create Order Items
      const orderItemsPayload = cartItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        product_name: item.isGift ? `${item.product.name} (Free Gift)` : item.product.name,
        selected_timber: item.selectedTimber,
        quantity: item.quantity,
        unit_price: item.isGift ? 0 : item.product.priceINR
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsErr) console.warn('Order items insert notice:', itemsErr);

      // Dispatch outgoing webhook event for new order
      dispatchWebhookEvent('order.created', {
        order_id: newOrder.id,
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: fullShippingAddress,
        total_amount: finalTotalINR,
        subtotal: rawTotalINR,
        discount_amount: totalDiscountINR,
        shipping_charge: baseShippingCharge,
        payment_method: paymentMethod,
        currency,
        items: cartItems.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          selected_timber: i.selectedTimber,
          unit_price: i.product.priceINR
        }))
      });

      // Send luxury HTML order confirmation & invoice email via Resend
      sendOrderConfirmationEmail({
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        items: cartItems.map(i => ({
          name: i.isGift ? `${i.product.name} (Free Gift)` : i.product.name,
          quantity: i.quantity,
          selectedTimber: i.selectedTimber,
          unitPrice: i.isGift ? 0 : i.product.priceINR
        })),
        totalAmount: finalTotalINR,
        subtotal: rawTotalINR,
        discountAmount: totalDiscountINR,
        shippingCharge: baseShippingCharge,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (Razorpay)',
        shippingAddress: formattedAddressStr,
      }).catch(err => console.warn('Resend email trigger notice:', err));

      // 5. If COD, complete order directly without Razorpay
      if (paymentMethod === 'cod') {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            payment_status: 'pending',
            payment_info: 'Cash on Delivery',
            updated_at: new Date().toISOString(),
          })
          .eq('id', newOrder.id);

        if (appliedCoupon && couponDiscountINR > 0) {
          recordCouponUsage(appliedCoupon.id, appliedCoupon.code, customerEmail, orderNumber, couponDiscountINR);
        }

        onClearCart();
        setInvoiceData({
          items: [...cartItems],
          customerName,
          customerEmail,
          customerPhone,
          address: formattedAddressStr,
          subtotal: rawTotalINR,
          discountAmount: totalDiscountINR,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          shipping: baseShippingCharge,
          codHandlingFee: codHandlingFee,
          gstAmount: gstAmountINR,
          gstRate: gstRate,
          total: finalTotalINR,
          invoiceNumber: orderNumber,
          paymentMethod: 'cod',
        });
        setShowInvoice(true);
        setIsProcessing(false);
        return; // Stop execution here
      }

      // 6. Create Order in Razorpay via Edge Function
      const rzpOrder = await createRazorpayOrder(
        finalTotalINR,
        currency,
        orderNumber,
        {
          order_id: newOrder.id,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }
      );

      // Link Razorpay Order ID to database order
      await supabase
        .from('orders')
        .update({ razorpay_order_id: rzpOrder.orderId })
        .eq('id', newOrder.id);

      // 6. Launch Razorpay Standard Checkout Modal
      const options = {
        key: rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TSSXHdcPyRcrR8',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        name: 'Swarna Wooden Crafts',
        description: `Order #${orderNumber} Handcrafted Heritage Sculptures`,
        image: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
        order_id: rzpOrder.orderId,
        handler: async (response: any) => {
          setIsProcessing(true);
          try {
            // Verify payment signature via Edge Function
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: newOrder.id,
              order_number: orderNumber,
            });

            // Update order status in Supabase directly as well
            await supabase
              .from('orders')
              .update({
                status: 'paid',
                payment_status: 'paid',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_info: `Razorpay Verified (${response.razorpay_payment_id})`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', newOrder.id);

            if (appliedCoupon && couponDiscountINR > 0) {
              recordCouponUsage(appliedCoupon.id, appliedCoupon.code, customerEmail, orderNumber, couponDiscountINR);
            }

            // Clear Cart
            onClearCart();

            // Dispatch order.paid webhook event
            dispatchWebhookEvent('order.paid', {
              order_id: newOrder.id,
              order_number: orderNumber,
              customer_name: customerName,
              customer_email: customerEmail,
              total_amount: finalTotalINR,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              currency,
            });

            // Set Invoice Data
            setInvoiceData({
              items: [...cartItems],
              customerName,
              customerEmail,
              customerPhone,
              address: formattedAddressStr,
              subtotal: rawTotalINR,
              discountAmount: totalDiscountINR,
              couponCode: appliedCoupon ? appliedCoupon.code : undefined,
              shipping: baseShippingCharge,
              codHandlingFee: 0,
              gstAmount: gstAmountINR,
              gstRate: gstRate,
              total: finalTotalINR,
              invoiceNumber: orderNumber,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              paymentMethod: 'prepaid',
            });

            setShowInvoice(true);
          } catch (verifyErr: any) {
            console.error('Payment verification failed:', verifyErr);
            // Even if client verification fails, webhook fallback handles it
            alert('Payment completed! We are confirming your transaction with our automated verification system.');
            onClearCart();
            setInvoiceData({
              items: [...cartItems],
              customerName,
              customerEmail,
              customerPhone,
              address: formattedAddressStr,
              subtotal: rawTotalINR,
              discountAmount: totalDiscountINR,
              couponCode: appliedCoupon ? appliedCoupon.code : undefined,
              shipping: baseShippingCharge,
              codHandlingFee: 0,
              gstAmount: gstAmountINR,
              gstRate: gstRate,
              total: finalTotalINR,
              invoiceNumber: orderNumber,
              razorpayPaymentId: response.razorpay_payment_id,
              paymentMethod: 'prepaid',
            });
            setShowInvoice(true);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          order_id: newOrder.id,
          order_number: orderNumber,
          craft_studio: 'Swarna Wooden Crafts, Karnataka',
        },
        theme: {
          color: '#1c1b1b',
          backdrop_color: 'rgba(28, 27, 27, 0.7)',
        },
        modal: {
          confirm_close: true,
          ondismiss: async () => {
            setIsProcessing(false);
            console.log('Payment modal dismissed by user');
            if (newOrder?.id) {
              await supabase
                .from('orders')
                .update({
                  status: 'cancelled',
                  payment_status: 'cancelled',
                  payment_info: 'Cancelled and exited by customer',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', newOrder.id);
            }
            setPendingCancelOrderInfo({
              id: newOrder.id,
              orderNumber,
              options,
            });
            setShowExitConfirmModal(true);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', (failResponse: any) => {
        console.error('Razorpay payment failed:', failResponse.error);
        setErrorMessage(
          failResponse.error?.description || 'Payment was unsuccessful or declined by your bank. Please try again.'
        );
        setIsProcessing(false);
      });

      razorpayInstance.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };


  return {
    state,
    setErrorMessage,
    handlePincodeChange,
    setErrors,
    pincodeValidation,
    showInvoice,
    setShowInvoice,
    errorMessage,
    address,
    geoAddressFound,
    customerEmail,
    setIsProcessing,
    handleNameChange,
    country,
    rawTotalINR,
    setCountryCode,
    city,
    handleCityChange,
    setCheckoutCouponInput,
    isProcessing,
    handleEmailChange,
    showExitConfirmModal,
    localities,
    setShowExitConfirmModal,
    customerName,
    errors,
    handleApplyCouponCheckout,
    handleSelectSavedAddress,
    countryCode,
    couponError,
    finalTotalINR,
    setAddress,
    handleClearSavedSessionInfo,
    selectedSavedAddressId,
    checkoutCalc,
    isCodAllowed,
    savedAddressesList,
    customerPhone,
    handlePhoneChange,
    handleAddNewAddressOption,
    appliedCoupon,
    couponDiscountINR,
    setCity,
    setPaymentMethod,
    handleRemoveCouponCheckout,
    isValidatingCoupon,
    gstAmountINR,
    checkoutCouponInput,
    pendingCancelOrderInfo,
    isFreeShippingCoupon,
    handleCountryChange,
    handleDetectLocation,
    codHandlingFee,
    gstRate,
    baseShippingCharge,
    handlePlaceOrder,
    setShouldSaveToAddressBook,
    couponSuccessMsg,
    prepaidDiscountINR,
    invoiceData,
    shouldSaveToAddressBook,
    paymentMethod,
    setState,
    isSessionRestored,
    getCouponDiscountText,
    postalCode,
    isLocating,
    cityValidation
  };
};
