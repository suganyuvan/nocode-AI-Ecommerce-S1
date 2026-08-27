import React, { useEffect, useState } from 'react';
import { PromoBanner, PromoBannerTargetPage, PromoBannerStylePreset, PromoBannerAnimation } from '../types';
import { fetchPromoBanners } from '../utils/promoBannerEngine';
import { Sparkles, ArrowRight, ShieldCheck, Tag, Zap } from 'lucide-react';

interface PromotionalBannerProps {
  targetPage: PromoBannerTargetPage;
  customBanner?: PromoBanner; // Optional override for live preview drawer in Admin
  className?: string;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  targetPage,
  customBanner,
  className = '',
}) => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customBanner) {
      setBanners([customBanner]);
      setLoading(false);
      return;
    }

    fetchPromoBanners(targetPage).then(data => {
      setBanners(data);
      setLoading(false);
    });
  }, [targetPage, customBanner]);

  if (loading) return null;
  if (banners.length === 0) return null;

  const banner = banners[0]; // Display primary active banner for this placement slot

  // Preset Style Classes
  const getStyleClasses = (preset: PromoBannerStylePreset) => {
    switch (preset) {
      case 'royal_gold':
        return {
          container: 'bg-[#0f1513] border-2 border-[#fed65b]/60 text-white shadow-xl shadow-[#fed65b]/10',
          badge: 'bg-[#fed65b] text-[#0f1513] font-bold',
          title: 'text-[#ffffff]',
          subtitle: 'text-[#fed65b]/90',
          button: 'bg-[#fed65b] text-[#0f1513] hover:bg-white hover:text-black font-bold shadow-md',
        };
      case 'dark_luxury':
        return {
          container: 'bg-[#18181b] border border-gray-800 text-gray-100 shadow-2xl',
          badge: 'bg-gray-800 text-gray-200 border border-gray-700',
          title: 'text-white',
          subtitle: 'text-gray-400',
          button: 'bg-white text-black hover:bg-gray-200 font-bold',
        };
      case 'emerald_mint':
        return {
          container: 'bg-gradient-to-r from-[#0b2b1a] via-[#14472c] to-[#0b2b1a] border border-emerald-400/40 text-emerald-50 shadow-lg shadow-emerald-950/40',
          badge: 'bg-emerald-400 text-emerald-950 font-bold',
          title: 'text-white',
          subtitle: 'text-emerald-200',
          button: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-bold',
        };
      case 'sunset_glow':
        return {
          container: 'bg-gradient-to-r from-[#3b1a0a] via-[#5c2a12] to-[#3b1a0a] border border-amber-500/40 text-amber-50 shadow-lg shadow-amber-950/40',
          badge: 'bg-amber-400 text-amber-950 font-bold',
          title: 'text-amber-100',
          subtitle: 'text-amber-200/90',
          button: 'bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold',
        };
      case 'glassmorphism':
        return {
          container: 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl',
          badge: 'bg-white/20 text-white border border-white/30 backdrop-blur-xs font-bold',
          title: 'text-white',
          subtitle: 'text-gray-200',
          button: 'bg-white text-black hover:bg-white/90 font-bold',
        };
      case 'neon_cyber':
        return {
          container: 'bg-[#09090b] border-2 border-amber-400 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
          badge: 'bg-amber-400 text-black font-bold uppercase tracking-wider',
          title: 'text-white',
          subtitle: 'text-amber-300/80',
          button: 'bg-amber-400 text-black hover:bg-white font-bold',
        };
      case 'minimal_clean':
        return {
          container: 'bg-[#fcfaf7] border-2 border-[#e8e4dc] text-[#111615] shadow-xs',
          badge: 'bg-[#0f1513] text-white font-bold',
          title: 'text-[#111615]',
          subtitle: 'text-[#555858]',
          button: 'bg-[#0f1513] text-white hover:bg-[#1f2926] font-bold',
        };
      case 'coral_blush':
        return {
          container: 'bg-gradient-to-r from-[#381619] via-[#5c2429] to-[#381619] border border-rose-400/40 text-rose-50 shadow-lg shadow-rose-950/40',
          badge: 'bg-rose-300 text-rose-950 font-bold',
          title: 'text-rose-100',
          subtitle: 'text-rose-200/90',
          button: 'bg-rose-300 text-rose-950 hover:bg-rose-200 font-bold',
        };
      case 'wooden_classic':
        return {
          container: 'bg-[#1c130e] border-2 border-[#ba7a1a]/60 text-[#f5ebd9] shadow-xl shadow-black/40',
          badge: 'bg-[#ba7a1a] text-white font-bold',
          title: 'text-[#fbf5e8]',
          subtitle: 'text-[#ba7a1a]/90',
          button: 'bg-[#ba7a1a] text-white hover:bg-[#d48e24] font-bold shadow-md',
        };
      case 'gradient_ocean':
        return {
          container: 'bg-gradient-to-r from-[#051c2c] via-[#093554] to-[#051c2c] border border-cyan-400/40 text-cyan-50 shadow-lg shadow-cyan-950/40',
          badge: 'bg-cyan-400 text-cyan-950 font-bold',
          title: 'text-white',
          subtitle: 'text-cyan-200/90',
          button: 'bg-cyan-400 text-cyan-950 hover:bg-cyan-300 font-bold',
        };
      default:
        return {
          container: 'bg-[#0f1513] border-2 border-[#fed65b]/60 text-white shadow-xl',
          badge: 'bg-[#fed65b] text-[#0f1513] font-bold',
          title: 'text-white',
          subtitle: 'text-[#fed65b]/90',
          button: 'bg-[#fed65b] text-[#0f1513] hover:bg-white font-bold',
        };
    }
  };

  // Preset Animation CSS Effects
  const getAnimationClass = (animation: PromoBannerAnimation) => {
    switch (animation) {
      case 'pulse_glow':
        return 'animate-pulse';
      case 'slide_in_left':
        return 'animate-fadeIn';
      case 'fade_zoom':
        return 'transition-transform duration-500 hover:scale-[1.01]';
      case 'shimmer_shine':
        return 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_3s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent';
      case 'bounce_gentle':
        return 'animate-bounce';
      case 'floating_3d':
        return 'hover:-translate-y-1 transition-all duration-300';
      default:
        return '';
    }
  };

  const style = getStyleClasses(banner.style_preset);
  const animClass = getAnimationClass(banner.animation_type);

  // If header_marquee, display as compact top ticker bar
  if (banner.target_page === 'header_marquee') {
    return (
      <div className={`w-full py-2 px-4 transition-all duration-300 relative z-30 ${style.container} ${animClass} ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-center sm:text-left">
          <div className="flex items-center gap-2 font-medium">
            {banner.badge_text && (
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${style.badge}`}>
                {banner.badge_text}
              </span>
            )}
            <span className={`font-bold ${style.title}`}>{banner.title}</span>
            {banner.subtitle && <span className={`hidden md:inline ${style.subtitle}`}>— {banner.subtitle}</span>}
          </div>
          {banner.cta_text && (
            <a
              href={banner.cta_link || '#shop'}
              className={`px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 ${style.button}`}
            >
              <span>{banner.cta_text}</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Full Featured Banner (Home Hero, Checkout, Cart Drawer, All)
  return (
    <div className={`w-full rounded-2xl overflow-hidden p-6 sm:p-8 transition-all duration-300 relative z-20 ${style.container} ${animClass} ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Banner Copy Content */}
        <div className="space-y-3 flex-1 text-center md:text-left">
          {banner.badge_text && (
            <div className="inline-flex items-center gap-1.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                <Sparkles className="w-3 h-3 inline mr-1" />
                {banner.badge_text}
              </span>
            </div>
          )}

          <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight ${style.title}`}>
            {banner.title}
          </h3>

          {banner.subtitle && (
            <p className={`text-xs sm:text-sm font-medium max-w-2xl ${style.subtitle}`}>
              {banner.subtitle}
            </p>
          )}

          {banner.cta_text && (
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href={banner.cta_link || '#shop'}
                className={`px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer ${style.button}`}
              >
                <span>{banner.cta_text}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Banner Optional Image */}
        {banner.image_url && (
          <div className="w-full md:w-64 h-36 sm:h-44 rounded-xl overflow-hidden border border-white/20 shadow-md shrink-0">
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
