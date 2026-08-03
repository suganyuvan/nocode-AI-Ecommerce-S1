import React from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  currency: Currency;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveFromWishlist,
  onAddToCart,
  onSelectProduct,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#c4c7c7]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#e4e2e2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#735c00]">favorite</span>
            <h3 className="font-headline-md text-xl text-[#1b1c1c] font-bold">
              Saved Masterpieces
            </h3>
            <span className="text-xs bg-[#efeded] text-[#444748] px-2 py-0.5 rounded-full font-label-caps font-bold">
              {wishlistItems.length} saved
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[#1b1c1c] hover:opacity-70 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {wishlistItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">favorite_border</span>
              <p className="font-body-md text-base text-[#444748]">
                You haven&apos;t saved any sculptures yet.
              </p>
              <p className="text-xs text-[#747878] max-w-xs mx-auto">
                Click the heart icon on any masterpiece while browsing to save it to your wishlist.
              </p>
            </div>
          ) : (
            wishlistItems.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 p-3 bg-white rounded-xs border border-[#e4e2e2] items-center"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="w-20 h-20 object-cover rounded-xs border border-[#c4c7c7]/30 cursor-pointer hover:opacity-90"
                />
                <div className="flex-1">
                  <h5
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="font-headline-md font-semibold text-sm text-[#1b1c1c] hover:text-[#735c00] cursor-pointer"
                  >
                    {product.name}
                  </h5>
                  <span className="text-xs font-body-md text-[#444748] block">
                    {product.material}
                  </span>
                  <span className="font-headline-md font-bold text-sm text-[#000000] block mt-1">
                    {formatPrice(product.priceINR, currency)}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onRemoveFromWishlist(product.id);
                    }}
                    className="p-2 bg-[#1c1b1b] text-white rounded-xs hover:opacity-90 text-xs font-label-caps uppercase"
                    title="Move to Basket"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_bag</span>
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(product.id)}
                    className="p-2 border border-[#c4c7c7] text-[#747878] hover:text-[#ba1a1a] rounded-xs text-xs"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
