import React from 'react';
import { CartItem, Currency, Product, StoreSettings } from '../types';
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
  products?: Product[];
  storeSettings?: StoreSettings | null;
  onAddToCart?: (product: Product, selectedTimber?: string, isGift?: boolean) => void;
  customerEmail?: string;
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
  products = [],
  storeSettings,
  onAddToCart,
  customerEmail,
}) => {
  if (!isOpen) return null;

  const subtotalINR = cartItems.reduce(
    (acc, item) => acc + (item.isGift ? 0 : item.product.priceINR * item.quantity),
    0
  );
  
  const rawTotalINR = subtotalINR;
  const finalTotalINR = rawTotalINR;

  // Logic for Similar Products
  const cartCategorySet = new Set(cartItems.map((item) => item.product.category));
  const cartProductIds = new Set(cartItems.map((item) => item.product.id));
  
  const similarProducts = products
    .filter((p) => cartCategorySet.has(p.category) && !cartProductIds.has(p.id))
    .slice(0, 3);

  // If no similar products from same category, just show some spotlight/random items
  const fallbackSimilar = similarProducts.length > 0 
    ? similarProducts 
    : products.filter(p => !cartProductIds.has(p.id)).slice(0, 3);

  // Logic for Gifts
  const minOrderForGift = storeSettings?.minimum_order_amount || 0;
  const isGiftUnlocked = finalTotalINR >= minOrderForGift;
  const amountToGift = minOrderForGift - finalTotalINR;
  const giftProducts = storeSettings?.gift_product_ids 
    ? products.filter(p => storeSettings.gift_product_ids.includes(p.id))
    : [];

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
                        {item.isGift ? (
                           <span className="text-[#2e6930]">FREE (was {formatPrice(item.product.priceINR * item.quantity, currency)})</span>
                        ) : (
                           formatPrice(item.product.priceINR * item.quantity, currency)
                        )}
                      </span>

                      {/* Quantity Controls */}
                      {!item.isGift && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      )}
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

              {/* Gift Section */}
              {giftProducts.length > 0 && minOrderForGift > 0 && storeSettings?.is_free_gift_active && (
                <div className={`p-4 rounded-xs border ${isGiftUnlocked ? 'bg-[#fcf9f2] border-[#d4af37]' : 'bg-white border-[#e4e2e2]'}`}>
                  <h4 className="font-headline-md font-bold text-sm flex items-center gap-2 mb-2 text-[#1b1c1c]">
                    <span className="material-symbols-outlined text-[#d4af37]">redeem</span>
                    {storeSettings?.promotion_title || (isGiftUnlocked ? "Choose Your Free Gift!" : "Unlock a Free Gift")}
                  </h4>
                  {!isGiftUnlocked ? (
                    <div className="space-y-2">
                      <p className="text-xs text-[#747878]">
                        {storeSettings?.promotion_teaser ? `${storeSettings.promotion_teaser} ${formatPrice(minOrderForGift, currency)}` : `Add ${formatPrice(amountToGift, currency)} more to your cart to choose a complimentary master-crafted gift.`}
                      </p>
                      <div className="w-full h-2 bg-[#f4f2ec] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#d4af37] transition-all duration-500"
                          style={{ width: `${Math.min(100, (finalTotalINR / minOrderForGift) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : storeSettings?.allow_customer_gift_selection !== false ? (
                    <div className="space-y-3">
                      <p className="text-xs text-[#2e6930] font-bold">Congratulations! Select one complimentary gift below:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {giftProducts.map((gift) => {
                          const isGiftInCart = cartItems.some(i => i.product.id === gift.id && i.isGift);
                          return (
                            <div key={gift.id} className="flex gap-2 p-2 border border-[#ece8df] rounded-xs bg-white items-center">
                              <img src={gift.image} alt={gift.name} className="w-10 h-10 object-cover rounded-sm border border-[#ece8df]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold truncate text-[#1b1c1c]">{gift.name}</p>
                                <p className="text-[9px] text-[#747878] font-label-caps uppercase">Free (was {formatPrice(gift.priceINR, currency)})</p>
                              </div>
                              <button
                                disabled={isGiftInCart}
                                onClick={() => onAddToCart && onAddToCart(gift, undefined, true)}
                                className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border text-xs cursor-pointer ${
                                  isGiftInCart ? 'bg-[#2e6930] border-[#2e6930] text-white' : 'border-[#d4af37] text-[#d4af37] hover:bg-[#fcf9f2]'
                                }`}
                              >
                                {isGiftInCart ? <span className="material-symbols-outlined text-[14px]">check</span> : '+'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       <p className="text-xs text-[#2e6930] font-bold">Congratulations! A complimentary gift will be included with your order.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Similar Products */}
              {fallbackSimilar.length > 0 && (
                <div className="pt-4 border-t border-[#e4e2e2]">
                  <h4 className="font-headline-md font-bold text-sm mb-3 text-[#1b1c1c]">You Might Also Like</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {fallbackSimilar.map((prod) => (
                      <div key={prod.id} className="shrink-0 w-32 border border-[#e4e2e2] rounded-xs overflow-hidden bg-white group">
                        <div className="h-32 bg-[#f4f2ec] relative overflow-hidden">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-2 space-y-1">
                          <p className="text-[10px] font-bold text-[#1b1c1c] truncate">{prod.name}</p>
                          <p className="text-[10px] text-[#735c00]">{formatPrice(prod.priceINR, currency)}</p>
                          <button
                            onClick={() => onAddToCart && onAddToCart(prod)}
                            className="w-full py-1 text-[9px] font-bold uppercase tracking-wider border border-[#1b1c1c] text-[#1b1c1c] hover:bg-[#1b1c1c] hover:text-white transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
