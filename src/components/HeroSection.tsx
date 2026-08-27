import React from 'react';
import { HeroSettings, Product, ActiveTab } from '../types';
import { formatPrice } from '../utils/currency';
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Award } from 'lucide-react';

interface HeroSectionProps {
  settings: HeroSettings;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenBespoke?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  products = [],
  onSelectProduct,
  onAddToCart,
  setActiveTab,
  onOpenBespoke,
}) => {
  const featuredProduct = products.find(p => p.id === settings.featuredProductId) || products[0];

  const heroImgUrl = settings.heroImageUrl || (featuredProduct ? featuredProduct.image : 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80');
  const secondaryImgUrl = settings.secondaryImageUrl || (products[1] ? products[1].image : 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80');

  // Font Style helper
  const getFontFamily = (fontStyle: string) => {
    switch (fontStyle) {
      case 'serif_heritage':
        return 'font-serif italic';
      case 'classic_roman':
        return 'tracking-widest uppercase font-serif';
      case 'modern_luxury':
        return 'font-sans font-bold tracking-tight';
      case 'bold_minimal':
        return 'font-sans font-black tracking-normal';
      default:
        return 'font-serif italic';
    }
  };

  // Background Theme helper
  const getBgThemeClass = (theme: string) => {
    switch (theme) {
      case 'royal_ebony':
        return 'bg-[#0f1513] text-white';
      case 'sandalwood_woodgrain':
        return 'bg-[#1c130e] text-[#fbf5e8] border-b border-[#ba7a1a]/30';
      case 'imperial_emerald':
        return 'bg-gradient-to-r from-[#0b2b1a] via-[#14472c] to-[#0b2b1a] text-white';
      case 'midnight_velvet':
        return 'bg-[#111827] text-white';
      case 'warm_amber':
        return 'bg-gradient-to-r from-[#3b1a0a] via-[#5c2a12] to-[#3b1a0a] text-amber-50';
      default:
        return 'bg-[#fbf9f8] text-[#1b1c1c]';
    }
  };

  const fontClass = getFontFamily(settings.fontStyle);
  const themeClass = getBgThemeClass(settings.bgTheme);
  const overlayStyle = { backgroundColor: `rgba(0, 0, 0, ${settings.overlayOpacity / 100})` };

  // 1. FULLSCREEN BACKGROUND HERO LAYOUT
  if (settings.layout === 'fullscreen_bg') {
    return (
      <section className="relative overflow-hidden min-h-[540px] md:min-h-[640px] flex items-center justify-center text-center px-6 py-16">
        <div className="absolute inset-0 z-0">
          <img src={heroImgUrl} alt={settings.headline} className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={overlayStyle} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-white animate-fadeIn">
          {settings.badge && (
            <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#0f1513] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.badge}</span>
            </div>
          )}

          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight ${fontClass}`}>
            {settings.headline}
          </h1>

          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-gray-200 leading-relaxed">
            {settings.description}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href={settings.primaryCtaLink || '#shop'}
              onClick={(e) => {
                if (settings.primaryCtaLink === '#shop' && setActiveTab) {
                  e.preventDefault();
                  setActiveTab('shop');
                }
              }}
              className="px-8 py-3.5 bg-[#fed65b] text-[#0f1513] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>{settings.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {settings.secondaryCtaText && (
              <a
                href={settings.secondaryCtaLink || '#bespoke'}
                onClick={(e) => {
                  if (settings.secondaryCtaLink === '#bespoke' && onOpenBespoke) {
                    e.preventDefault();
                    onOpenBespoke();
                  }
                }}
                className="px-8 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                {settings.secondaryCtaText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 2. CENTERED MINIMAL HERO LAYOUT
  if (settings.layout === 'centered_minimal') {
    return (
      <section className={`relative overflow-hidden px-6 py-16 text-center ${themeClass}`}>
        <div className="max-w-4xl mx-auto space-y-6 border-2 border-[#fed65b]/40 p-8 sm:p-12 rounded-2xl relative">
          {settings.badge && (
            <span className="bg-[#fed65b] text-[#0f1513] text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
              {settings.badge}
            </span>
          )}

          <h1 className={`text-3xl sm:text-5xl font-bold leading-tight ${fontClass}`}>
            {settings.headline}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {settings.description}
          </p>

          <div className="w-full max-w-xl mx-auto h-64 sm:h-80 rounded-xl overflow-hidden shadow-2xl border border-white/20 my-6">
            <img src={heroImgUrl} alt={settings.headline} className="w-full h-full object-cover" />
          </div>

          <div className="flex justify-center gap-4">
            <a
              href={settings.primaryCtaLink || '#shop'}
              className="px-8 py-3 bg-[#fed65b] text-[#0f1513] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-white transition-all shadow-md cursor-pointer"
            >
              {settings.primaryCtaText}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // 3. FLOATING 3D CARD HERO LAYOUT
  if (settings.layout === 'floating_card') {
    return (
      <section className={`relative overflow-hidden px-6 py-16 ${themeClass}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 space-y-5">
            {settings.badge && (
              <span className="text-xs font-bold uppercase tracking-wider text-[#fed65b]">
                {settings.badge}
              </span>
            )}
            <h1 className={`text-3xl sm:text-5xl font-bold leading-tight ${fontClass}`}>
              {settings.headline}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {settings.description}
            </p>
            <div className="pt-2 flex gap-3">
              <a
                href={settings.primaryCtaLink || '#shop'}
                className="px-6 py-3 bg-[#fed65b] text-[#0f1513] font-bold text-xs uppercase rounded-xl hover:bg-white transition-all cursor-pointer"
              >
                {settings.primaryCtaText}
              </a>
            </div>
          </div>

          <div className="md:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md h-80 sm:h-96 rounded-2xl overflow-hidden border-4 border-[#fed65b]/60 shadow-2xl transform hover:rotate-1 transition-transform duration-500">
              <img src={heroImgUrl} alt={settings.headline} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold text-[#fed65b] uppercase">Heritage Masterpiece</span>
                  <h3 className="text-white text-lg font-bold">{featuredProduct ? featuredProduct.name : 'Sanctified Teak Panel'}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 4. DUAL SCULPTURE GRID HERO LAYOUT
  if (settings.layout === 'dual_sculpture_grid') {
    return (
      <section className={`relative overflow-hidden px-6 py-12 ${themeClass}`}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            {settings.badge && (
              <span className="bg-[#fed65b] text-[#0f1513] text-xs font-bold px-3 py-1 rounded-full uppercase">
                {settings.badge}
              </span>
            )}
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${fontClass}`}>
              {settings.headline}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              {settings.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72 sm:h-80 rounded-2xl overflow-hidden relative border border-white/20 shadow-xl group">
              <img src={heroImgUrl} alt="Primary Masterpiece" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <span className="text-white font-bold text-lg">Royal Collection I</span>
              </div>
            </div>

            <div className="h-72 sm:h-80 rounded-2xl overflow-hidden relative border border-white/20 shadow-xl group">
              <img src={secondaryImgUrl} alt="Secondary Masterpiece" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <span className="text-white font-bold text-lg">Royal Collection II</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 5. CLASSIC SPLIT HERO LAYOUT (DEFAULT)
  return (
    <section className={`relative overflow-hidden px-4 md:px-8 py-8 md:py-16 ${themeClass}`}>
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column - Featured Sculpture Masterpiece Card */}
        <div className="lg:col-span-7 relative group">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-white">
            <img
              src={heroImgUrl}
              alt={settings.headline}
              className="w-full h-[380px] sm:h-[480px] md:h-[540px] object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            {settings.badge && (
              <div className="absolute top-6 left-6 bg-[#0f1513]/90 backdrop-blur-md text-[#fed65b] px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-[#fed65b]/40">
                {settings.badge}
              </div>
            )}

            {featuredProduct && (
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[#1c1b1b]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#735c00] block">
                    Featured Masterpiece
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#1b1c1c]">
                    {featuredProduct.name}
                  </h3>
                  <p className="text-xs text-[#444748]">
                    {featuredProduct.material} • {featuredProduct.dimensions}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {onSelectProduct && (
                    <button
                      onClick={() => onSelectProduct(featuredProduct)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-[#1c1b1b] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 cursor-pointer"
                    >
                      View Details
                    </button>
                  )}
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(featuredProduct)}
                      className="px-3 py-2 bg-[#fed65b] text-[#745c00] text-xs font-bold uppercase rounded-lg hover:bg-[#fed65b]/80 cursor-pointer flex items-center justify-center"
                      title="Add to Basket"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Brand Copy & CTAs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-block border-b-2 border-[#fed65b] pb-1">
            <span className="text-xs uppercase tracking-widest text-[#fed65b] font-bold">
              Handcrafted Heritage Woodcrafts
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight ${fontClass}`}>
            {settings.headline}
          </h1>

          <p className="text-xs sm:text-sm md:text-base leading-relaxed opacity-90">
            {settings.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 text-xs font-bold uppercase tracking-widest">
            <a
              href={settings.primaryCtaLink || '#shop'}
              onClick={(e) => {
                if (settings.primaryCtaLink === '#shop' && setActiveTab) {
                  e.preventDefault();
                  setActiveTab('shop');
                }
              }}
              className="px-6 py-3.5 bg-[#fed65b] text-[#0f1513] rounded-xl hover:bg-white transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer font-bold"
            >
              <span>{settings.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {settings.secondaryCtaText && (
              <a
                href={settings.secondaryCtaLink || '#bespoke'}
                onClick={(e) => {
                  if (settings.secondaryCtaLink === '#bespoke' && onOpenBespoke) {
                    e.preventDefault();
                    onOpenBespoke();
                  }
                }}
                className="px-6 py-3.5 bg-transparent border-2 border-[#fed65b] text-[#fed65b] hover:bg-[#fed65b] hover:text-[#0f1513] rounded-xl transition-all text-center cursor-pointer font-bold"
              >
                {settings.secondaryCtaText}
              </a>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
