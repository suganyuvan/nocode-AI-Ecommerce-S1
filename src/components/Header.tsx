import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActiveTab, Currency, Customer } from '../types';
import irisjevLogo from '../assets/images/irisjev_logo_1785688429320.jpg';
import { PromotionalBanner } from './PromotionalBanner';

interface HeaderProps {

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenBespoke: () => void;
  customer: Customer | null;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenBespoke,
  customer,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <PromotionalBanner targetPage="header_marquee" />
      <header className="sticky top-0 z-50 bg-[#fbf9f8]/95 backdrop-blur-md border-b border-[#c4c7c7]/30 shadow-xs transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-[#1c1b1b] text-[#e5e2e1] text-[11px] font-label-caps uppercase tracking-widest py-1.5 px-4 text-center flex justify-between items-center max-w-[1200px] mx-auto">
        <span className="hidden sm:inline">Est. 1995 • Irisjev Wooden Crafts</span>
        <span className="mx-auto sm:mx-0">✨ Free Insured White-Glove Shipping Across India & Worldwide</span>
        <div className="hidden md:flex items-center gap-3">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="bg-[#1c1b1b] text-white hover:text-[#fed65b] transition-colors cursor-pointer font-bold px-1 py-0.5 border border-[#444748] rounded-xs text-[10px] uppercase outline-none"
          >
            <option value="INR">🇮🇳 INR (₹)</option>
            <option value="USD">🇺🇸 USD ($)</option>
            <option value="OMR">🇴🇲 OMR (ر.ع.)</option>
            <option value="JPY">🇯🇵 JPY (¥)</option>
            <option value="LKR">🇱🇰 LKR (Rs)</option>
            <option value="SGD">🇸🇬 SGD (S$)</option>
            <option value="MYR">🇲🇾 MYR (RM)</option>
            <option value="IDR">🇮🇩 IDR (Rp)</option>
          </select>
          <Link
            to="/admin"
            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs transition-colors bg-[#fed65b]/20 text-[#fed65b] hover:bg-[#fed65b] hover:text-[#1c1b1b] border border-[#fed65b]/40 flex items-center gap-1 cursor-pointer"
            title="Access Master Admin Portal (/admin)"
          >
            <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
            Admin Portal
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center cursor-pointer"
          >
            <img src={irisjevLogo} alt="Irisjev Wooden Crafts" className="h-14 md:h-16 object-contain mix-blend-multiply" />
          </button>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-label-caps uppercase tracking-widest text-[12px]">
            <button
              onClick={() => setActiveTab('home')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'shop'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Shop Collection
            </button>
            <button
              onClick={() => setActiveTab('temple-projects')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'temple-projects'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Temple Projects
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'about'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              About
            </button>
            <button
              onClick={onOpenBespoke}
              className="text-[#735c00] font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">edit_square</span>
              Custom Orders
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 text-[#000000]">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1"
            title="Search collection"
          >
            <span className="material-symbols-outlined">search</span>
            <span className="hidden lg:inline text-[11px] font-label-caps uppercase tracking-wider text-[#444748]">
              Search
            </span>
          </button>

          {/* Currency Toggle for mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="md:hidden bg-transparent text-[10px] font-bold px-1.5 py-0.5 border border-[#747878] rounded-xs outline-none"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="OMR">OMR</option>
            <option value="JPY">JPY</option>
            <option value="LKR">LKR</option>
            <option value="SGD">SGD</option>
            <option value="MYR">MYR</option>
            <option value="IDR">IDR</option>
          </select>

          {/* Customer Account / Sign In */}
          {customer ? (
            <button
              onClick={() => setActiveTab('account')}
              className={`p-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'account' ? 'text-[#735c00] font-bold' : 'hover:opacity-70'
              }`}
              title={`Account (${customer.full_name})`}
            >
              <div className="w-6 h-6 rounded-full bg-[#1c1b1b] text-[#fed65b] flex items-center justify-center text-[11px] font-bold">
                {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <span className="hidden lg:inline text-[11px] font-label-caps uppercase tracking-wider text-[#1c1b1b] font-bold max-w-[80px] truncate">
                {customer.full_name?.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1"
              title="Sign In / My Orders"
            >
              <span className="material-symbols-outlined">account_circle</span>
              <span className="hidden lg:inline text-[11px] font-label-caps uppercase tracking-wider text-[#444748]">
                Sign In
              </span>
            </button>
          )}

          {/* Wishlist Icon */}
          <button
            onClick={onOpenWishlist}
            className="relative p-1 hover:opacity-70 transition-opacity cursor-pointer"
            title="Wishlist"
          >
            <span className="material-symbols-outlined">favorite</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#735c00] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-1 hover:opacity-70 transition-opacity cursor-pointer"
            title="Shopping Cart"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1c1b1b] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-[#000000]"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fbf9f8] border-b border-[#c4c7c7] px-6 py-6 space-y-4 font-label-caps uppercase tracking-widest text-[13px] animate-fadeIn">
          {/* Customer Account on Mobile */}
          <button
            onClick={() => {
              if (customer) {
                setActiveTab('account');
              } else {
                onOpenAuthModal();
              }
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2.5 text-[#735c00] font-bold border-b border-[#e9e8e7] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              {customer ? 'account_circle' : 'login'}
            </span>
            <span>{customer ? `My Account (${customer.full_name})` : 'Sign In / My Orders (10% Off)'}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#000000] font-bold border-b border-[#e9e8e7]"
          >
            Home
          </button>
          <button
            onClick={() => {
              setActiveTab('shop');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Shop Curated Collection
          </button>
          <button
            onClick={() => {
              setActiveTab('temple-projects');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Temple Projects & Mandapams
          </button>
          <button
            onClick={() => {
              setActiveTab('about');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            About Irisjev Wooden Crafts
          </button>
          <button
            onClick={() => {
              setActiveTab('wholesale-export');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Wholesale & Export Leads
          </button>
          <button
            onClick={() => {
              onOpenBespoke();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#735c00] font-bold border-b border-[#e9e8e7]"
          >
            ✨ Custom Order Concierge
          </button>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left py-2.5 text-[#fed65b] font-bold bg-[#1c1b1b] px-3 rounded-xs flex items-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span>Master Admin Portal (/admin)</span>
          </Link>
        </div>
      )}
    </header>
    </>
  );
};

