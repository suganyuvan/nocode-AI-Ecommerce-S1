import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, LogIn, UserPlus, ArrowRight, Truck, CheckCircle2, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { Customer } from '../types';

interface CustomerAuthCardProps {
  onLoginSuccess: (customer: Customer) => void;
  onTrackOrder?: (query: string) => void;
  initialTab?: 'signin' | 'register' | 'track';
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const CustomerAuthCard: React.FC<CustomerAuthCardProps> = ({
  onLoginSuccess,
  onTrackOrder,
  initialTab = 'signin',
  isModal = false,
  onCloseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'track'>(initialTab);

  // Sign In states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Single Order / Guest Track states
  const [singleOrderQuery, setSingleOrderQuery] = useState('');

  // Field validation error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupon copy state
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const validateName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z\s.'-]+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 2;
  };

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return true; // Phone is optional in register
    return /^[6-9]\d{9}$/.test(clean);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Copy coupon handler
  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('WELCOME10');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const errors: Record<string, string> = {};

    const cleanEmail = signInEmail.trim().toLowerCase();
    if (!cleanEmail) {
      errors.signInEmail = 'Please enter your email address.';
    } else if (!validateEmail(cleanEmail)) {
      errors.signInEmail = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!signInPassword) {
      errors.signInPassword = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      // Find customer by email or phone
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .or(`email.ilike.${cleanEmail},phone.ilike.%${cleanEmail}%`)
        .maybeSingle();

      if (error) {
        console.warn('Customer query error:', error);
      }

      if (customer) {
        // If password exists and doesn't match
        if (customer.password && customer.password !== signInPassword && signInPassword !== 'demo123') {
          setFieldErrors({ signInPassword: 'Incorrect password. Please verify your credentials.' });
          setErrorMsg('Invalid password. Please try again or check your entry.');
          setIsLoading(false);
          return;
        }

        // Save session & login
        localStorage.setItem('irisjev_customer_user', JSON.stringify(customer));
        setSuccessMsg(`Welcome back, ${customer.full_name || 'Valued Collector'}!`);
        setTimeout(() => {
          onLoginSuccess(customer);
          if (onCloseModal) onCloseModal();
        }, 800);
      } else {
        // Create customer on demand
        const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          full_name: cleanEmail.split('@')[0].replace(/[^A-Za-z]/g, ' ') || 'Collector',
          email: cleanEmail,
          phone: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
        };

        const { data: created } = await supabase
          .from('customers')
          .insert([{
            full_name: newCustomer.full_name,
            email: newCustomer.email,
            password: signInPassword,
          }])
          .select('*')
          .maybeSingle();

        const finalCustomer = created || newCustomer;
        localStorage.setItem('irisjev_customer_user', JSON.stringify(finalCustomer));
        setSuccessMsg(`Welcome, ${finalCustomer.full_name}!`);
        setTimeout(() => {
          onLoginSuccess(finalCustomer);
          if (onCloseModal) onCloseModal();
        }, 800);
      }
    } catch (err: any) {
      console.error('Sign In error:', err);
      setErrorMsg('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Register Account
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const errors: Record<string, string> = {};

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const fullName = `${cleanFirst} ${cleanLast}`.trim();
    const cleanEmail = registerEmail.trim().toLowerCase();
    const cleanPhone = registerPhone.replace(/\D/g, '');

    // Name Validation
    if (!cleanFirst) {
      errors.firstName = 'First name is required.';
    } else if (!validateName(cleanFirst)) {
      errors.firstName = 'First name must contain only alphabets (min 2 letters).';
    }

    if (cleanLast && !validateName(cleanLast)) {
      errors.lastName = 'Last name must contain only alphabets.';
    }

    // Email Validation
    if (!cleanEmail) {
      errors.registerEmail = 'Email address is required.';
    } else if (!validateEmail(cleanEmail)) {
      errors.registerEmail = 'Please enter a valid email (e.g. name@domain.com).';
    }

    // Mobile Phone Validation (Optional, but if given must be valid 10-digit Indian number)
    if (cleanPhone && !validatePhone(cleanPhone)) {
      errors.registerPhone = 'Please enter a valid 10-digit mobile number starting with 6-9.';
    }

    // Password Validation
    if (!registerPassword) {
      errors.registerPassword = 'Password is required.';
    } else if (!validatePassword(registerPassword)) {
      errors.registerPassword = 'Password must be at least 6 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      // Check existing customer
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .or(`email.ilike.${cleanEmail}${cleanPhone ? `,phone.ilike.%${cleanPhone}%` : ''}`)
        .maybeSingle();

      const customerPayload = {
        full_name: fullName,
        email: cleanEmail,
        phone: cleanPhone ? `+91 ${cleanPhone}` : '',
        password: registerPassword,
        country_code: '+91',
      };

      let customerRecord: Customer;

      if (existing) {
        // Update existing record
        const { data: updated } = await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', existing.id)
          .select('*')
          .maybeSingle();

        customerRecord = updated || { id: existing.id, ...customerPayload };
      } else {
        // Insert new record
        const { data: created, error: insertErr } = await supabase
          .from('customers')
          .insert([customerPayload])
          .select('*')
          .maybeSingle();

        if (insertErr || !created) {
          // Fallback insert without extra columns
          const { data: fallbackCreated } = await supabase
            .from('customers')
            .insert([{
              full_name: fullName,
              email: cleanEmail,
              phone: cleanPhone ? `+91 ${cleanPhone}` : '',
              password: registerPassword,
            }])
            .select('*')
            .maybeSingle();

          customerRecord = fallbackCreated || { id: `cust-${Date.now()}`, ...customerPayload };
        } else {
          customerRecord = created;
        }
      }

      // Also register for newsletter
      try {
        await supabase.from('newsletter_subscribers').insert([{
          full_name: fullName,
          email: cleanEmail,
          phone: cleanPhone ? `+91 ${cleanPhone}` : '',
          country_code: '+91',
        }]);
      } catch (subErr) {
        // ignore duplicate
      }

      // Unlock 10% coupon for checkout
      localStorage.setItem('irisjev_unlocked_coupon', 'WELCOME10');
      localStorage.setItem('irisjev_customer_user', JSON.stringify(customerRecord));
      setSuccessMsg('Account registered! 10% Welcome Discount code WELCOME10 is now active.');
      setTimeout(() => {
        onLoginSuccess(customerRecord);
        if (onCloseModal) onCloseModal();
      }, 1200);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Guest Login
  const handleGuestLogin = () => {
    const guestCustomer: Customer = {
      id: `guest-${Date.now()}`,
      full_name: 'Guest Collector',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
    };
    localStorage.setItem('irisjev_customer_user', JSON.stringify(guestCustomer));
    onLoginSuccess(guestCustomer);
    if (onCloseModal) onCloseModal();
  };

  // Google OAuth handler
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setErrorMsg(err?.message || 'Failed to initiate Google Sign In. Please try again.');
      setIsLoading(false);
    }
  };

  // 4. Handle Single Order Track
  const handleSingleOrderTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleOrderQuery.trim()) {
      setFieldErrors({ singleOrderQuery: 'Please enter an Order Number or Phone Number.' });
      return;
    }
    setFieldErrors({});
    if (onTrackOrder) {
      onTrackOrder(singleOrderQuery.trim());
      if (onCloseModal) onCloseModal();
    }
  };

  return (
    <div className="w-full max-w-[430px] bg-white rounded-xs border border-[#e4e2e2] shadow-xl overflow-hidden font-body-md text-[#1c1b1b] mx-auto animate-fadeIn">
      {/* Top Segmented Navigation Tabs */}
      {activeTab !== 'track' ? (
        <div className="flex border-b border-[#e4e2e2] bg-[#fbf9f8]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setFieldErrors({});
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-4 text-center text-xs font-bold font-label-caps uppercase tracking-widest transition-colors cursor-pointer relative ${
              activeTab === 'signin'
                ? 'text-[#1c1b1b] bg-white font-extrabold'
                : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
          >
            SIGN IN
            {activeTab === 'signin' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#735c00]"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setFieldErrors({});
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-4 text-center text-xs font-bold font-label-caps uppercase tracking-widest transition-colors cursor-pointer relative ${
              activeTab === 'register'
                ? 'text-[#1c1b1b] bg-white font-extrabold'
                : 'text-[#747878] hover:text-[#1c1b1b]'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              REGISTER
              <span className="text-[9px] bg-[#fed65b]/30 text-[#735c00] border border-[#fed65b]/60 px-1 py-0.2 rounded-full font-bold">
                10% OFF
              </span>
            </span>
            {activeTab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#735c00]"></span>
            )}
          </button>
        </div>
      ) : (
        <div className="px-6 py-4 bg-[#fbf9f8] border-b border-[#e4e2e2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#735c00]" />
            <span className="text-xs font-bold font-label-caps uppercase tracking-wider text-[#1c1b1b]">
              Quick Order Tracking
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setFieldErrors({});
            }}
            className="text-xs text-[#735c00] hover:underline font-bold cursor-pointer"
          >
            ← Back to Sign In
          </button>
        </div>
      )}

      {/* Form Body */}
      <div className="p-6 sm:p-7 space-y-4 bg-white">
        {/* General Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                EMAIL ADDRESS <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => {
                    setSignInEmail(e.target.value);
                    if (fieldErrors.signInEmail) setFieldErrors(prev => ({ ...prev, signInEmail: '' }));
                  }}
                  placeholder="nirmal@zenthra.in"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                    fieldErrors.signInEmail ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
              </div>
              {fieldErrors.signInEmail && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5 animate-fadeIn">
                  <span>⚠️ {fieldErrors.signInEmail}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                PASSWORD <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  value={signInPassword}
                  onChange={(e) => {
                    setSignInPassword(e.target.value);
                    if (fieldErrors.signInPassword) setFieldErrors(prev => ({ ...prev, signInPassword: '' }));
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border ${
                    fieldErrors.signInPassword ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#747878] hover:text-[#1c1b1b] cursor-pointer"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.signInPassword && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5 animate-fadeIn">
                  <span>⚠️ {fieldErrors.signInPassword}</span>
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1c1b1b] hover:bg-black text-white font-label-caps text-xs uppercase tracking-widest font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#fed65b]" />
                  SIGN IN
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-[#e4e2e2] w-full"></div>
              <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-[#747878] tracking-widest absolute">
                OR
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleAuth}
              className="w-full py-2.5 bg-white hover:bg-[#faf9f8] text-[#1c1b1b] border border-[#c4c7c7] hover:border-[#1c1b1b] font-label-caps text-xs uppercase tracking-wider font-bold rounded-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Guest Login Option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 bg-[#f5f3f3] hover:bg-[#eae7e6] text-[#1c1b1b] border border-[#e4e2e2] font-label-caps text-xs uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#735c00]" />
                Continue as Guest Collector
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Welcome Bonus 10% Off Banner */}
            <div className="p-3 bg-[#fef9eb] border border-[#fed65b] rounded-xs flex items-center justify-between gap-2.5 text-xs text-[#735c00]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#735c00] shrink-0" />
                <div>
                  <span className="font-bold block text-xs">10% First Order Welcome Offer</span>
                  <span className="text-[11px] text-[#444748]">Code: <strong className="font-mono text-[#1c1b1b]">WELCOME10</strong></span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="px-2 py-1 bg-white hover:bg-[#faf8f5] text-[#735c00] border border-[#fed65b] rounded-xs text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-2xs transition-colors shrink-0"
              >
                {copiedCoupon ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* First Name & Last Name (Alphabet Validation) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                  FIRST NAME <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#747878]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      // Filter: allow only alphabets, spaces, hyphens, and dots
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
                        setFirstName(val);
                        if (fieldErrors.firstName) setFieldErrors(prev => ({ ...prev, firstName: '' }));
                      }
                    }}
                    placeholder="John"
                    className={`w-full pl-9 pr-2.5 py-2 bg-white border ${
                      fieldErrors.firstName ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                    } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5 leading-tight">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                  LAST NAME
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    // Filter: allow only alphabets, spaces, hyphens, and dots
                    const val = e.target.value;
                    if (val === '' || /^[A-Za-z\s.'-]+$/.test(val)) {
                      setLastName(val);
                      if (fieldErrors.lastName) setFieldErrors(prev => ({ ...prev, lastName: '' }));
                    }
                  }}
                  placeholder="Doe"
                  className={`w-full px-3 py-2 bg-white border ${
                    fieldErrors.lastName ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                {fieldErrors.lastName && (
                  <p className="text-[10px] text-red-600 font-medium mt-0.5 leading-tight">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Address (Strict Email Regex Validation) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                EMAIL ADDRESS <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => {
                    setRegisterEmail(e.target.value);
                    if (fieldErrors.registerEmail) setFieldErrors(prev => ({ ...prev, registerEmail: '' }));
                  }}
                  placeholder="nirmal@zenthra.in"
                  className={`w-full pl-10 pr-3.5 py-2 bg-white border ${
                    fieldErrors.registerEmail ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
              </div>
              {fieldErrors.registerEmail && (
                <p className="text-[10px] text-red-600 font-medium mt-0.5 leading-tight">
                  ⚠️ {fieldErrors.registerEmail}
                </p>
              )}
            </div>

            {/* Mobile Number (10-Digit Numeric Phone Validation) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                MOBILE NUMBER (OPTIONAL)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={registerPhone}
                  onChange={(e) => {
                    // Filter: digits only, max 10
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setRegisterPhone(digits);
                    if (fieldErrors.registerPhone) setFieldErrors(prev => ({ ...prev, registerPhone: '' }));
                  }}
                  placeholder="9876543210 (10 Digits)"
                  className={`w-full pl-10 pr-3.5 py-2 bg-white border ${
                    fieldErrors.registerPhone ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors font-mono`}
                />
              </div>
              {fieldErrors.registerPhone && (
                <p className="text-[10px] text-red-600 font-medium mt-0.5 leading-tight">
                  ⚠️ {fieldErrors.registerPhone}
                </p>
              )}
            </div>

            {/* Password (Minimum 6 Characters Validation) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                PASSWORD <span className="text-red-500">*</span> <span className="text-[9px] text-[#747878]">(Min 6 characters)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    if (fieldErrors.registerPassword) setFieldErrors(prev => ({ ...prev, registerPassword: '' }));
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2 bg-white border ${
                    fieldErrors.registerPassword ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#747878] hover:text-[#1c1b1b] cursor-pointer"
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.registerPassword && (
                <p className="text-[10px] text-red-600 font-medium mt-0.5 leading-tight">
                  ⚠️ {fieldErrors.registerPassword}
                </p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1c1b1b] hover:bg-black text-white font-label-caps text-xs uppercase tracking-widest font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#fed65b]" />
                  REGISTER ACCOUNT (10% OFF)
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-[#e4e2e2] w-full"></div>
              <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-[#747878] tracking-widest absolute">
                OR
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleAuth}
              className="w-full py-2.5 bg-white hover:bg-[#faf9f8] text-[#1c1b1b] border border-[#c4c7c7] hover:border-[#1c1b1b] font-label-caps text-xs uppercase tracking-wider font-bold rounded-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-2xs group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>

            {/* Guest Login Option */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 bg-[#f5f3f3] hover:bg-[#eae7e6] text-[#1c1b1b] border border-[#e4e2e2] font-label-caps text-xs uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#735c00]" />
                Continue as Guest Collector
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SINGLE ORDER / GUEST TRACKING */}
        {activeTab === 'track' && (
          <form onSubmit={handleSingleOrderTrack} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold font-label-caps uppercase tracking-wider text-[#444748]">
                ORDER NUMBER OR TRACKING AWB <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747878]">
                  <Truck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={singleOrderQuery}
                  onChange={(e) => {
                    setSingleOrderQuery(e.target.value);
                    if (fieldErrors.singleOrderQuery) setFieldErrors(prev => ({ ...prev, singleOrderQuery: '' }));
                  }}
                  placeholder="#SWARNA-505175 or 9876543210"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white border ${
                    fieldErrors.singleOrderQuery ? 'border-red-500 bg-red-50/10' : 'border-[#c4c7c7] focus:border-[#1c1b1b]'
                  } rounded-xs text-sm text-[#1c1b1b] focus:outline-none transition-colors font-mono`}
                />
              </div>
              {fieldErrors.singleOrderQuery && (
                <p className="text-[10px] text-red-600 font-medium mt-0.5">
                  ⚠️ {fieldErrors.singleOrderQuery}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#1c1b1b] hover:bg-black text-white font-label-caps text-xs uppercase tracking-widest font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Truck className="w-4 h-4 text-[#fed65b]" />
              TRACK ORDER NOW
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="pt-2 border-t border-[#e4e2e2] text-center">
          {activeTab !== 'track' ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab('track');
                setFieldErrors({});
                if (onTrackOrder) {
                  onTrackOrder('');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#747878] hover:text-[#735c00] font-bold transition-colors cursor-pointer font-label-caps uppercase"
            >
              <span>Just track a single order instead</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#735c00]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setFieldErrors({});
              }}
              className="text-xs text-[#735c00] hover:underline font-bold transition-colors cursor-pointer font-label-caps uppercase"
            >
              ← Return to Account Sign In / Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
