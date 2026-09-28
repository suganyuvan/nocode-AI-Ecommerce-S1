import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Edit3, Truck, Search, User, Heart, ShoppingBag, Menu, X, LogIn } from 'lucide-react';
import { ActiveTab, Currency, Customer } from '../types';
import irisjevLogo from '../assets/images/swarna_wooden_crafts_logo.jpg';
import { PromotionalBanner } from './PromotionalBanner';

interface HeaderProps {
  activeTab?: ActiveTab;
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
  onOpenTrackOrder?: () => void;
}


export const Header: React.FC<HeaderProps> = ({
  activeTab = 'home',
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
  onOpenTrackOrder,
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <PromotionalBanner targetPage="header_marquee" />
      <header className="sticky top-0 z-50 bg-[#fbf9f8]/95 backdrop-blur-md border-b border-[#c4c7c7]/30 shadow-xs transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-[#1c1b1b] text-[#e5e2e1] text-[10px] sm:text-[11px] font-label-caps uppercase tracking-widest py-2 px-2 sm:px-4 text-center flex flex-col sm:flex-row justify-between items-center max-w-[1200px] mx-auto gap-1 sm:gap-0">
        <span className="hidden lg:inline">Est. 1995 • Swarna Wooden Crafts</span>
        <span className="mx-auto lg:mx-0 truncate w-full sm:w-auto text-center">✨ Free Insured White-Glove Shipping Across India & Worldwide</span>
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#fed65b]" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={() => setActiveTab('home')}
            className="flex items-center cursor-pointer shrink-0"
          >
            <img src={irisjevLogo} alt="Swarna Wooden Crafts" className="h-10 sm:h-14 md:h-16 object-contain mix-blend-multiply" />
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-label-caps uppercase tracking-widest text-[12px]">
            <Link
              to="/"
              onClick={() => setActiveTab('home')}
              className={`transition-colors cursor-pointer ${
                pathname === '/' || activeTab === 'home'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setActiveTab('shop')}
              className={`transition-colors cursor-pointer ${
                pathname === '/shop' || activeTab === 'shop'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Shop Collection
            </Link>
            <Link
              to="/pages/temple-projects"
              onClick={() => setActiveTab('temple-projects')}
              className={`transition-colors cursor-pointer ${
                pathname === '/pages/temple-projects' || activeTab === 'temple-projects'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Temple Projects
            </Link>
            <Link
              to="/pages/about-us"
              onClick={() => setActiveTab('about')}
              className={`transition-colors cursor-pointer ${
                pathname === '/pages/about-us' || pathname === '/about' || activeTab === 'about'
                  ? 'text-[#000000] font-bold border-b border-[#000000] pb-1'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              About
            </Link>
            <button
              onClick={onOpenBespoke}
              className="text-[#735c00] font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#735c00]" />
              <span>Custom Orders</span>
            </button>
            <Link
              to="/track"
              onClick={() => setActiveTab('track')}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                pathname === '/track' || activeTab === 'track'
                  ? 'bg-[#1c1b1b] text-[#fed65b] shadow-xs border border-[#735c00]/40'
                  : 'bg-[#f4efe6] text-[#735c00] hover:bg-[#e0d6c3] border border-[#e0d6c3]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>


        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-[#000000]">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1.5"
            title="Search collection"
          >
            <Search className="w-4 h-4 text-[#444748]" />
            <span className="hidden lg:inline text-[11px] font-label-caps uppercase tracking-wider text-[#444748]">
              Search
            </span>
          </button>

          {/* Currency Toggle for mobile */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="md:hidden bg-transparent text-[10px] font-bold px-1 py-0.5 border border-[#747878] rounded-xs outline-none w-[45px] sm:w-auto"
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
              className="p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1.5"
              title="Sign In / My Orders"
            >
              <User className="w-4 h-4 text-[#444748]" />
              <span className="hidden lg:inline text-[11px] font-label-caps uppercase tracking-wider text-[#444748]">
                Sign In
              </span>
            </button>
          )}

          {/* Wishlist Icon */}
          <button
            onClick={onOpenWishlist}
            className="relative p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 text-[#444748]" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#735c00] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-[#444748]" />
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
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
          <Link
            to="/"
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#000000] font-bold border-b border-[#e9e8e7]"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => {
              setActiveTab('shop');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Shop Curated Collection
          </Link>
          <Link
            to="/pages/temple-projects"
            onClick={() => {
              setActiveTab('temple-projects');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Temple Projects & Mandapams
          </Link>
          <Link
            to="/pages/about-us"
            onClick={() => {
              setActiveTab('about');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            About Swarna Wooden Crafts
          </Link>
          <Link
            to="/pages/wholesale-export"
            onClick={() => {
              setActiveTab('wholesale-export');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[#444748] border-b border-[#e9e8e7]"
          >
            Wholesale & Export Leads
          </Link>
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

