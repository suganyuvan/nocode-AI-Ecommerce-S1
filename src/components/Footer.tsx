import React, { useState } from 'react';
import { ActiveTab } from '../types';
import irisjevLogo from '../assets/images/irisjev_logo_1785688429320.jpg';

interface FooterProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#e9e8e7] text-[#1b1c1c] font-body-md border-t border-[#c4c7c7]/30 mt-16 pb-16 md:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 py-16 max-w-[1200px] mx-auto text-center md:text-left">
        {/* Brand Info */}
        <div className="md:col-span-1">
          <div className="mb-4">
            <img src={irisjevLogo} alt="Irisjev Wooden Crafts" className="h-16 mx-auto md:mx-0 object-contain mix-blend-multiply" />
          </div>
          <p className="font-body-md text-sm text-[#444748] mb-6 leading-relaxed">
            Preserving Ancient Artistry for the modern connoisseur. Irisjev Wooden Crafts (Est. 1995) produces heirloom temple-grade sculptures, mandapams, and luxury woodcrafts.
          </p>
          <div className="flex justify-center md:justify-start gap-4 text-[#000000]">
            <a href="#instagram" onClick={(e) => { e.preventDefault(); setActiveTab('home'); }} className="hover:opacity-70 transition-opacity">
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); setActiveTab('contact'); }} className="hover:opacity-70 transition-opacity">
              <span className="material-symbols-outlined">mail</span>
            </a>
            <a href="#share" onClick={(e) => { e.preventDefault(); alert("App URL copied to clipboard!"); }} className="hover:opacity-70 transition-opacity">
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>
        </div>

        {/* Discovery Links */}
        <div>
          <h5 className="font-label-caps text-xs uppercase tracking-widest text-[#000000] mb-4 font-bold">
            Discovery
          </h5>
          <ul className="space-y-3 font-body-md text-sm text-[#444748]">
            <li>
              <button onClick={() => setActiveTab('shop')} className="hover:text-[#000000] transition-colors cursor-pointer">
                God Sculptures
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('shop')} className="hover:text-[#000000] transition-colors cursor-pointer">
                Wall Mounts & Panels
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('temple-projects')} className="hover:text-[#000000] transition-colors cursor-pointer">
                Temple Mandapams
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('about')} className="hover:text-[#000000] transition-colors cursor-pointer">
                Our Master Carvers
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('wholesale-export')} className="hover:text-[#000000] transition-colors cursor-pointer">
                Wholesale & Export
              </button>
            </li>
          </ul>
        </div>

        {/* Concierge & Support */}
        <div>
          <h5 className="font-label-caps text-xs uppercase tracking-widest text-[#000000] mb-4 font-bold">
            Concierge & Care
          </h5>
          <ul className="space-y-3 font-body-md text-sm text-[#444748]">
            <li>
              <button onClick={() => setActiveTab('care-guide')} className="hover:text-[#000000] transition-colors cursor-pointer">
                Timber Care & Preservation
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('track')} className="hover:text-[#853c4d] transition-colors cursor-pointer text-left font-bold text-[#853c4d] flex items-center gap-1">
                <span>🚚 Track Order & AWBs</span>
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('shipping')} className="hover:text-[#000000] transition-colors cursor-pointer text-left">
                Shipping & White-Glove Transit
              </button>
            </li>

            <li>
              <span className="text-[#444748]">Authenticity & Heritage Cards</span>
            </li>
            <li>
              <span className="text-[#444748]">Architect & Designer Trade Program</span>
            </li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h5 className="font-label-caps text-xs uppercase tracking-widest text-[#000000] mb-4 font-bold">
            Private Circle Newsletter
          </h5>
          <p className="font-body-md text-sm text-[#444748] mb-4">
            Join our circle for exclusive collection previews and 10% off your first commission.
          </p>
          {subscribed ? (
            <div className="bg-[#ffffff] text-[#735c00] border border-[#fed65b] p-3 rounded-xs text-xs font-label-caps uppercase tracking-wider">
              ✨ Welcome to our circle! Your discount code is <strong className="text-[#000000]">SWARNA10</strong>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex border-b border-[#000000] py-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email Address"
                  required
                  className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[#747878] font-body-md"
                />
                <button
                  type="submit"
                  className="text-[#000000] font-bold text-xs uppercase tracking-widest font-label-caps cursor-pointer hover:opacity-70 px-2"
                >
                  Join
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="max-w-[1200px] mx-auto px-6 py-6 border-t border-[#c4c7c7]/40 flex flex-col md:flex-row justify-between items-center text-[11px] font-label-caps text-[#444748]/80 uppercase tracking-wider">
        <span>© 2026 Irisjev Wooden Crafts. Crafting Divinity.</span>
        <div className="flex flex-wrap gap-4 md:gap-6 mt-3 md:mt-0 justify-center">
          <button onClick={() => setActiveTab('privacy')} className="hover:text-[#000000] cursor-pointer">Privacy Policy</button>
          <button onClick={() => setActiveTab('terms')} className="hover:text-[#000000] cursor-pointer">Terms of Service</button>
          <button onClick={() => setActiveTab('refund')} className="hover:text-[#000000] cursor-pointer">Cancellation & Refund</button>
          <span className="hover:text-[#000000] cursor-pointer">Heritage Registry</span>
        </div>
      </div>
    </footer>
  );
};
