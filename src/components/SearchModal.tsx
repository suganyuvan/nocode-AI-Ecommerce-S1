import React, { useState } from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  currency: Currency;
  products: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  currency,
  products,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const popularTags = ['Ganesha', 'Teak Wood', 'Wall Panel', 'Mandala', 'Mandapam', 'Rosewood', 'Peacock'];

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.material.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase());

    const matchesTag = selectedTag ? p.name.toLowerCase().includes(selectedTag.toLowerCase()) || p.material.toLowerCase().includes(selectedTag.toLowerCase()) || p.category.toLowerCase().includes(selectedTag.toLowerCase()) : true;

    return matchesQuery && matchesTag;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-[#1b1c1c]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf9f8] w-full max-w-2xl rounded-sm shadow-2xl border border-[#c4c7c7] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-[#e4e2e2]">
          <span className="material-symbols-outlined text-[#444748] mr-3">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Lord Ganesha, Teak panels, Mandapams, Rosewood..."
            autoFocus
            className="w-full bg-transparent border-none text-lg font-body-md focus:outline-none placeholder:text-[#747878]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#747878] hover:text-black mr-3 uppercase font-label-caps cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-[#1b1c1c] hover:opacity-70 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Popular Tags */}
        <div className="px-6 py-3 bg-[#f5f3f3] flex flex-wrap gap-2 items-center text-xs font-label-caps">
          <span className="text-[#444748] uppercase tracking-wider font-bold mr-1">Popular:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTag === tag) setSelectedTag(null);
                else setSelectedTag(tag);
              }}
              className={`px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#1c1b1b] text-white border-[#1c1b1b]'
                  : 'bg-white text-[#444748] border-[#c4c7c7] hover:border-[#1b1c1c]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#747878] font-body-md">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">search_off</span>
              No handcrafted pieces found matching &quot;{query || selectedTag}&quot;.
              <br />
              Try searching for &quot;Ganesha&quot;, &quot;Teak&quot;, or &quot;Mandapam&quot;.
            </div>
          ) : (
            filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="flex items-center gap-4 p-3 rounded-xs border border-[#e4e2e2] hover:border-[#1c1b1b] hover:bg-white transition-all cursor-pointer group"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-xs border border-[#c4c7c7]/40 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1">
                  <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#735c00] font-bold">
                    {product.category}
                  </span>
                  <h4 className="font-headline-md text-base text-[#1b1c1c] font-semibold group-hover:text-[#735c00] transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-xs font-body-md text-[#444748]">
                    {product.material} • {product.dimensions}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-headline-md font-bold text-sm text-[#000000]">
                    {formatPrice(product.priceINR, currency)}
                  </span>
                  <span className="block text-[10px] text-[#735c00] font-label-caps uppercase font-bold mt-1">
                    View Piece →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
