import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const PromoPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Clear the local storage flag on reload so it shows again
    localStorage.removeItem('irisjev_promo_seen');

    // Check if the user has already seen or submitted the popup
    const hasSeenPopup = localStorage.getItem('irisjev_promo_seen');
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 4000); // Show after 4 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('irisjev_promo_seen', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ full_name: name, email, phone, country_code: countryCode }]);

    if (error) {
      console.error('Error submitting promo form:', error);
    }

    setIsSubmitted(true);
    localStorage.setItem('irisjev_promo_seen', 'true');
    
    // Close automatically after 3 seconds of success message
    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-[#1c1b1b]/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      <div className="relative bg-[#fbf9f8] w-full max-w-md shadow-2xl rounded-sm flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#444748] hover:text-[#1c1b1b] z-10 transition-colors bg-white/50 rounded-full p-1 backdrop-blur-md"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="bg-[#735c00] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
          <h2 className="relative font-display-lg text-3xl text-white mb-2 italic">Welcome to Irisjev!</h2>
          <p className="relative text-[#fbf9f8]/90 font-label-caps tracking-widest text-sm uppercase">Get 10% Off Your First Order</p>
        </div>

        <div className="p-8">
          {isSubmitted ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-5xl text-[#735c00] mb-4">check_circle</span>
              <h3 className="font-display text-xl text-[#1c1b1b] mb-2">Thank You, {name}!</h3>
              <p className="text-[#444748] text-sm">Use code <span className="font-bold text-[#1c1b1b]">WELCOME10</span> at checkout.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#444748] text-center mb-6 font-body-md">
                Sign up for our newsletter and receive an exclusive 10% discount code for your first bespoke or catalogue sculpture.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#c4c7c7] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#735c00] transition-colors"
                    placeholder="Full Name"
                  />
                </div>
                
                <div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#c4c7c7] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#735c00] transition-colors"
                    placeholder="Email Address"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-[30%] sm:w-[25%] border border-[#c4c7c7] bg-white px-2 py-3 text-sm focus:outline-none focus:border-[#735c00] transition-colors"
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+91">+91</option>
                    <option value="+61">+61</option>
                    <option value="+81">+81</option>
                    <option value="+49">+49</option>
                    <option value="+33">+33</option>
                  </select>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 border border-[#c4c7c7] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#735c00] transition-colors"
                    placeholder="Mobile Number"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#735c00] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-[#594800] transition-colors shadow-md mt-2"
                >
                  Claim My 10% Off
                </button>
              </form>
              <p className="text-center text-[10px] text-[#444748] mt-4 uppercase tracking-wider">
                By subscribing, you agree to our Terms & Privacy Policy.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
