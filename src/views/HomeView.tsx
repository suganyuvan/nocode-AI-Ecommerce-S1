import React, { useState, useEffect } from 'react';
import { Product, Currency, ActiveTab, PageContent, HeroSettings } from '../types';
import { formatPrice } from '../utils/currency';
import { PromotionalBanner } from '../components/PromotionalBanner';
import { HeroSection } from '../components/HeroSection';
import { fetchHeroSettings, DEFAULT_HERO_SETTINGS } from '../utils/pageContentEngine';

interface HomeViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  currency: Currency;
  products: Product[];
  pageContent: PageContent[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  onSelectProduct,
  onAddToCart,
  currency,
  products,
  pageContent = [],
}) => {
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(DEFAULT_HERO_SETTINGS);

  useEffect(() => {
    fetchHeroSettings().then(res => setHeroSettings(res));

    const handleHeroUpdate = (e: any) => {
      if (e.detail) {
        setHeroSettings(e.detail);
      } else {
        fetchHeroSettings().then(res => setHeroSettings(res));
      }
    };

    window.addEventListener('irisjev_hero_updated', handleHeroUpdate);
    return () => window.removeEventListener('irisjev_hero_updated', handleHeroUpdate);
  }, []);


  const getSection = (sectionName: string) => {
    return pageContent.find(c => c.section === sectionName)?.content || {};
  };


  const heroContent = getSection('hero');
  const statsContent = getSection('stats');
  const templeContent = getSection('temple');
  const ecoContent = getSection('eco');
  const instagramContent = getSection('instagram');

  const spotlightProducts = products.filter((p) => p.featuredInSpotlight);
  const heroGanesha = products.find((p) => p.id === (heroContent.featuredProductId || 'ganesha-sculpture-01')) || products[0];

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Promotional Banner Slot for Homepage */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-4">
        <PromotionalBanner targetPage="home_hero" />
      </div>

      {/* Dynamic Page-Builder Driven Hero Section */}
      <HeroSection
        settings={heroSettings}
        products={products}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
        setActiveTab={setActiveTab}
      />

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#c4c7c7]/40 text-center font-body-md">
              {(statsContent.items || [
                { value: '48+ Yrs', label: 'Carving Legacy' },
                { value: '100%', label: 'Ethical Timber' },
                { value: '4,500+', label: 'Global Shrines' }
              ]).map((stat: any, idx: number) => (
                <div key={idx}>
                  <span className="font-display-lg text-xl font-bold text-[#1b1c1c] block">{stat.value}</span>
                  <span className="text-[11px] text-[#444748] font-label-caps uppercase">{stat.label}</span>
                </div>
              ))}
            </div>

      {/* Spotlight Section - Screen 3 & Screen 1 Showcase */}

      <section className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#c4c7c7]/40 pb-4">
          <div>
            <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block mb-1">
              Handpicked Collections
            </span>
            <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-[#1b1c1c] italic">
              In the Spotlight...
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('shop')}
            className="text-xs font-label-caps uppercase tracking-widest text-[#1c1b1b] font-bold hover:text-[#735c00] flex items-center gap-1 cursor-pointer"
          >
            <span>View All {spotlightProducts.length + 4} Sculptures</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {spotlightProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xs border border-[#e4e2e2] overflow-hidden hover-lift flex flex-col justify-between group cursor-pointer"
              onClick={() => onSelectProduct(product)}
            >
              <div className="relative aspect-4/3 overflow-hidden bg-[#fbf9f8]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />

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
                  {product.isBestSeller && (
                    <span className="bg-[#735c00] text-white text-[9px] font-label-caps uppercase px-2 py-0.5 rounded-xs font-bold tracking-wider">
                      Best Seller
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white/90 p-1.5 rounded-full text-[#1b1c1c] shadow-md hover:text-[#735c00]">
                    <span className="material-symbols-outlined text-base">visibility</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#735c00] font-bold block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-headline-md font-semibold text-lg text-[#1b1c1c] group-hover:text-[#735c00] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs font-body-md text-[#444748] line-clamp-2 mt-1">
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
                    className="px-3 py-1.5 bg-[#1c1b1b] text-white text-[11px] font-label-caps uppercase tracking-wider hover:opacity-90 cursor-pointer rounded-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">shopping_bag</span>
                    <span>Reserve</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sacred Temple Collection Feature Section */}
      <section className="bg-[#1c1b1b] text-white py-16 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-label-caps uppercase tracking-widest text-[#fed65b] font-bold block">
              {templeContent.badge || 'Architectural Temple Craftsmanship'}
            </span>

            <h2 className="font-display-lg text-3xl md:text-4xl font-bold italic leading-tight">
              {templeContent.title || 'The Sacred Temple Collection & Mandapams'}
            </h2>

            <p className="font-body-lg text-[#e5e2e1] leading-relaxed">
              {templeContent.description || 'Designed for luxury private homes and spiritual sanctuaries. Inspired by the UNESCO heritage temples of Hampi, Belur, and Tanjore. Every mandapam features hand-turned pillars, brass oil lamp brackets, concealed drawers, and LED lattice illumination.'}
            </p>

            <div className="space-y-3 font-body-md text-sm text-[#e5e2e1]">
              {(templeContent.features || [
                '100% Sustainable Aged Burmese & Indian Teak Wood',
                'Custom CAD 3D Blueprints provided prior to hand carving',
                'White-Glove Worldwide Delivery & Assembly Support'
              ]).map((feature: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#fed65b]">check_circle</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 font-label-caps text-xs uppercase tracking-widest">
              <button
                onClick={() => setActiveTab('temple-projects')}
                className="px-8 py-4 bg-[#fed65b] text-[#745c00] font-bold hover:bg-[#fed65b]/90 cursor-pointer text-center"
              >
                {templeContent.buttonText || 'View Temple Portfolio'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden rounded-xs border border-white/20 shadow-2xl">
              <img
                src={templeContent.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCopiZFKKw0hGQPYG_mLJdJ5OB7pOHQxsc3Z1QMibWen6WwhVBTKcCX8q6DR76oTyFF2Ya7jXDFMdIHUWPvL0KHHsQ98AdTlT59EjnWnqwWqqYHrJDWISDmnviw_egcQEkqqmzjpjPgubHoVVY7mySXhS-McHYfNe0WiLyTw7jKsBOMWUdNItg8AjA76PraiU4VURKLncMTXH1mbmJ369jGX9-62e8B7aI0rbQE4dSxe-Zv2Uczn_gmeA'}
                alt="Sacred Temple Mandapam"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-black/80 px-4 py-2 text-xs font-label-caps text-white rounded-xs">
                {templeContent.imageCaption || 'Mandapam Model: Hampi Royal Sanctuary'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Eco Credentials */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
            {ecoContent.badge || 'Sustainability & Ethics'}
          </span>
          <h2 className="font-display-lg text-3xl font-bold text-[#1b1c1c] italic">
            {ecoContent.title || 'Our Eco Credentials'}
          </h2>
          <p className="font-body-md text-[#444748]">
            {ecoContent.description || 'We honor the trees that grant us their timber. Every piece carved is paired with active reforestation and fair artisan support.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-body-md text-center">
          {(ecoContent.items || [
            { icon: 'park', title: '1-for-1 Reforestation', description: 'We plant five teak and rosewood saplings in Karnataka forestry reserves for every single sculpture commissioned.' },
            { icon: 'recycling', title: 'Reclaimed Vintage Beams', description: 'Our wall panels and mirrors utilize 80+ year old seasoned teak salvaged from ancient South Indian ancestral homes.' },
            { icon: 'handshake', title: 'Direct Artisan Guild', description: 'We empower 80+ artisan families with fair living wages, health coverage, and traditional craft apprenticeships.' }
          ]).map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-8 rounded-xs border border-[#e4e2e2] space-y-4 hover:border-[#1c1b1b] transition-colors">
              <div className="w-14 h-14 bg-[#f5f3f3] rounded-full flex items-center justify-center mx-auto text-[#735c00]">
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-[#1b1c1c]">
                {item.title}
              </h3>
              <p className="text-sm text-[#444748]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram Feed Grid */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
            {instagramContent.badge || 'Follow Our Craft Journey'}
          </span>
          <h2 className="font-display-lg text-2xl font-bold text-[#1b1c1c]">
            {instagramContent.handle || '@swarna_wooden_crafts'}
          </h2>
          <p className="font-body-md text-sm text-[#444748]">
            {instagramContent.description || 'Tag your home shrines with #IrisjevCrafts to be featured in our monthly circle gallery.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {(instagramContent.images || [
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBS1ELlckSMDlqJ1YXaEkUx7yAMpnOUG0wSOgFPuBit9lC4XD9DBl1Q8BG3LvLRbB9hzZuuRKJgW_2u05do-W3VljhE2jtNEk7rqW5mphJw6SybKHl3RLE5kyodeV56ff9bNGaMzMI4Ch_lkBuA20zWlbdM7TfsLP4fQ6Maf6SGNj58O2Ph2TMzHuHDf_XAH7dKIhcmdpEtBfjehjHf6LuIjEhlRkre8aZY7KL7KmcZ3Vh9ADlmq5HzIQ',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBaen1JgbPQ50iJvvmonLoEqTq-cTEs-yICskF4AzzNWCGrb2yJfec-2LLhfWgW-ZRdfvM9P2GwBnjP4ac0TxfDLa-ycEl-ZjH2HS860tJdeT9Hsd8N4V40ahyrDcxyJfGQUlZ3l3AGAbBf6nIW-AKRlX8ezJxWGvPWnbGiyPgOXMieXuNXWgVIS97KMzp4pd9PcSymqyhVmSBrihU7UXhY_fB-JXEbhye14jGRyezYmoMGbajeIF0huA',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuA_YuhgcG5heo6xKcyUpgaAeJASCdnVZP0kln-_gUwqWfNMlxPopZMoftXy6mswafTasS6mi-jCx_9m-RlP9OEQHWeEbMsi9sV4ShHVk4JPv8uWXdONoKXIX-36VH66IXGug3ZE_7nqL1kOluNB9T0pqhYi2ijwKI_KniaIe_Bi1kZBnsjl_3P1oP677NIuZyBsB85KteVKDTc5h_pVBAabEWGgHt_3jvdgfPZy7nKA6uOEWmEPazYM7w',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFRkdOaQU4PHApGgQbo_FJRUjh1MWNQbeVUOa8g25g4gGXpzYkjcrLVV0NykvQULzI9wUoTnbhcTMzjwK3pH91RxnlfZhy63kwiJEJni-4LQZ-9k31P5aPfvagrzdNUBtxnm-XKqTToXMfYS5Cj-kT8a5q8M4o47IkDCqCDHERKbjuhLd0linMoTLJJCDotqMNol3iSK-sJnWWCwPWGL70TEZdU9k3iRqszpyCTM0CR9QHZwUvwNIOg',
          ]).map((src: string, idx: number) => (
            <div
              key={idx}
              className="relative aspect-square overflow-hidden group rounded-xs border border-[#e4e2e2]"
            >
              <img
                src={src}
                alt={`Instagram Post ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
