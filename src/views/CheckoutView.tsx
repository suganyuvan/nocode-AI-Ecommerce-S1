import React, { useState, useEffect } from 'react';
import { CartItem, Currency, ActiveTab, Customer, Coupon, SavedAddress } from '../types';
import { formatPrice } from '../utils/currency';
import { InvoiceModal } from '../components/InvoiceModal';
import { supabase } from '../utils/supabaseClient';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '../utils/razorpay';
import { PINCODE_CITY_STATE_MAP, DEFAULT_SHIPPING_PAYMENT_SETTINGS, ALL_INDIAN_STATES } from '../admin/views/ShippingManager';
import { 
  validateIndianPincode, 
  validateCityWithState, 
  validateStreetAddress, 
  fetchLivePincodeData 
} from '../utils/pincodeValidator';
import { validateCoupon, recordCouponUsage } from '../utils/couponEngine';
import { PromotionalBanner } from '../components/PromotionalBanner';
import { getSavedAddressList, saveAddressToBook } from '../utils/addressBookManager';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';

import { trackCheckoutStart } from '../utils/pageViewAnalyticsEngine';

interface CheckoutViewProps {
  cartItems: CartItem[];
  currency: Currency;
  onClearCart: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  customer?: Customer | null;
}

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

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  currency,
  onClearCart,
  setActiveTab,
  onUpdateQuantity,
  onRemoveItem,
  customer,
}) => {
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
        name: 'Irisjev Wooden Crafts',
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
          craft_studio: 'Irisjev Wooden Crafts, Karnataka',
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

  const handleInvoiceClose = () => {
    setShowInvoice(false);
  };

  if (invoiceData && !showInvoice) {
    return (
      <div className="bg-[#fbf9f8] min-h-screen py-24 px-6 font-sans">
        <div className="max-w-2xl mx-auto bg-white p-12 border border-[#e4e2e2] shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-[#f4ebd0] text-[#735c00] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-5xl">verified</span>
          </div>
          <h4 className="font-headline-md text-3xl font-bold text-[#1b1c1c]">
            {invoiceData.paymentMethod === 'cod' ? 'Order Confirmed & Reserved!' : 'Payment Successful & Order Reserved!'}
          </h4>
          <p className="font-body-md text-base text-[#444748] leading-relaxed">
            Thank you, <strong>{invoiceData.customerName || 'Valued Collector'}</strong>.{' '}
            {invoiceData.paymentMethod === 'cod' 
              ? <span>Your order has been confirmed for <strong>Cash on Delivery</strong>.</span> 
              : <span>Your payment has been securely verified via <strong>Razorpay</strong>.</span>
            }{' '}
            Our master craftspeople will prepare your bespoke piece with custom heirloom packaging.
          </p>
          <div className="bg-[#f5f3f3] p-6 rounded-xs border border-[#c4c7c7] text-left text-sm font-label-caps space-y-2 inline-block mx-auto w-full mt-4">
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Order ID:</span>
              <strong className="text-[#1b1c1c]">#{invoiceData.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Payment Method:</span>
              <strong className="text-[#1b1c1c] uppercase">{invoiceData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</strong>
            </div>
            {invoiceData.razorpayPaymentId && (
              <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
                <span className="text-[#747878]">Razorpay Payment ID:</span>
                <strong className="font-mono text-xs text-[#735c00]">{invoiceData.razorpayPaymentId}</strong>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Craft Studio:</span>
              <span className="text-[#1b1c1c]">Irisjev Wooden Crafts, Karnataka</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Transit Insurance:</span>
              <span className="text-[#2e6930] font-bold">100% Fully Transit Insured</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#747878]">Concierge Updates:</span>
              <span className="text-[#1b1c1c]">{invoiceData.customerEmail || invoiceData.customerPhone}</span>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInvoice(true)}
              className="px-6 py-3.5 bg-white border-2 border-[#1c1b1b] text-[#1c1b1b] font-label-caps text-xs uppercase tracking-widest hover:bg-[#efeded] cursor-pointer font-bold"
            >
              View Tax Invoice
            </button>
            <button
              onClick={() => {
                setActiveTab('account');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-black cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-bold"
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              Track in My Orders
            </button>
            <button
              onClick={() => {
                setActiveTab('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-transparent text-[#747878] hover:text-[#1b1c1c] font-label-caps text-xs uppercase tracking-widest cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.filter(i => !i.isGift).length === 0 && !showInvoice) {
    return (
      <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto bg-white p-10 border border-[#e4e2e2] shadow-sm rounded-xs">
          <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">shopping_bag</span>
          <h2 className="font-headline-md text-2xl font-bold text-[#1b1c1c]">Your Cart is Empty</h2>
          <p className="text-sm text-[#747878]">
            Your shopping cart is currently empty. Explore our collection of authentic handcrafted sculptures.
          </p>
          <button
            onClick={() => setActiveTab('shop')}
            className="mt-6 px-8 py-3 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-sm w-full"
          >
            Explore Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9f8] min-h-screen py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-md text-3xl font-bold text-[#1b1c1c] uppercase tracking-wider">
              Secure Checkout
            </h1>
            <p className="text-xs text-[#747878] font-label-caps uppercase tracking-widest mt-1">
              Encrypted 256-Bit Gateway Powered by Razorpay
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 border border-[#e4e2e2] rounded-xs shadow-2xs">
            <span className="flex items-center gap-1.5 text-xs text-[#2e6930] font-semibold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              100% Buyer Protection
            </span>
            <span className="text-[#c4c7c7]">|</span>
            <span className="flex items-center gap-1.5 text-xs text-[#444748] font-medium">
              <span className="material-symbols-outlined text-sm">lock</span>
              PCI-DSS Compliant
            </span>
          </div>
        </div>

        {/* Promotional Banner Slot for Checkout */}
        <div className="mb-8">
          <PromotionalBanner targetPage="checkout_top" />
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm flex items-start gap-3 rounded-xs">
            <span className="material-symbols-outlined text-red-600">error</span>
            <div className="flex-1">
              <p className="font-bold">Delivery & Checkout Notice</p>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Delivery & Payment Details */}
          <div className="flex-1 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} noValidate className="bg-white p-8 border border-[#e4e2e2] shadow-sm space-y-8">
              
              {/* Delivery Information */}
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-[#e4e2e2] pb-2">
                  <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center text-xs">1</span>
                    Delivery Information
                  </h5>
                  <span className="text-xs text-[#747878] font-label-caps uppercase">White-Glove Courier</span>
                </div>

                {/* Multiple Saved Addresses Picker (if available) */}
                {savedAddressesList.length > 0 && (
                  <div className="space-y-2 p-3.5 bg-[#faf9f8] border border-[#e4e2e2] rounded-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-label-caps uppercase text-[#735c00] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">home_pin</span>
                        Select from Saved Addresses ({savedAddressesList.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNewAddressOption}
                        className={`text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                          !selectedSavedAddressId
                            ? 'text-[#1c1b1b] underline'
                            : 'text-[#735c00] hover:text-[#1c1b1b]'
                        }`}
                      >
                        + New Delivery Address
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {savedAddressesList.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-3 rounded-xs border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white border-[#1c1b1b] ring-1 ring-[#1c1b1b] shadow-xs'
                                : 'bg-white/80 border-[#e4e2e2] hover:border-[#c4c7c7] text-[#444748]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold font-label-caps uppercase text-[10px] text-[#1c1b1b]">
                                {addr.label || 'Saved Address'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] bg-[#fed65b]/30 text-[#735c00] font-bold px-1.5 py-0.2 rounded-full">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="material-symbols-outlined text-sm text-[#2e6930]">check_circle</span>
                              )}
                            </div>
                            <p className="font-bold text-[#1b1c1c] truncate">{addr.fullName}</p>
                            <p className="text-[11px] text-[#747878] truncate">
                              {addr.address}, {addr.city} ({addr.postalCode})
                            </p>
                            {(addr.email || customer?.email) && (
                              <p className="text-[10px] text-[#747878] truncate flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[12px] text-[#735c00]">mail</span>
                                <span>{addr.email || customer?.email}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isSessionRestored && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-emerald-700">history</span>
                      <span className="font-semibold">Restored your saved delivery details from this session</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSavedSessionInfo}
                      className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                    >
                      Clear Saved Info
                    </button>
                  </div>
                )}

                {/* GPS Location Quick Autofill Bar (Optional) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#faf9f6] border border-[#e4e2e2] rounded-xs">
                  <div className="flex items-center gap-2.5 text-xs text-[#444748]">
                    <span className="material-symbols-outlined text-base text-[#735c00]">my_location</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-[#1b1c1c]">Live Address Detection</span>
                      <span className="text-[10px] font-bold text-[#747878] bg-gray-100 px-1.5 py-0.5 rounded-xs uppercase tracking-wider">Optional</span>
                      <span className="text-[11px] text-[#747878] hidden md:inline">
                        — {geoAddressFound ? `Detected: ${geoAddressFound.slice(0, 45)}...` : 'Quickly autofill address & PIN via GPS'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="px-3 py-1.5 bg-white border border-[#c4c7c7] text-[#1c1b1b] rounded-xs text-xs font-semibold hover:bg-[#1c1b1b] hover:text-white hover:border-[#1c1b1b] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs disabled:opacity-60"
                  >
                    {isLocating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Detecting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">near_me</span>
                        Autofill via GPS (Optional)
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={handleNameChange}
                      placeholder="e.g. Ananya Rao"
                      className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                        errors.customerName ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={handleEmailChange}
                      placeholder="name@domain.com"
                      className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                        errors.customerEmail ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                      }`}
                    />
                    {errors.customerEmail && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.customerEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country Code + Phone Number */}
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                    Phone Number (for Transit Updates & OTP) <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-28 p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm font-medium focus:outline-none focus:border-[#1c1b1b]"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      placeholder={countryCode === '+91' ? '9876543210' : 'Phone number'}
                      className={`flex-1 p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                        errors.customerPhone ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                      }`}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.customerPhone}
                    </p>
                  )}
                </div>

                {/* Street Address & Locality Suggestions */}
                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                    Street Address / Landmark <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                    }}
                    placeholder="House/Apartment #, Street, Colony, Landmark..."
                    className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                      errors.address ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.address}
                    </p>
                  )}

                  {/* Clickable Locality Suggestions from India Post API */}
                  {localities.length > 0 && (
                    <div className="mt-2 p-2.5 bg-[#fbf9f8] border border-[#e4e2e2] rounded-xs space-y-1.5 animate-fadeIn">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#735c00] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pin_drop</span>
                        Suggested Postal Areas in {city || 'PIN ' + postalCode} (Click to add):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {localities.slice(0, 10).map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              if (!address.toLowerCase().includes(loc.toLowerCase())) {
                                setAddress(prev => prev ? `${loc}, ${prev}` : loc);
                                if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                              }
                            }}
                            className="text-[11px] px-2.5 py-1 bg-white border border-[#c4c7c7] rounded-full hover:border-[#1c1b1b] hover:bg-[#1c1b1b] hover:text-white transition-all cursor-pointer font-medium shadow-2xs"
                          >
                            + {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Country, State, City, PIN Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Country Selector */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      Country <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm font-medium focus:outline-none focus:border-[#1c1b1b]"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State Selector */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      State / UT <span className="text-red-600">*</span>
                    </label>
                    {country === 'India' ? (
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          if (errors.state) setErrors(prev => ({ ...prev, state: undefined }));
                          if (errors.city) setErrors(prev => ({ ...prev, city: undefined }));
                        }}
                        className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                          errors.state ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                        }`}
                      >
                        <option value="">Select State</option>
                        {ALL_INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          if (errors.state) setErrors(prev => ({ ...prev, state: undefined }));
                        }}
                        placeholder="State / Province"
                        className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                          errors.state ? 'border-red-500 bg-red-50/20 focus:border-red-600' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                        }`}
                      />
                    )}
                    {errors.state && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.state}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={handleCityChange}
                      placeholder="e.g. Bengaluru"
                      className={`w-full p-3 border rounded-xs bg-white text-sm focus:outline-none transition-colors ${
                        (errors.city || (country === 'India' && cityValidation && !cityValidation.isValid))
                          ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                          : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.city}</p>
                    )}

                    {/* City vs State Mismatch Warning & 1-Click Fix */}
                    {country === 'India' && cityValidation && !cityValidation.isValid && (
                      <div className="mt-1.5 space-y-1 bg-red-50 p-2 rounded-xs border border-red-200 animate-fadeIn">
                        <p className="text-[11px] text-red-700 font-semibold leading-tight flex items-start gap-1">
                          <span className="material-symbols-outlined text-[13px] text-red-600 mt-0.5 shrink-0">cancel</span>
                          <span>{cityValidation.message}</span>
                        </p>
                        {cityValidation.expectedState && (
                          <button
                            type="button"
                            onClick={() => {
                              setState(cityValidation.expectedState!);
                              if (errors.state) setErrors(prev => ({ ...prev, state: undefined }));
                              if (errors.city) setErrors(prev => ({ ...prev, city: undefined }));
                            }}
                            className="text-[10px] text-red-800 underline font-bold hover:text-red-950 block pl-4 cursor-pointer text-left"
                          >
                            Click to sync State to {cityValidation.expectedState}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PIN / ZIP Code */}
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                      {country === 'India' ? 'PIN Code (6 digits)' : 'ZIP / Postal'} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={postalCode}
                        onChange={handlePincodeChange}
                        placeholder={country === 'India' ? '560001' : 'ZIP Code'}
                        className={`w-full p-3 pr-8 border rounded-xs text-sm focus:outline-none transition-colors ${
                          country === 'India' && pincodeValidation?.status === 'valid'
                            ? 'border-[#2e6930] bg-[#f4f9f4] text-[#1b1c1c]'
                            : country === 'India' && pincodeValidation?.status === 'mismatch'
                            ? 'border-red-500 bg-red-50/20 text-[#1b1c1c]'
                            : errors.postalCode
                            ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                            : 'border-[#c4c7c7] bg-white focus:border-[#1c1b1b]'
                        }`}
                      />
                      {country === 'India' && postalCode.length === 6 && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          {pincodeValidation?.status === 'valid' ? (
                            <span className="material-symbols-outlined text-[#2e6930] text-lg">check_circle</span>
                          ) : pincodeValidation?.status === 'mismatch' ? (
                            <span className="material-symbols-outlined text-red-600 text-lg">cancel</span>
                          ) : null}
                        </span>
                      )}
                    </div>

                    {/* Green detected message */}
                    {country === 'India' && pincodeValidation?.status === 'valid' && (
                      <div className="mt-1.5 flex items-start gap-1 text-[11px] text-[#2e6930] font-semibold bg-[#eaf5eb] px-2 py-1.5 rounded-xs border border-[#c3e6c6]">
                        <span className="material-symbols-outlined text-[13px] shrink-0 text-[#2e6930] mt-0.5">check_circle</span>
                        <span>{pincodeValidation.message}</span>
                      </div>
                    )}

                    {/* Red mismatch warning with auto-switch state button */}
                    {country === 'India' && pincodeValidation?.status === 'mismatch' && (
                      <div className="mt-1.5 space-y-1 bg-red-50 px-2 py-1.5 rounded-xs border border-red-200">
                        <div className="flex items-start gap-1 text-[11px] text-red-700 font-semibold leading-tight">
                          <span className="material-symbols-outlined text-[13px] shrink-0 text-red-600 mt-0.5">cancel</span>
                          <span>{pincodeValidation.message}</span>
                        </div>
                        {pincodeValidation.detectedState && (
                          <button
                            type="button"
                            onClick={() => {
                              setState(pincodeValidation.detectedState!);
                              if (pincodeValidation.detectedCity) setCity(pincodeValidation.detectedCity);
                              if (errors.state) setErrors(prev => ({ ...prev, state: undefined }));
                              if (errors.postalCode) setErrors(prev => ({ ...prev, postalCode: undefined }));
                            }}
                            className="text-[10px] text-red-800 underline font-bold hover:text-red-950 block pl-4 cursor-pointer text-left"
                          >
                            Click to sync State to {pincodeValidation.detectedState}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Incomplete helper */}
                    {country === 'India' && pincodeValidation?.status === 'incomplete' && postalCode.length > 0 && (
                      <p className="text-[10px] text-[#747878] mt-1 pl-1">
                        {pincodeValidation.message}
                      </p>
                    )}

                    {errors.postalCode && pincodeValidation?.status !== 'mismatch' && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Delivery Zone Map & Transit Hub Card */}
                {(city || postalCode) && (
                  <div className="p-3.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#2e6930]">fmd_good</span>
                        <span className="text-xs font-bold text-[#1b1c1c] uppercase tracking-wider">
                          Verified Destination: {city ? `${city}, ` : ''}{state} {postalCode ? `(${postalCode})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#735c00] bg-[#fed65b]/20 px-2 py-0.5 rounded-full">
                        {checkoutCalc.matchedProfileName}
                      </span>
                    </div>

                    {/* Embedded OpenStreetMap Preview */}
                    <div className="w-full h-32 rounded-xs overflow-hidden border border-[#e4e2e2] relative bg-[#eee]">
                      <iframe
                        title="Delivery Location Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${address ? address + ', ' : ''}${city || ''}, ${state || ''} ${postalCode || ''}, ${country || 'India'}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full grayscale-25 hover:grayscale-0 transition-all pointer-events-none"
                      />
                    </div>
                  </div>
                )}

                {/* Save to Address Book Checkbox */}
                <div className="p-3 bg-[#faf9f8] border border-[#e4e2e2] rounded-xs flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-xs text-[#1b1c1c] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldSaveToAddressBook}
                      onChange={(e) => setShouldSaveToAddressBook(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1c1b1b] focus:ring-0 cursor-pointer"
                    />
                    <span>Save this delivery address to my Saved Address Book for future 1-click checkouts</span>
                  </label>
                  <span className="material-symbols-outlined text-sm text-[#735c00]">bookmark_added</span>
                </div>
              </div>

              {/* Payment Gateway Information */}
              <div className="space-y-5 pt-2">
                <div className="flex justify-between items-center border-b border-[#e4e2e2] pb-2">
                  <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center text-xs">2</span>
                    Payment Method
                  </h5>
                  <span className="text-xs text-[#735c00] font-bold font-label-caps flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Instant & Secure
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Prepaid Option */}
                  <label 
                    className={`flex items-start gap-4 p-5 border-2 rounded-xs cursor-pointer transition-colors ${paymentMethod === 'prepaid' ? 'border-[#1c1b1b] bg-[#fbf9f8]' : 'border-[#e4e2e2] bg-white hover:border-[#c4c7c7]'}`}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="prepaid" 
                      checked={paymentMethod === 'prepaid'} 
                      onChange={() => setPaymentMethod('prepaid')}
                      className="mt-1 w-4 h-4 accent-[#1c1b1b]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-md font-bold text-base text-[#1b1c1c] block">
                          Pay Online (Razorpay)
                        </span>
                        <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6 w-auto opacity-90" />
                      </div>
                      <span className="text-xs text-[#444748] block mt-1">
                        UPI, Credit/Debit Cards, NetBanking, EMI & Wallets
                      </span>
                    </div>
                  </label>

                  {/* COD Option */}
                  <label 
                    className={`flex items-start gap-4 p-5 border-2 rounded-xs transition-colors ${!isCodAllowed ? 'opacity-50 cursor-not-allowed border-[#e4e2e2] bg-gray-50' : paymentMethod === 'cod' ? 'border-[#1c1b1b] bg-[#fbf9f8] cursor-pointer' : 'border-[#e4e2e2] bg-white hover:border-[#c4c7c7] cursor-pointer'}`}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                      disabled={!isCodAllowed}
                      className="mt-1 w-4 h-4 accent-[#1c1b1b]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-headline-md font-bold text-base block ${!isCodAllowed ? 'text-[#747878]' : 'text-[#1b1c1c]'}`}>
                          Cash on Delivery (COD)
                        </span>
                        <span className="material-symbols-outlined text-[#747878]">local_shipping</span>
                      </div>
                      <span className="text-xs text-[#444748] block mt-1">
                        Pay at your doorstep with Cash or UPI. 
                        {!isCodAllowed && (
                          <span className="text-[#ba1a1a] font-semibold block mt-1">
                            {checkoutCalc.codDisabledReason || 'Not available for the selected area.'}
                          </span>
                        )}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Preview */}
          <div className="w-full lg:w-96 space-y-6">
            <div className="bg-white p-6 border border-[#e4e2e2] shadow-sm space-y-4 sticky top-6">
              <h4 className="font-headline-md text-lg font-bold border-b border-[#e4e2e2] pb-2">Order Summary</h4>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-3 items-center bg-[#fbf9f8] p-2 rounded-xs border border-[#e4e2e2] relative group">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xs border border-[#c4c7c7]/30"
                    />
                    <div className="flex-1">
                      <h5 className="font-headline-md font-semibold text-sm text-[#1b1c1c] leading-tight pr-6">
                        {item.product.name}
                      </h5>
                      <span className="text-[11px] font-body-md text-[#735c00] block mt-0.5">
                        {item.selectedTimber}
                      </span>
                        <p className="font-headline-md font-bold text-sm text-[#1b1c1c] text-right">
                          {item.isGift ? (
                             <span className="text-[#2e6930]">FREE</span>
                          ) : (
                             formatPrice(item.product.priceINR * item.quantity, currency)
                          )}
                        </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer bg-white shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-label-caps px-1">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer bg-white shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="absolute top-2 right-2 text-[#747878] hover:text-[#ba1a1a] p-1 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Promo Code Input inside Checkout Order Summary */}
              <div className="bg-[#f5f3f3] p-3 rounded-xs border border-[#c4c7c7] space-y-2 mt-4">
                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCouponCheckout} className="flex gap-2">
                    <input
                      type="text"
                      value={checkoutCouponInput}
                      onChange={(e) => setCheckoutCouponInput(e.target.value.toUpperCase())}
                      placeholder="Promo Code (e.g. WELCOME10)"
                      className="flex-1 bg-white border border-[#c4c7c7] px-3 py-1.5 text-xs font-label-caps uppercase rounded-xs focus:outline-none focus:border-[#1c1b1b]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponCheckout}
                      disabled={isValidatingCoupon}
                      className="bg-[#1c1b1b] text-white px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider rounded-xs hover:opacity-90 cursor-pointer disabled:opacity-50 font-bold shrink-0"
                    >
                      {isValidatingCoupon ? '...' : 'Apply'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-white p-3 rounded-xs border border-[#2e6930] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#2e6930] uppercase flex items-center gap-1">
                        🎉 {appliedCoupon.code} APPLIED
                      </span>
                      <span className="font-bold text-xs text-[#2e6930]">
                        -{formatPrice(couponDiscountINR, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#eaf5eb]">
                      <span className="text-[11px] font-semibold text-[#2e6930]">
                        {getCouponDiscountText(appliedCoupon, rawTotalINR)}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCouponCheckout}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer ml-2 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {couponError && <p className="text-[11px] text-[#ba1a1a] font-medium">{couponError}</p>}
                {couponSuccessMsg && !appliedCoupon && (
                  <p className="text-[11px] text-[#2e6930] font-bold">
                    {couponSuccessMsg}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#e4e2e2] space-y-2 text-sm font-label-caps">
                <div className="flex justify-between text-[#444748]">
                  <span>Subtotal:</span>
                  <span>{formatPrice(rawTotalINR, currency)}</span>
                </div>
                {prepaidDiscountINR > 0 && (
                  <div className="flex justify-between text-[#2e6930] font-semibold">
                    <span>Prepaid Discount:</span>
                    <span>-{formatPrice(prepaidDiscountINR, currency)}</span>
                  </div>
                )}
                {couponDiscountINR > 0 && appliedCoupon && (
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[#2e6930] font-bold">
                      <span>Coupon ({appliedCoupon.code}):</span>
                      <span>-{formatPrice(couponDiscountINR, currency)}</span>
                    </div>
                    <p className="text-[10px] text-[#2e6930] text-right font-semibold">
                      {getCouponDiscountText(appliedCoupon, rawTotalINR)}
                    </p>
                  </div>
                )}
                <div className="flex justify-between text-[#444748]">
                  <span>Insured Shipping:</span>
                  <span>{isFreeShippingCoupon ? (
                    <span className="text-[#2e6930] font-bold">FREE (Coupon {appliedCoupon.code})</span>
                  ) : baseShippingCharge === 0 && checkoutCalc.isFreeQualified ? (
                    <span className="text-[#2e6930] font-bold">FREE (Qualified)</span>
                  ) : (
                    formatPrice(baseShippingCharge, currency)
                  )}</span>
                </div>
                {paymentMethod === 'cod' && codHandlingFee > 0 && (
                  <div className="flex justify-between text-[#735c00] font-semibold">
                    <span>COD Handling Fee:</span>
                    <span>+{formatPrice(codHandlingFee, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#444748]">
                  <span>GST ({gstRate}%):</span>
                  <span>{formatPrice(gstAmountINR, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-[#000000] border-t border-[#e4e2e2] pt-3 mt-1">
                  <span>Total Payable:</span>
                  <span>{formatPrice(finalTotalINR, currency)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className={`w-full py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest shadow-md mt-6 flex items-center justify-center gap-2 ${
                  isProcessing ? 'opacity-70 cursor-wait' : 'hover:opacity-90 cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Order...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">{paymentMethod === 'cod' ? 'local_shipping' : 'lock'}</span>
                    {paymentMethod === 'cod' ? 'Confirm COD Order' : 'Proceed to Pay with Razorpay'}
                  </>
                )}
              </button>

              <div className="text-center flex items-center justify-center gap-1.5 text-[11px] text-[#747878] font-label-caps uppercase pt-4 border-t border-[#e4e2e2]">
                <span className="material-symbols-outlined text-[14px] text-[#2e6930]">shield_lock</span>
                Automated Fallback Webhook System Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvoice && invoiceData && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={handleInvoiceClose}
          cartItems={invoiceData.items}
          customerName={invoiceData.customerName}
          address={invoiceData.address}
          currency={currency}
          subtotal={invoiceData.subtotal}
          discountAmount={invoiceData.discountAmount}
          couponCode={invoiceData.couponCode}
          shipping={invoiceData.shipping}
          gstAmount={invoiceData.gstAmount}
          gstRate={invoiceData.gstRate}
          total={invoiceData.total}
          invoiceNumber={invoiceData.invoiceNumber}
          razorpayPaymentId={invoiceData.razorpayPaymentId}
          paymentMethod={invoiceData.paymentMethod}
          codHandlingFee={invoiceData.codHandlingFee}
        />
      )}

      {/* EXIT CONFIRMATION MODAL WITH CANCEL AND EXIT BUTTON */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-gray-100 relative">
            <button 
              onClick={() => setShowExitConfirmModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#1b1c1c]">logout</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1b1c1c]">Are you sure you want to exit?</h3>
              <p className="text-xs text-gray-500 font-medium">
                You will be taken back to Irisjev Wooden Crafts website
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  if (pendingCancelOrderInfo?.options) {
                    const rzp = new window.Razorpay(pendingCancelOrderInfo.options);
                    rzp.open();
                  }
                }}
                className="w-full py-3 bg-white border border-gray-300 rounded-xl text-xs font-extrabold text-[#1b1c1c] hover:bg-gray-50 transition-colors cursor-pointer shadow-2xs"
              >
                Continue to payment
              </button>

              <button
                onClick={async () => {
                  setShowExitConfirmModal(false);
                  setIsProcessing(false);
                  if (pendingCancelOrderInfo?.id) {
                    await supabase
                      .from('orders')
                      .update({
                        status: 'cancelled',
                        payment_status: 'cancelled',
                        payment_info: 'Cancelled and exited by customer',
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', pendingCancelOrderInfo.id);
                  }
                  setErrorMessage(`Order payment was cancelled and order #${pendingCancelOrderInfo?.orderNumber || ''} has been marked as cancelled.`);
                }}
                className="w-full py-3 bg-[#0d1312] text-white rounded-xl text-xs font-extrabold hover:bg-black transition-colors cursor-pointer shadow-md"
              >
                Cancel and Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
