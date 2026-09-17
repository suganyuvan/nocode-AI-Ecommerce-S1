import React, { useId } from 'react';
import { HeroSettings, Product, ActiveTab } from '../types';
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Compass } from 'lucide-react';

interface AnimatedHeritageCollageHeroProps {
  settings: HeroSettings;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenBespoke?: () => void;
}

const DEFAULT_COLLAGE_IMAGES = [
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
];

export const AnimatedHeritageCollageHero: React.FC<AnimatedHeritageCollageHeroProps> = ({
  settings,
  products = [],
  onSelectProduct,
  onAddToCart,
  setActiveTab,
  onOpenBespoke,
}) => {
  const compId = useId().replace(/:/g, '');
  const featuredProduct = products.find(p => p.id === settings.featuredProductId) || products[0];

  // Font helper
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

  // Extract images (3 to 5 images)
  const rawImages = (settings.collageImages && settings.collageImages.length >= 3)
    ? settings.collageImages.filter(img => img && img.trim() !== '')
    : [
        settings.heroImageUrl || DEFAULT_COLLAGE_IMAGES[0],
        settings.secondaryImageUrl || DEFAULT_COLLAGE_IMAGES[1],
        DEFAULT_COLLAGE_IMAGES[2],
        DEFAULT_COLLAGE_IMAGES[3],
        DEFAULT_COLLAGE_IMAGES[4],
      ];

  const images = rawImages.length >= 3 ? rawImages : DEFAULT_COLLAGE_IMAGES;
  const imageCount = Math.min(Math.max(images.length, 3), 5);

  const fontClass = getFontFamily(settings.fontStyle);
  const themeClass = getBgThemeClass(settings.bgTheme);

  // Overlay styles
  const overlayClass = (() => {
    switch (settings.collageOverlay) {
      case 'light': return 'bg-black/20';
      case 'medium': return 'bg-black/40';
      case 'dark': return 'bg-black/60';
      default: return 'bg-black/0';
    }
  })();

  const borderRadiusPx = settings.collageBorderRadius !== undefined ? settings.collageBorderRadius : 16;
  const panelRadiusStyle = { borderRadius: `${borderRadiusPx}px` };

  // Speed configuration in seconds
  const animSpeedSec = (() => {
    switch (settings.collageSpeed) {
      case 'slow': return 9;
      case 'fast': return 4;
      default: return 6; // normal
    }
  })();

  const animationStyle = settings.collageAnimationStyle || 'mixed_cinematic';

  // Dynamic CSS keyframes scoped by compId
  const cssKeyframes = `
    @keyframes collageFloat1_${compId} {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(0, -10px, 0) scale(1.025); }
    }
    @keyframes collageFloat2_${compId} {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(0, 8px, 0) scale(1.03); }
    }
    @keyframes collageFloat3_${compId} {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(-6px, -6px, 0) scale(1.02); }
    }
    @keyframes collageFloat4_${compId} {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(8px, -4px, 0) scale(1.035); }
    }
    @keyframes collageFloat5_${compId} {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(-4px, 8px, 0) scale(1.02); }
    }

    @keyframes collageKenBurns1_${compId} {
      0% { transform: scale(1) translate3d(0, 0, 0); }
      50% { transform: scale(1.08) translate3d(-2%, -2%, 0); }
      100% { transform: scale(1) translate3d(0, 0, 0); }
    }
    @keyframes collageKenBurns2_${compId} {
      0% { transform: scale(1.06) translate3d(2%, 0, 0); }
      50% { transform: scale(1) translate3d(-1%, -2%, 0); }
      100% { transform: scale(1.06) translate3d(2%, 0, 0); }
    }
    @keyframes collageKenBurns3_${compId} {
      0% { transform: scale(1) translate3d(0, 2%, 0); }
      50% { transform: scale(1.07) translate3d(2%, -1%, 0); }
      100% { transform: scale(1) translate3d(0, 2%, 0); }
    }

    @keyframes collageFade1_${compId} {
      0%, 100% { opacity: 0.95; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.03); }
    }
    @keyframes collageFade2_${compId} {
      0%, 100% { opacity: 1; transform: scale(1.02); }
      50% { opacity: 0.88; transform: scale(1); }
    }

    .collage-panel-1-${compId} {
      animation: ${
        animationStyle === 'cinematic_fade' ? `collageFade1_${compId} ${animSpeedSec}s ease-in-out infinite` :
        animationStyle === 'slow_zoom' ? `collageKenBurns1_${compId} ${animSpeedSec * 1.5}s ease-in-out infinite` :
        animationStyle === 'ken_burns' ? `collageKenBurns1_${compId} ${animSpeedSec * 1.4}s ease-in-out infinite` :
        animationStyle === 'gentle_parallax' ? `collageFloat1_${compId} ${animSpeedSec}s ease-in-out infinite` :
        `collageFloat1_${compId} ${animSpeedSec}s ease-in-out infinite`
      };
      will-change: transform, opacity;
    }

    .collage-panel-2-${compId} {
      animation: ${
        animationStyle === 'cinematic_fade' ? `collageFade2_${compId} ${animSpeedSec * 1.1}s ease-in-out infinite 0.5s` :
        animationStyle === 'slow_zoom' ? `collageKenBurns2_${compId} ${animSpeedSec * 1.4}s ease-in-out infinite 1s` :
        animationStyle === 'ken_burns' ? `collageKenBurns2_${compId} ${animSpeedSec * 1.3}s ease-in-out infinite 0.8s` :
        animationStyle === 'gentle_parallax' ? `collageFloat2_${compId} ${animSpeedSec * 1.1}s ease-in-out infinite 0.6s` :
        `collageFloat2_${compId} ${animSpeedSec * 1.2}s ease-in-out infinite 0.5s`
      };
      will-change: transform, opacity;
    }

    .collage-panel-3-${compId} {
      animation: ${
        animationStyle === 'cinematic_fade' ? `collageFade1_${compId} ${animSpeedSec * 1.2}s ease-in-out infinite 1.2s` :
        animationStyle === 'slow_zoom' ? `collageKenBurns3_${compId} ${animSpeedSec * 1.6}s ease-in-out infinite 1.5s` :
        animationStyle === 'ken_burns' ? `collageKenBurns3_${compId} ${animSpeedSec * 1.5}s ease-in-out infinite 1.2s` :
        animationStyle === 'gentle_parallax' ? `collageFloat3_${compId} ${animSpeedSec * 1.3}s ease-in-out infinite 1s` :
        `collageFloat3_${compId} ${animSpeedSec * 1.1}s ease-in-out infinite 1.2s`
      };
      will-change: transform, opacity;
    }

    .collage-panel-4-${compId} {
      animation: ${
        animationStyle === 'gentle_parallax' ? `collageFloat4_${compId} ${animSpeedSec * 1.15}s ease-in-out infinite 1.4s` :
        `collageFloat4_${compId} ${animSpeedSec * 1.25}s ease-in-out infinite 1.5s`
      };
      will-change: transform, opacity;
    }

    .collage-panel-5-${compId} {
      animation: ${
        animationStyle === 'gentle_parallax' ? `collageFloat5_${compId} ${animSpeedSec * 1.2}s ease-in-out infinite 0.8s` :
        `collageFloat5_${compId} ${animSpeedSec * 1.3}s ease-in-out infinite 0.9s`
      };
      will-change: transform, opacity;
    }

    @media (prefers-reduced-motion: reduce) {
      .collage-panel-1-${compId},
      .collage-panel-2-${compId},
      .collage-panel-3-${compId},
      .collage-panel-4-${compId},
      .collage-panel-5-${compId} {
        animation: none !important;
        transform: none !important;
      }
    }
  `;

  return (
    <section className={`relative overflow-hidden px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-20 ${themeClass}`}>
      <style>{cssKeyframes}</style>

      {/* Ambient background subtle lighting aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#fed65b]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Brand Story & Headline Typography */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          {/* Badge */}
          {settings.badge && (
            <div className="inline-flex items-center gap-2 bg-[#fed65b] text-[#0f1513] px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.badge}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] text-current ${fontClass}`}>
            {settings.headline}
          </h1>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed max-w-xl">
            {settings.description}
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <a
              href={settings.primaryCtaLink || '#shop'}
              onClick={(e) => {
                if (settings.primaryCtaLink === '#shop' && setActiveTab) {
                  e.preventDefault();
                  setActiveTab('shop');
                }
              }}
              className="px-7 py-3.5 bg-[#fed65b] text-[#0f1513] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white hover:scale-102 active:scale-98 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
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
                className="px-7 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-white hover:text-[#0f1513] hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
              >
                <Compass className="w-3.5 h-3.5 text-[#fed65b]" />
                <span>{settings.secondaryCtaText}</span>
              </a>
            )}
          </div>

          {/* Heritage Trust Badges */}
          <div className="pt-4 border-t border-white/10 flex items-center gap-6 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#fed65b]" />
              <span>Certified Aged Teak & Sandalwood</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fed65b] inline-block animate-pulse" />
              <span>8th Gen Carving Guild</span>
            </div>
          </div>
        </div>

        {/* Right Column: Animated Heritage Collage Artboard */}
        <div className="lg:col-span-7 relative w-full">
          
          {/* DESKTOP & TABLET COLLAGE COMPOSITION (>= 640px) */}
          <div className="hidden sm:block relative w-full min-h-[460px] md:min-h-[520px] lg:min-h-[560px]">
            
            {/* Panel 1: Primary Large Anchor Panel (Center-Left) */}
            <div
              style={panelRadiusStyle}
              className={`collage-panel-1-${compId} absolute top-4 left-0 w-[58%] h-[360px] md:h-[400px] lg:h-[430px] overflow-hidden border-2 border-[#fed65b]/40 shadow-2xl z-20 bg-[#161616] group`}
            >
              <img
                src={images[0]}
                alt="Sacred Wooden Craft Main Piece"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 md:p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fed65b]">
                  Sanctified Masterwork
                </span>
                <span className="text-white text-xs md:text-sm font-bold truncate">
                  {featuredProduct?.name || 'Heritage Teak Sculpture'}
                </span>
              </div>
            </div>

            {/* Panel 2: Secondary Top-Right Floating Panel */}
            <div
              style={panelRadiusStyle}
              className={`collage-panel-2-${compId} absolute top-0 right-2 w-[46%] h-[240px] md:h-[270px] lg:h-[290px] overflow-hidden border border-white/20 shadow-2xl z-30 bg-[#1c130e] group`}
            >
              <img
                src={images[1]}
                alt="Artisan Wood Carving Detail"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute bottom-3 left-3 bg-[#0f1513]/85 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-[#fed65b]">
                Authentic Grain
              </div>
            </div>

            {/* Panel 3: Bottom-Right Offset Panel */}
            <div
              style={panelRadiusStyle}
              className={`collage-panel-3-${compId} absolute bottom-2 right-4 w-[50%] h-[230px] md:h-[260px] lg:h-[280px] overflow-hidden border border-white/30 shadow-2xl z-40 bg-[#0b2b1a] group`}
            >
              <img
                src={images[2]}
                alt="Heritage Sandalwood Sculpture"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 block">Temple Tradition</span>
                    <span className="text-white text-xs font-bold">Handcrafted Shrines</span>
                  </div>
                  {onAddToCart && featuredProduct && (
                    <button
                      onClick={() => onAddToCart(featuredProduct)}
                      className="p-2 bg-[#fed65b] text-[#0f1513] rounded-lg hover:bg-white transition-all shadow cursor-pointer"
                      title="Add to Basket"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 4: Optional Bottom-Left Micro Accent (if >= 4 images) */}
            {imageCount >= 4 && (
              <div
                style={panelRadiusStyle}
                className={`collage-panel-4-${compId} absolute bottom-0 left-6 w-[36%] h-[150px] md:h-[170px] overflow-hidden border border-[#fed65b]/50 shadow-2xl z-50 bg-[#111827] group`}
              >
                <img
                  src={images[3]}
                  alt="Chisel Carving Craft Texture"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 ${overlayClass}`} />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-bold text-white">
                  Chisel Heritage
                </div>
              </div>
            )}

            {/* Panel 5: Optional Center-Top Floating Badge Accent (if 5 images) */}
            {imageCount >= 5 && (
              <div
                style={panelRadiusStyle}
                className={`collage-panel-5-${compId} absolute top-12 left-[44%] w-[24%] h-[120px] md:h-[135px] overflow-hidden border-2 border-white/40 shadow-2xl z-40 bg-[#3b1a0a] group`}
              >
                <img
                  src={images[4]}
                  alt="Royal Finished Artifact"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 ${overlayClass}`} />
                <div className="absolute inset-0 flex items-center justify-center p-1 text-center bg-black/40">
                  <span className="text-[9px] font-bold text-[#fed65b] uppercase tracking-wider">
                    Royal Finish
                  </span>
                </div>
              </div>
            )}

            {/* Floating Decorative Gold Stamp */}
            <div className="absolute -top-3 left-1/3 z-50 bg-[#0f1513]/90 backdrop-blur-md border border-[#fed65b]/60 text-[#fed65b] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-xl flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Swarna Heritage Gallery</span>
            </div>
          </div>

          {/* MOBILE COLLAGE COMPOSITION (< 640px / 320px - 480px) */}
          <div className="block sm:hidden relative w-full pt-2 pb-6">
            
            {/* Primary Mobile Master Panel */}
            <div
              style={{ borderRadius: `${Math.min(borderRadiusPx, 16)}px` }}
              className={`collage-panel-1-${compId} relative w-full h-[260px] overflow-hidden border-2 border-[#fed65b]/40 shadow-xl bg-[#161616]`}
            >
              <img
                src={images[0]}
                alt="Sacred Wooden Craft Main Piece"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#fed65b]">
                  Sanctified Masterwork
                </span>
                <span className="text-white text-xs font-bold truncate">
                  {featuredProduct?.name || 'Heritage Teak Sculpture'}
                </span>
              </div>
            </div>

            {/* Secondary Floating Accent Card 1 (Bottom Right Overlap) */}
            <div
              style={{ borderRadius: `${Math.max(borderRadiusPx - 4, 10)}px` }}
              className={`collage-panel-2-${compId} absolute -bottom-2 right-2 w-[48%] h-[125px] overflow-hidden border border-white/30 shadow-2xl z-30 bg-[#1c130e]`}
            >
              <img
                src={images[1]}
                alt="Artisan Wood Carving Detail"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute bottom-1.5 left-1.5 bg-[#0f1513]/85 backdrop-blur-xs px-2 py-0.5 rounded text-[8px] font-bold text-[#fed65b]">
                Authentic Grain
              </div>
            </div>

            {/* Secondary Floating Accent Card 2 (Top Left Overlap if >= 3 images) */}
            <div
              style={{ borderRadius: `${Math.max(borderRadiusPx - 4, 10)}px` }}
              className={`collage-panel-3-${compId} absolute -top-1 left-2 w-[40%] h-[95px] overflow-hidden border border-[#fed65b]/50 shadow-2xl z-30 bg-[#0b2b1a]`}
            >
              <img
                src={images[2]}
                alt="Heritage Sandalwood Sculpture"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
              <div className={`absolute inset-0 ${overlayClass}`} />
              <div className="absolute top-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">
                Master Guild
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
