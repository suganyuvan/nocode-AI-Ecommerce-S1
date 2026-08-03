import React, { useState } from 'react';
import { Product, Currency, FilterState } from '../types';
import { formatPrice } from '../utils/currency';

interface ShopViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  currency: Currency;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  currency,
  
}) => {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minPrice: 0,
    maxPrice: 1000000,
    timberSelection: [],
    sortBy: 'popularity',
    searchQuery: '',
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const categoriesList = [
    'God Sculptures',
    'Wall Mounts',
    'Square Panels',
    'Grand Sculptures',
    'Temple Doors',
    'Custom Commissions',
    'Baskets & Bottles',
    'Mirrors & Decor',
  ];

  const timbersList = [
    'Aged Teak Wood',
    'Red Sandalwood',
    'Premium Rosewood',
    'Mahogany',
    'Reclaimed Teak Wood',
  ];

  const handleCategoryToggle = (cat: string) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
    setCurrentPage(1);
  };

  const handleTimberToggle = (timber: string) => {
    setFilters((prev) => {
      const exists = prev.timberSelection.includes(timber);
      return {
        ...prev,
        timberSelection: exists
          ? prev.timberSelection.filter((t) => t !== timber)
          : [...prev.timberSelection, timber],
      };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      minPrice: 0,
      maxPrice: 1000000,
      timberSelection: [],
      sortBy: 'popularity',
      searchQuery: '',
    });
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredProducts = products.filter((product) => {
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }
    if (filters.timberSelection.length > 0) {
      const hasTimber = product.timberOptions.some((t) =>
        filters.timberSelection.some((st) => t.toLowerCase().includes(st.toLowerCase()))
      ) || filters.timberSelection.some((st) => product.material.toLowerCase().includes(st.toLowerCase()));
      if (!hasTimber) return false;
    }
    if (product.priceINR < filters.minPrice || product.priceINR > filters.maxPrice) {
      return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === 'price-low') return a.priceINR - b.priceINR;
    if (filters.sortBy === 'price-high') return b.priceINR - a.priceINR;
    if (filters.sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
    return b.rating - a.rating;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="border-b border-[#c4c7c7]/40 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block mb-1">
            Irisjev Wooden Crafts Catalogue
          </span>
          <h1 className="font-display-lg text-3xl md:text-4xl font-bold text-[#1b1c1c] italic">
            Curated Collection of Woodcrafts
          </h1>
          <p className="font-body-md text-sm text-[#444748] mt-1">
            Discover heirloom temple idols, 3D lotus panels, carved double doors, and bespoke divine sculptures.
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="md:hidden w-full py-2.5 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs"
        >
          <span className="material-symbols-outlined text-sm">filter_list</span>
          <span>Filter Collection ({filters.categories.length + filters.timberSelection.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar - Desktop */}
        <aside
          className={`md:col-span-3 space-y-6 font-body-md text-sm ${
            mobileFilterOpen ? 'block bg-white p-6 rounded-xs border border-[#c4c7c7]' : 'hidden md:block'
          }`}
        >
          <div className="flex justify-between items-center border-b border-[#c4c7c7] pb-3">
            <h3 className="font-label-caps text-xs uppercase tracking-widest text-[#1b1c1c] font-bold">
              Refine Collection
            </h3>
            {(filters.categories.length > 0 || filters.timberSelection.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-[#735c00] font-label-caps uppercase font-bold hover:underline cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-[11px] uppercase tracking-wider text-[#444748] font-bold">
              Category
            </h4>
            <div className="space-y-2">
              {categoriesList.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <label
                    key={cat}
                    className="flex items-center justify-between text-xs cursor-pointer hover:text-[#735c00] select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded-xs text-[#1c1b1b] focus:ring-0 cursor-pointer"
                      />
                      <span>{cat}</span>
                    </div>
                    <span className="text-[10px] text-[#747878] font-label-caps">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Timber Selection */}
          <div className="space-y-3 border-t border-[#e4e2e2] pt-4">
            <h4 className="font-label-caps text-[11px] uppercase tracking-wider text-[#444748] font-bold">
              Timber Selection
            </h4>
            <div className="space-y-2">
              {timbersList.map((timber) => (
                <label
                  key={timber}
                  className="flex items-center gap-2 text-xs cursor-pointer hover:text-[#735c00] select-none"
                >
                  <input
                    type="checkbox"
                    checked={filters.timberSelection.includes(timber)}
                    onChange={() => handleTimberToggle(timber)}
                    className="rounded-xs text-[#1c1b1b] focus:ring-0 cursor-pointer"
                  />
                  <span>{timber}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="md:col-span-9 space-y-6">
          {/* Top Bar - Count & Sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f5f3f3] p-4 rounded-xs border border-[#e4e2e2] text-xs font-label-caps">
            <span className="text-[#444748]">
              Showing <strong className="text-[#1b1c1c]">{sortedProducts.length}</strong> divine masterwork(s)
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[#444748] uppercase">Sort By:</span>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })
                }
                className="bg-white border border-[#c4c7c7] px-3 py-1.5 rounded-xs font-body-md text-xs focus:outline-none"
              >
                <option value="popularity">Popularity & Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xs border border-[#e4e2e2] space-y-4 font-body-md">
              <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">
                sentiment_dissatisfied
              </span>
              <h3 className="font-headline-md text-xl font-bold text-[#1b1c1c]">
                No sculptures match selected filters
              </h3>
              <p className="text-xs text-[#747878] max-w-sm mx-auto">
                Try clearing category or timber checkboxes to view our complete heritage collection.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-widest cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => {
                const isWishlisted = wishlistIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="bg-white rounded-xs border border-[#e4e2e2] overflow-hidden hover-lift flex flex-col justify-between group cursor-pointer relative"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#f5f3f3]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Wishlist Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                          isWishlisted
                            ? 'bg-[#ba1a1a] text-white'
                            : 'bg-white/80 text-[#1b1c1c] hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                      >
                        <span
                          className="material-symbols-outlined text-base block"
                          style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                      </button>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {product.isNewArrival && (
                          <span className="bg-[#1c1b1b] text-white text-[9px] font-label-caps uppercase px-2 py-0.5 rounded-xs font-bold tracking-wider">
                            New Arrival
                          </span>
                        )}
                        {product.isLimitedEdition && (
                          <span className="bg-[#fed65b] text-[#745c00] text-[9px] font-label-caps uppercase px-2 py-0.5 rounded-xs font-bold tracking-wider">
                            Limited Edition
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#735c00] font-bold block mb-1">
                          {product.category}
                        </span>
                        <h3 className="font-headline-md font-semibold text-base text-[#1b1c1c] group-hover:text-[#735c00] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs font-body-md text-[#444748] mt-1 line-clamp-2">
                          {product.shortDescription || product.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#e4e2e2] flex justify-between items-center">
                        <div>
                          <span className="font-headline-md font-bold text-base text-[#000000]">
                            {formatPrice(product.priceINR, currency)}
                          </span>
                          <span className="block text-[10px] text-[#747878] font-body-md">
                            {product.material}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="px-3 py-1.5 bg-[#1c1b1b] text-white text-[10px] font-label-caps uppercase tracking-wider hover:opacity-90 cursor-pointer rounded-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">shopping_bag</span>
                          <span>Reserve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 font-label-caps text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-[#c4c7c7] rounded-xs disabled:opacity-40 cursor-pointer hover:bg-white"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xs cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#1c1b1b] text-white font-bold'
                      : 'border border-[#c4c7c7] hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-[#c4c7c7] rounded-xs disabled:opacity-40 cursor-pointer hover:bg-white"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
