import React, { useState } from 'react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currency: Currency;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currency,
  onCheckout,
}) => {
  const [coupon, setCoupon] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Form states for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Payment states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const getCardBrand = (number: string) => {
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    return null;
  };

  if (!isOpen) return null;

  const rawTotalINR = cartItems.reduce(
    (acc, item) => acc + item.product.priceINR * item.quantity,
    0
  );

  const discountAmountINR = (rawTotalINR * appliedDiscount) / 100;
  const finalTotalINR = rawTotalINR - discountAmountINR;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim().toUpperCase() === 'SWARNA10') {
      setAppliedDiscount(10);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon. Try SWARNA10');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#c4c7c7]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#e4e2e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#735c00]">shopping_bag</span>
            <h3 className="font-headline-md text-xl text-[#1b1c1c] font-bold">
              Your Reserve Basket
            </h3>
            <span className="text-xs bg-[#efeded] text-[#444748] px-2 py-0.5 rounded-full font-label-caps font-bold">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#1b1c1c] hover:opacity-70 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">
                shopping_bag
              </span>
              <p className="font-body-md text-base text-[#444748]">
                Your reserve basket is currently empty.
              </p>
              <p className="text-xs text-[#747878] max-w-xs mx-auto">
                Explore our curated collection of master-carved sculptures, temple doors, and mandala wall panels.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-white rounded-xs border border-[#e4e2e2] relative group"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-xs border border-[#c4c7c7]/30"
                    />
                    <div className="flex-1">
                      <h5 className="font-headline-md font-semibold text-sm text-[#1b1c1c]">
                        {item.product.name}
                      </h5>
                      <span className="text-[11px] font-body-md text-[#735c00] block">
                        Timber: {item.selectedTimber}
                      </span>
                      <span className="font-headline-md font-bold text-sm text-[#000000] block mt-1">
                        {formatPrice(item.product.priceINR * item.quantity, currency)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-label-caps px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-[#747878] hover:text-[#ba1a1a] p-1 cursor-pointer"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="bg-[#f5f3f3] p-4 rounded-xs border border-[#c4c7c7]">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Promo Code (Try SWARNA10)"
                    className="flex-1 bg-white border border-[#c4c7c7] px-3 py-1.5 text-xs font-label-caps uppercase rounded-xs"
                  />
                  <button
                    type="submit"
                    className="bg-[#1c1b1b] text-white px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider rounded-xs hover:opacity-90 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
                {couponError && <p className="text-[11px] text-[#ba1a1a] mt-1">{couponError}</p>}
                {appliedDiscount > 0 && (
                  <p className="text-[11px] text-[#735c00] font-bold mt-1">
                    ✨ 10% Private Circle discount applied!
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-[#e4e2e2] bg-white space-y-3">
            <div className="space-y-1 text-xs font-label-caps uppercase text-[#444748]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(rawTotalINR, currency)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[#735c00]">
                  <span>Circle Discount (10%):</span>
                  <span>-{formatPrice(discountAmountINR, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#000000] border-t border-[#e4e2e2] pt-2 mt-1 font-headline-md">
                <span>Total Amount:</span>
                <span>{formatPrice(finalTotalINR, currency)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              Proceed to Reserve Checkout
            </button>

            <p className="text-[10px] text-center text-[#747878] font-label-caps uppercase">
              Includes Insured Crate Packaging & Certificate of Authenticity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
