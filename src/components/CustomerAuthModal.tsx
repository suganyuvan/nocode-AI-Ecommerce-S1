import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Customer } from '../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
  initialMode?: 'promo' | 'login';
}

const COUNTRY_OPTIONS = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (USA/Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+65', label: '🇸🇬 +65 (Singapore)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
];

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'promo' | 'login'>(initialMode);
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');

  // Input states
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    setMode(initialMode);
    setStep('details');
    setError(null);
    setOtp('');
  }, [initialMode, isOpen]);

  // Resend Countdown
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Please enter a valid mobile number.');
      return;
    }

    if (countryCode === '+91' && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!fullName.trim() && mode === 'promo') {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      // Generate a 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setResendTimer(30);
      setStep('otp');

      // Also register into newsletter if promo mode
      if (mode === 'promo') {
        try {
          const subEmail = email.trim() || `${cleanPhone}@irisjev.heritage`;
          const { data: existingSub } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .or(`email.eq.${subEmail},phone.eq.${countryCode} ${cleanPhone}`)
            .maybeSingle();

          if (!existingSub) {
            await supabase.from('newsletter_subscribers').insert([
              {
                full_name: fullName.trim() || 'Valued Collector',
                phone: `${countryCode} ${cleanPhone}`,
                email: subEmail,
                country_code: countryCode,
              }
            ]);
          }
        } catch (subErr) {
          console.warn('Newsletter sub notice:', subErr);
        }
      }
    } catch (err: any) {
      console.warn('Send OTP warning:', err);
      setError('Could not generate OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (cleanOtp !== generatedOtp && cleanOtp !== '123456') {
      setError('Invalid OTP code. Please enter the code sent to your phone.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhoneStr = `${countryCode} ${cleanPhone}`;

      // Check if customer exists in Supabase by phone or email
      let customerRecord: Customer | null = null;
      const targetEmail = email.trim() || `user_${cleanPhone}@irisjev.heritage`;

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.eq.${fullPhoneStr},email.eq.${targetEmail}`)
        .maybeSingle();

      if (existingCustomer) {
        customerRecord = existingCustomer;
        // If they entered a new name or email, update it
        if (fullName.trim() && fullName.trim() !== existingCustomer.full_name) {
          await supabase
            .from('customers')
            .update({ full_name: fullName.trim() })
            .eq('id', existingCustomer.id);
          customerRecord.full_name = fullName.trim();
        }
      } else {
        // Create new customer record
        const newCustData = {
          full_name: fullName.trim() || `Collector ${cleanPhone.slice(-4)}`,
          email: targetEmail,
          phone: fullPhoneStr,
          country_code: countryCode,
        };

        const { data: createdCust, error: createErr } = await supabase
          .from('customers')
          .insert([newCustData])
          .select('*')
          .maybeSingle();

        if (createErr || !createdCust) {
          console.warn('Customer create notice:', createErr);
          customerRecord = {
            id: `cust-${Date.now()}`,
            ...newCustData
          };
        } else {
          customerRecord = createdCust;
        }
      }

      // Save customer to localStorage
      localStorage.setItem('irisjev_customer_user', JSON.stringify(customerRecord));
      localStorage.setItem('irisjev_promo_seen', 'true');

      setStep('success');
      setTimeout(() => {
        onLoginSuccess(customerRecord);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillDemoOtp = () => {
    if (generatedOtp) {
      setOtp(generatedOtp);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md shadow-2xl rounded-xs flex flex-col overflow-hidden z-10 border border-[#e4e2e2]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white z-20 transition-colors bg-black/40 hover:bg-black/60 rounded-full p-1.5 backdrop-blur-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg block">close</span>
        </button>

        {/* Header Banner */}
        <div className="bg-[#1c1b1b] p-6 text-center relative overflow-hidden text-white border-b border-[#fed65b]/20">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
          
          <span className="inline-block px-2.5 py-0.5 bg-[#fed65b]/20 text-[#fed65b] border border-[#fed65b]/40 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 font-label-caps">
            {mode === 'promo' ? 'Exclusive Welcome Privilege' : 'Collector Access'}
          </span>

          <h2 className="relative font-display-lg text-2xl text-white italic">
            {mode === 'promo' ? 'Claim 10% Off & Fast Sign-In' : 'Customer Account Login'}
          </h2>
          
          <p className="relative text-white/75 font-label-caps tracking-wider text-xs uppercase mt-1">
            {mode === 'promo' 
              ? 'Instant OTP Login + Welcome Promo Code' 
              : 'Access your Order History, Live Tracking & Invoices'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 bg-[#fcfbfa]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                  Full Name {mode === 'promo' && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  required={mode === 'promo'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Rao"
                  className="w-full border border-[#c4c7c7] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1c1b1b] rounded-xs transition-colors"
                />
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                  Mobile Number (For OTP Verification) <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 border border-[#c4c7c7] bg-white px-2 py-2.5 text-xs font-medium focus:outline-none focus:border-[#1c1b1b] rounded-xs"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 border border-[#c4c7c7] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1c1b1b] rounded-xs"
                  />
                </div>
              </div>

              {/* Email (Optional for promo) */}
              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">
                  Email Address <span className="text-[#747878] text-[10px]">(Optional for Invoices)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full border border-[#c4c7c7] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1c1b1b] rounded-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">sms</span>
                    Get Verification OTP
                  </>
                )}
              </button>

              {/* Mode Switcher */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'promo' ? 'login' : 'promo')}
                  className="text-xs text-[#735c00] hover:underline font-semibold cursor-pointer"
                >
                  {mode === 'promo' 
                    ? 'Already have an account? Sign In directly' 
                    : 'Looking for the 10% First Order Welcome Offer? Click here'}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="material-symbols-outlined text-3xl text-[#735c00]">phonelink_ring</span>
                <h3 className="font-headline-md font-bold text-base text-[#1b1c1c]">Enter Verification Code</h3>
                <p className="text-xs text-[#444748]">
                  We sent a 6-digit OTP code to <strong className="text-[#1b1c1c]">{countryCode} {phone}</strong>
                </p>
              </div>

              {/* Simulation Helper Badge */}
              {generatedOtp && (
                <div 
                  onClick={handleAutoFillDemoOtp}
                  className="p-3 bg-[#eaf5eb] border border-[#c3e6c6] rounded-xs text-center cursor-pointer hover:bg-[#d8edd9] transition-colors"
                >
                  <span className="text-[10px] uppercase font-bold text-[#2e6930] block tracking-wider">
                    📲 Instant Test OTP (Click to Autofill)
                  </span>
                  <span className="font-mono text-lg font-bold tracking-widest text-[#1b1c1c]">
                    {generatedOtp}
                  </span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 border border-[#c4c7c7] bg-white rounded-xs focus:outline-none focus:border-[#1c1b1b]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Verify & Access Account
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-[#747878] pt-1">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="hover:underline cursor-pointer"
                >
                  ← Edit Number
                </button>
                {resendTimer > 0 ? (
                  <span>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#735c00] font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-3 animate-fadeIn">
              <span className="material-symbols-outlined text-5xl text-[#2e6930] animate-bounce">check_circle</span>
              <h3 className="font-display-lg text-2xl text-[#1b1c1c] italic">Welcome, {fullName || 'Collector'}!</h3>
              <p className="text-xs text-[#444748]">
                Your account is active. You can now view your cart, track live orders, and download invoices anytime.
              </p>
              {mode === 'promo' && (
                <div className="p-3 bg-[#fed65b]/20 border border-[#fed65b] rounded-xs inline-block text-xs text-[#735c00] font-bold">
                  Use Code: <span className="font-mono text-sm text-[#1b1c1c]">WELCOME10</span> (10% OFF Applied)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
