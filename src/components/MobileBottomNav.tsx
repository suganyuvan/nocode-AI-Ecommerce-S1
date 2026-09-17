import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ActiveTab, Customer } from '../types';

interface MobileBottomNavProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  customer?: Customer | null;
  onOpenAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = 'home',
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenSearch,
  customer,
  onOpenAuthModal,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-40 md:hidden bg-[#ffffff] shadow-[0_-4px_20px_0_rgba(88,47,14,0.08)] border-t border-[#c4c7c7]/20">
      <div className="flex justify-around items-center py-2.5">
        {/* Home */}
        <Link
          to="/"
          onClick={() => setActiveTab && setActiveTab('home')}
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 ${
            pathname === '/' || activeTab === 'home' ? 'text-[#000000] font-bold' : 'text-[#444748]/70'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/' ? "'FILL' 1" : "'FILL' 0" }}>
            home
          </span>
          <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">Home</span>
        </Link>

        {/* Shop */}
        <Link
          to="/shop"
          onClick={() => setActiveTab && setActiveTab('shop')}
          className={`flex flex-col items-center justify-center transition-transform active:scale-95 ${
            pathname === '/shop' || activeTab === 'shop' ? 'text-[#000000] font-bold' : 'text-[#444748]/70'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/shop' ? "'FILL' 1" : "'FILL' 0" }}>
            storefront
          </span>
          <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">Shop</span>
        </Link>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center text-[#444748]/70 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">Search</span>
        </button>

        {/* Account / Orders */}
        {customer ? (
          <Link
            to="/account"
            onClick={() => setActiveTab && setActiveTab('account')}
            className={`flex flex-col items-center justify-center transition-transform active:scale-95 ${
              pathname === '/account' || activeTab === 'account' ? 'text-[#735c00] font-bold' : 'text-[#444748]/70'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: pathname === '/account' ? "'FILL' 1" : "'FILL' 0" }}>
              person
            </span>
            <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">
              Account
            </span>
          </Link>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex flex-col items-center justify-center text-[#444748]/70 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">
              Sign In
            </span>
          </button>
        )}

        {/* Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center text-[#444748]/70 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">shopping_basket</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#1c1b1b] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="font-body-md text-[10px] uppercase tracking-tight mt-0.5">Cart</span>
        </button>
      </div>
    </nav>
  );
};

