import React, { useState, useEffect } from 'react';
import { Product, Currency, ActiveTab, Review, ShippingAndPaymentSettings } from '../types';
import { formatPrice } from '../utils/currency';
import { supabase } from '../utils/supabaseClient';
import { DEFAULT_SHIPPING_PAYMENT_SETTINGS, PINCODE_CITY_STATE_MAP } from '../admin/views/ShippingManager';
import { validateIndianPincode } from '../utils/pincodeValidator';

import { trackProductView } from '../utils/pageViewAnalyticsEngine';

interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (product: Product, timber: string) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  currency: Currency;
  setActiveTab: (tab: ActiveTab) => void;
}

interface TransitEstimate {
  profileName: string;
  courierNotes: string;
  timelineText: string;
  estimatedDateRange: string;
  locationName: string;
  shippingChargeText: string;
  isCodAvailable: boolean;
  codFee: number;
  isFreeShipping: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  currency,
  setActiveTab,
}) => {
  const [selectedImage, setSelectedImage] = useState(
    product.galleryImages[0] || product.image
  );
  const [selectedTimber, setSelectedTimber] = useState(
    product.timberOptions[0] || product.material
  );
  const [activeAccordion, setActiveAccordion] = useState<string | null>('heritage');
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [transitEstimate, setTransitEstimate] = useState<TransitEstimate | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product) {
      trackProductView({ id: product.id, name: product.name, category: product.category });
    }
  }, [product?.id]);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Load reviews from Supabase
  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id);
      
      if (data) {
        setReviews(data.map(r => ({
          id: r.id,
          productId: r.product_id,
          userName: r.user_name,
          userLocation: r.user_location,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
          verifiedPurchase: r.verified_purchase,
          userPhoto: r.user_photo,
        })));
      }
    };
    fetchReviews();
  }, [product.id]);

  // Load active shipping settings from localStorage or fallback
  const [shippingSettings, setShippingSettings] = useState<ShippingAndPaymentSettings>(() => {
    try {
      const stored = localStorage.getItem('irisjev_shipping_payment_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read shipping settings:', e);
    }
    return DEFAULT_SHIPPING_PAYMENT_SETTINGS;
  });

  // Calculate Delivery Dates from Timeline string
  const computeDeliveryDates = (timeline: string) => {
    const nums = timeline.match(/\d+/g);
    const minDays = nums && nums[0] ? parseInt(nums[0], 10) : 3;
    const maxDays = nums && nums[1] ? parseInt(nums[1], 10) : minDays + 2;

    const addBusinessDays = (days: number) => {
      const d = new Date();
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) { // Skip Sunday
          added++;
        }
      }
      return d;
    };

    const minDate = addBusinessDays(minDays);
    const maxDate = addBusinessDays(maxDays);

    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${minDate.toLocaleDateString('en-IN', options)} – ${maxDate.toLocaleDateString('en-IN', options)}`;
  };

  // Evaluate transit lead time and profile match for given PIN code
  const evaluatePincode = (inputPin: string) => {
    const cleanPin = inputPin.replace(/\D/g, '').trim();
    if (!cleanPin) {
      setPincodeResult(null);
      setTransitEstimate(null);
      return;
    }

    if (cleanPin.length !== 6) {
      setPincodeResult('Please enter a valid 6-digit Indian PIN code.');
      setTransitEstimate(null);
      return;
    }

    const validation = validateIndianPincode(cleanPin, '');
    const prefix3 = cleanPin.slice(0, 3);
    const detectedCity = validation.detectedCity || PINCODE_CITY_STATE_MAP[prefix3]?.city || '';
    const detectedState = validation.detectedState || PINCODE_CITY_STATE_MAP[prefix3]?.state || '';

    // Active profiles
    const profiles = shippingSettings.profiles.filter(p => p.isEnabled);
    let matchedProfile = profiles.find(p => {
      if (!p.pincodeWildcards) return false;
      const patterns = p.pincodeWildcards.split(',').map(s => s.trim()).filter(Boolean);
      return patterns.some(pattern => {
        if (pattern.endsWith('*')) {
          return cleanPin.startsWith(pattern.slice(0, -1));
        }
        return pattern === cleanPin;
      });
    });

    if (!matchedProfile && detectedState) {
      matchedProfile = profiles.find(p => 
        p.applicableStates && p.applicableStates.some(s => s.toLowerCase() === detectedState.toLowerCase())
      );
    }

    if (!matchedProfile) {
      matchedProfile = profiles.find(p => p.isDefault) || profiles.find(p => p.isAllIndia) || profiles[0];
    }

    if (!matchedProfile) {
      setPincodeResult('Serviceable via standard insured courier.');
      setTransitEstimate(null);
      return;
    }

    // Shipping charge calculation
    const isFreeShipping = matchedProfile.freeShippingThreshold > 0 && product.priceINR >= matchedProfile.freeShippingThreshold;
    const shippingChargeText = isFreeShipping 
      ? 'FREE White-Glove Insured Delivery' 
      : matchedProfile.baseCharge > 0 
      ? `₹${matchedProfile.baseCharge} Insured Shipping` 
      : 'FREE Insured Delivery';

    // COD check
    const isCodRestricted = (shippingSettings.cod.restrictedPincodes || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .some(pattern => pattern.endsWith('*') ? cleanPin.startsWith(pattern.slice(0, -1)) : pattern === cleanPin);

    const isCodAvailable = shippingSettings.cod.isEnabled && !isCodRestricted;

    const dates = computeDeliveryDates(matchedProfile.deliveryTimeline || '3 - 5 Business Days');
    const locationStr = detectedCity ? `${detectedCity}, ${detectedState}` : detectedState ? detectedState : `PIN ${cleanPin}`;

    setPincodeResult(null);
    setTransitEstimate({
      profileName: matchedProfile.name,
      courierNotes: matchedProfile.courierNotes,
      timelineText: matchedProfile.deliveryTimeline || '3 - 5 Business Days',
      estimatedDateRange: dates,
      locationName: locationStr,
      shippingChargeText,
      isCodAvailable,
      codFee: shippingSettings.cod.handlingCharge || 0,
      isFreeShipping,
    });
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingPincode(true);
    evaluatePincode(pincode);
    setIsCheckingPincode(false);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewName && newReviewComment) {
      const newRev = {
        id: `rev-${Date.now()}`,
        product_id: product.id,
        user_name: newReviewName,
        user_location: 'Verified Collector',
        rating: newReviewRating,
        comment: newReviewComment,
        date: new Date().toLocaleDateString(),
        verified_purchase: true,
      };

      await supabase.from('reviews').insert([newRev]);

      setReviews([{
        id: newRev.id,
        productId: newRev.product_id,
        userName: newRev.user_name,
        userLocation: newRev.user_location,
        rating: newRev.rating,
        comment: newRev.comment,
        date: newRev.date,
        verifiedPurchase: newRev.verified_purchase,
      }, ...reviews]);
      setReviewSubmitted(true);
      setNewReviewName('');
      setNewReviewComment('');
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedTimber);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-12 animate-fadeIn font-body-md">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c1b1b] text-white px-6 py-4 rounded-xs shadow-2xl flex items-center gap-3 border border-[#fed65b] font-label-caps text-xs uppercase animate-bounce">
          <span className="material-symbols-outlined text-[#fed65b]">check_circle</span>
          <span>Added {product.name} to Reserve Basket!</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-label-caps uppercase tracking-wider text-[#747878] flex items-center gap-2">
        <button onClick={() => setActiveTab('home')} className="hover:text-black cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button onClick={() => setActiveTab('shop')} className="hover:text-black cursor-pointer">
          {product.category}
        </button>
        <span>/</span>
        <span className="text-[#1b1c1c] font-bold">{product.name}</span>
      </nav>

      {/* Main Product Layout Grid - Screen 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column - Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-xs border border-[#c4c7c7]/40 bg-white shadow-xl group">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-[400px] sm:h-[500px] lg:h-[580px] object-contain bg-[#fbf9f8] object-center group-hover:scale-105 transition-transform duration-700"
            />

            {/* Top Floating Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-2.5 rounded-full shadow-md transition-colors ${
                  isWishlisted ? 'bg-[#ba1a1a] text-white' : 'bg-white/90 text-[#1b1c1c] hover:bg-white'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              >
                <span
                  className="material-symbols-outlined text-lg block"
                  style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Product link copied to clipboard!');
                }}
                className="p-2.5 bg-white/90 text-[#1b1c1c] hover:bg-white rounded-full shadow-md cursor-pointer"
                title="Share product link"
              >
                <span className="material-symbols-outlined text-lg block">share</span>
              </button>
            </div>

            {/* Artistry Badge */}
            <div className="absolute bottom-4 left-4 bg-[#1c1b1b]/80 backdrop-blur-xs text-white px-3 py-1 text-[11px] font-label-caps uppercase tracking-wider rounded-xs border border-white/20">
              ✨ 100% Hand-Carved Monolith
            </div>
          </div>

          {/* Thumbnails */}
          {product.galleryImages && product.galleryImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xs overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                    selectedImage === img
                      ? 'border-[#1c1b1b] scale-105 shadow-md'
                      : 'border-[#c4c7c7]/40 hover:border-[#1c1b1b]/50'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details & Options */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block mb-1">
              Irisjev Wooden Crafts Heritage
            </span>
            <h1 className="font-display-lg text-3xl sm:text-4xl font-bold text-[#1b1c1c] italic leading-tight">
              {product.name}
            </h1>
            <p className="text-xs font-label-caps uppercase text-[#747878] mt-1">
              Ref: #SWARNA-{product.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Price & Rating */}
          <div className="flex justify-between items-center py-4 border-y border-[#c4c7c7]/40">
            <div>
              <span className="font-headline-md text-3xl font-bold text-[#000000]">
                {formatPrice(product.priceINR, currency)}
              </span>
              <span className="block text-xs font-label-caps text-[#735c00] mt-0.5">
                Includes All Taxes & White-Glove Transit Insurance
              </span>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-[#735c00]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
                <span className="text-xs font-bold text-[#1b1c1c] ml-1">{product.rating}</span>
              </div>
              <span className="text-[11px] font-label-caps text-[#444748] uppercase">
                ({reviews.length} Collector Reviews)
              </span>
            </div>
          </div>

          {/* Short Story */}
          <p className="font-body-lg text-[#444748] leading-relaxed">
            {product.description}
          </p>

          {/* Timber Selection Dropdown / Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-label-caps uppercase text-[#1b1c1c] font-bold">
              Select Timber Finish
            </label>
            <div className="flex flex-wrap gap-2">
              {product.timberOptions.map((timber) => (
                <button
                  key={timber}
                  onClick={() => setSelectedTimber(timber)}
                  className={`px-3.5 py-2 text-xs font-label-caps uppercase rounded-xs border cursor-pointer transition-colors ${
                    selectedTimber === timber
                      ? 'bg-[#1c1b1b] text-white border-[#1c1b1b] font-bold'
                      : 'bg-white text-[#444748] border-[#c4c7c7] hover:border-[#1b1c1c]'
                  }`}
                >
                  {timber}
                </button>
              ))}
            </div>
          </div>

          {/* Specifications Bento Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#f5f3f3] p-4 rounded-xs border border-[#e4e2e2] text-xs">
            <div>
              <span className="text-[#747878] font-label-caps uppercase block text-[10px]">
                Dimensions
              </span>
              <strong className="text-[#1b1c1c]">{product.dimensions}</strong>
            </div>
            <div>
              <span className="text-[#747878] font-label-caps uppercase block text-[10px]">
                Material & Wood
              </span>
              <strong className="text-[#1b1c1c]">{selectedTimber}</strong>
            </div>
            <div>
              <span className="text-[#747878] font-label-caps uppercase block text-[10px]">
                Carving Style
              </span>
              <strong className="text-[#1b1c1c]">{product.style}</strong>
            </div>
            <div>
              <span className="text-[#747878] font-label-caps uppercase block text-[10px]">
                Authenticity
              </span>
              <strong className="text-[#735c00]">{product.authenticity}</strong>
            </div>
          </div>

          {/* Delivery Pincode Estimator */}
          <div className="bg-white p-4 rounded-xs border border-[#c4c7c7] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-label-caps uppercase text-[#1b1c1c] font-bold">
                Check Transit Lead Time
              </label>
              <span className="text-[10px] font-label-caps uppercase text-[#735c00] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">local_shipping</span>
                Live Carrier Status
              </span>
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPincode(val);
                  if (val.length === 6) {
                    evaluatePincode(val);
                  } else if (val.length === 0) {
                    setTransitEstimate(null);
                    setPincodeResult(null);
                  }
                }}
                placeholder="Enter 6-Digit PIN Code (e.g. 560001)..."
                className="flex-1 px-3 py-2 border border-[#c4c7c7] rounded-xs text-xs focus:outline-none focus:border-[#1c1b1b]"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-wider cursor-pointer hover:bg-black transition-colors font-bold shrink-0"
              >
                {isCheckingPincode ? 'Checking...' : 'Check'}
              </button>
            </form>

            {/* Error or validation info message */}
            {pincodeResult && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {pincodeResult}
              </p>
            )}

            {/* Dynamic Transit Estimation Card */}
            {transitEstimate && (
              <div className="p-3.5 bg-[#fbfaf8] border border-[#e5e1d8] rounded-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-2 border-b border-[#e4e2e2] pb-2">
                  <div>
                    <span className="text-[10px] font-label-caps uppercase text-[#747878] block">Estimated Delivery</span>
                    <strong className="text-sm font-headline-md text-[#1b1c1c] block">
                      {transitEstimate.estimatedDateRange}
                    </strong>
                  </div>
                  <span className="text-[10px] font-bold text-[#2e6930] bg-[#eaf5eb] border border-[#c3e6c6] px-2 py-0.5 rounded-xs shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">bolt</span>
                    {transitEstimate.timelineText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#747878] uppercase font-label-caps block">Delivery Zone</span>
                    <span className="font-semibold text-[#1b1c1c] block truncate" title={transitEstimate.locationName}>
                      📍 {transitEstimate.locationName}
                    </span>
                    <span className="text-[10px] text-[#735c00] block">
                      {transitEstimate.profileName}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#747878] uppercase font-label-caps block">Shipping & Insurance</span>
                    <span className="font-bold text-[#2e6930] block">
                      {transitEstimate.shippingChargeText}
                    </span>
                    <span className="text-[10px] text-[#444748] block">
                      {transitEstimate.isCodAvailable 
                        ? `✓ COD Available ${transitEstimate.codFee > 0 ? `(₹${transitEstimate.codFee} fee)` : ''}`
                        : '✕ Prepaid Orders Only'}
                    </span>
                  </div>
                </div>

                {transitEstimate.courierNotes && (
                  <p className="text-[11px] text-[#555] bg-white p-2 rounded-xs border border-[#eee] italic">
                    🚚 {transitEstimate.courierNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAddToCartClick}
              className="w-full py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">shopping_bag</span>
              <span>Reserve & Add to Basket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Tabs - Screen 4 Specification Details */}
      <section className="border-t border-[#c4c7c7]/40 pt-12 space-y-4">
        <h3 className="font-display-lg text-2xl font-bold text-[#1b1c1c] italic">
          Craftsmanship & Heritage Details
        </h3>

        <div className="space-y-3">
          {/* Heritage & Process */}
          <div className="border border-[#e4e2e2] rounded-xs bg-white overflow-hidden">
            <button
              onClick={() =>
                setActiveAccordion(activeAccordion === 'heritage' ? null : 'heritage')
              }
              className="w-full p-4 flex justify-between items-center text-left font-headline-md font-bold text-base text-[#1b1c1c] hover:bg-[#f5f3f3] cursor-pointer"
            >
              <span>Heritage & Hand Carving Process</span>
              <span className="material-symbols-outlined">
                {activeAccordion === 'heritage' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {activeAccordion === 'heritage' && (
              <div className="p-6 border-t border-[#e4e2e2] text-sm text-[#444748] space-y-3 font-body-md">
                <p>
                  Every piece begins with seasoned wood hand-selected by master carvers. Using traditional chisel sets (*Uli*), the artisan sketches divine proportions following ancient Vastu Shastra text guidelines.
                </p>
                <p>
                  The sculpture is polished using natural beeswax and coconut oils—never harsh chemical lacquers—ensuring the organic timber aroma and rich grain variation remain pristine for generations.
                </p>
              </div>
            )}
          </div>

          {/* Transit & White Glove Shipping */}
          <div className="border border-[#e4e2e2] rounded-xs bg-white overflow-hidden">
            <button
              onClick={() =>
                setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')
              }
              className="w-full p-4 flex justify-between items-center text-left font-headline-md font-bold text-base text-[#1b1c1c] hover:bg-[#f5f3f3] cursor-pointer"
            >
              <span>Insured Transit & White-Glove Shipping</span>
              <span className="material-symbols-outlined">
                {activeAccordion === 'shipping' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {activeAccordion === 'shipping' && (
              <div className="p-6 border-t border-[#e4e2e2] text-sm text-[#444748] space-y-3 font-body-md">
                <p>
                  Each wooden sculpture is vacuum sealed, shock-padded, and packed inside a reinforced timber transit crate to guarantee zero damage during domestic or international air freight.
                </p>
                <p>
                  Complete insurance is provided from our craft workshop in Karnataka directly to your doorstep.
                </p>
              </div>
            )}
          </div>

          {/* Care & Maintenance */}
          <div className="border border-[#e4e2e2] rounded-xs bg-white overflow-hidden">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'care' ? null : 'care')}
              className="w-full p-4 flex justify-between items-center text-left font-headline-md font-bold text-base text-[#1b1c1c] hover:bg-[#f5f3f3] cursor-pointer"
            >
              <span>Care & Maintenance Instructions</span>
              <span className="material-symbols-outlined">
                {activeAccordion === 'care' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {activeAccordion === 'care' && (
              <div className="p-6 border-t border-[#e4e2e2] text-sm text-[#444748] space-y-3 font-body-md">
                <p>
                  Dust gently with a clean dry micro-fiber cloth. Keep away from direct excessive water submersion. Re-apply organic beeswax polish once a year to preserve natural rosewood sheen.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Collector Reviews Section */}
      <section className="border-t border-[#c4c7c7]/40 pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block mb-1">
              Collector Testimonials
            </span>
            <h3 className="font-display-lg text-2xl font-bold text-[#1b1c1c] italic">
              Verified Reviews ({reviews.length})
            </h3>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 rounded-xs border border-[#e4e2e2] space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#1b1c1c] text-sm">{rev.userName}</h4>
                  <span className="text-[11px] text-[#747878] font-label-caps uppercase">
                    {rev.userLocation} • {rev.date}
                  </span>
                </div>
                <div className="flex text-[#735c00]">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#444748] italic leading-relaxed">
                &quot;{rev.comment}&quot;
              </p>

              {rev.verifiedPurchase && (
                <span className="inline-block text-[10px] font-label-caps uppercase text-[#735c00] font-bold bg-[#fed65b]/20 px-2 py-0.5 rounded-xs">
                  ✓ Verified Heritage Collector
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Write a review form */}
        <div className="bg-white p-6 rounded-xs border border-[#c4c7c7] max-w-xl space-y-4">
          <h4 className="font-headline-md font-bold text-lg text-[#1b1c1c]">
            Write a Collector Review
          </h4>

          {reviewSubmitted ? (
            <div className="bg-[#f5f3f3] p-4 text-xs font-label-caps text-[#735c00] font-bold rounded-xs">
              ✨ Thank you for reviewing this masterwork! Your testimonial has been posted.
            </div>
          ) : (
            <form onSubmit={handleAddReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Ramesh K."
                  className="w-full p-2 border border-[#c4c7c7] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Rating
                </label>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className="p-2 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                >
                  <option value={5}>5 Stars - Outstanding Artistry</option>
                  <option value={4}>4 Stars - Excellent</option>
                  <option value={3}>3 Stars - Good</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1 font-bold">
                  Review & Comments
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Describe your experience with the wood carving quality and packaging..."
                  className="w-full p-2 border border-[#c4c7c7] rounded-xs"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest cursor-pointer hover:opacity-90"
              >
                Submit Review
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
