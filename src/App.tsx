import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { AdminApp } from './admin/AdminApp';
import { Product, CartItem, Currency, ActiveTab, BespokeInquiry, PageContent, StoreSettings, Customer } from './types';
import { supabase } from './utils/supabaseClient';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { BespokeOrderModal } from './components/BespokeOrderModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { TrackOrderModal } from './components/TrackOrderModal';
import { SeoHead } from './components/SeoHead';

import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { TempleProjectsView } from './views/TempleProjectsView';
import { AboutView } from './views/AboutView';
import { WholesaleExportView } from './views/WholesaleExportView';
import { CareGuideView } from './views/CareGuideView';
import { CheckoutView } from './views/CheckoutView';
import { MyAccountView } from './views/MyAccountView';
import { TermsView } from './views/TermsView';
import { PrivacyView } from './views/PrivacyView';
import { RefundView } from './views/RefundView';
import { ShippingView } from './views/ShippingView';
import { ContactView } from './views/ContactView';
import { TrackOrderView } from './views/TrackOrderView';
import { DynamicPageView } from './views/DynamicPageView';
import { trackPageViewEvent, trackCartAdd } from './utils/pageViewAnalyticsEngine';
import { sendContactInquiryEmail, sendWelcomeDiscountEmail } from './utils/resendEmailEngine';
import { sendBespokeInquiryWhatsApp } from './utils/whatsappCloudApiEngine';
import { dispatchWebhookEvent } from './utils/webhookDispatcher';

const TAB_TO_PATH: Record<string, string> = {
  home: '/',
  shop: '/shop',
  'product-detail': '/shop',
  'temple-projects': '/pages/temple-projects',
  about: '/pages/about-us',
  'wholesale-export': '/pages/wholesale-export',
  'care-guide': '/pages/care-guide',
  checkout: '/checkout',
  account: '/account',
  terms: '/pages/terms-and-conditions',
  privacy: '/pages/privacy-policy',
  refund: '/pages/refund-policy',
  shipping: '/pages/shipping-policy',
  contact: '/contact',
  track: '/track',
};

function ProductDetailRouteWrapper({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  currency,
  setActiveTab
}: {
  products: Product[];
  onAddToCart: (product: Product, timber?: string) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  currency: Currency;
  setActiveTab: (tab: ActiveTab) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id) || products[0];

  if (!product) {
    return (
      <div className="max-w-[800px] mx-auto py-20 text-center space-y-4">
        <h2 className="font-display-lg text-2xl font-bold">Sculpture Masterpiece Not Found</h2>
        <button
          onClick={() => navigate('/shop')}
          className="bg-[#1c1b1b] text-white px-6 py-2.5 text-xs font-label-caps uppercase tracking-widest font-bold"
        >
          Return to Shop Collection
        </button>
      </div>
    );
  }

  return (
    <ProductDetailView
      product={product}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      isWishlisted={wishlistIds.includes(product.id)}
      currency={currency}
      setActiveTab={setActiveTab}
    />
  );
}

export function Storefront() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTabState] = useState<ActiveTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pageContent, setPageContent] = useState<PageContent[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (TAB_TO_PATH[tab]) {
      navigate(TAB_TO_PATH[tab]);
    }
  };

  // Customer Account & Auth States
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const stored = localStorage.getItem('irisjev_customer_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Clean up if an admin account was previously cached in customer storage
      if (parsed?.email === 'admin@irisjev.com' || parsed?.email?.startsWith('admin@')) {
        localStorage.removeItem('irisjev_customer_user');
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'promo' | 'login'>('login');
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Trigger Welcome 10% OFF Promo Register Modal whenever visiting without login data
  useEffect(() => {
    if (!customer) {
      const timer = setTimeout(() => {
        setAuthModalMode('promo');
        setIsAuthModalOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [customer]);

  // Listen for Supabase OAuth sign-in callback (e.g. Google Auth for Customers)
  useEffect(() => {
    const handleAuthSession = async (session: any) => {
      if (!session?.user?.email) return;
      const user = session.user;
      const userEmail = user.email.toLowerCase().trim();

      // Completely ignore admin emails in customer storefront
      if (userEmail === 'admin@irisjev.com' || userEmail.startsWith('admin@')) {
        return;
      }

      const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0] || 'Collector';
      const userPhone = user.user_metadata?.phone || '';

      try {
        // Find or create customer record in Supabase
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (existingCustomer) {
          setCustomer(existingCustomer);
          localStorage.setItem('irisjev_customer_user', JSON.stringify(existingCustomer));
        } else {
          const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(user.id || '');
          const newCustRecord: any = {
            email: userEmail,
            full_name: userName,
            phone: userPhone,
            city: '',
            state: '',
            postal_code: '',
            address: '',
            country_code: '+91',
          };
          if (isUuid) {
            newCustRecord.id = user.id;
          }

          const { data: created, error } = await supabase
            .from('customers')
            .insert([newCustRecord])
            .select()
            .maybeSingle();

          const finalCust = (!error && created) ? created : { id: user.id || `cust-${Date.now()}`, ...newCustRecord };
          setCustomer(finalCust);
          localStorage.setItem('irisjev_customer_user', JSON.stringify(finalCust));

          // Send luxury Welcome 10% OFF voucher email via Resend
          if (userEmail && !userEmail.startsWith('admin@')) {
            sendWelcomeDiscountEmail({
              customerName: userName || 'Valued Collector',
              customerEmail: userEmail,
              couponCode: 'WELCOME10'
            }).catch(e => console.warn('OAuth welcome email notice:', e));
          }
        }
      } catch (err) {
        console.warn('OAuth customer sync error:', err);
      }
    };

    // 1. Check current active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleAuthSession(session);
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleAuthSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) {
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          priceINR: p.price_inr,
          priceUSD: p.price_usd,
          image: p.image,
          galleryImages: p.gallery_images,
          description: p.description,
          shortDescription: p.short_description,
          dimensions: p.dimensions,
          material: p.material,
          style: p.style,
          authenticity: p.authenticity,
          isNewArrival: p.is_new_arrival,
          isLimitedEdition: p.is_limited_edition,
          isBestSeller: p.is_best_seller,
          timberOptions: p.timber_options,
          weight: p.weight,
          rating: p.rating,
          reviewCount: p.review_count,
          featuredInSpotlight: p.featured_in_spotlight,
        }));
        setProducts(mapped);
        if (mapped.length > 0) {
          setSelectedProduct(mapped[0]);
        }
      }
      
      const { data: contentData } = await supabase.from('page_content').select('*');
      if (contentData) {
        setPageContent(contentData);
      }

      const { data: settingsData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (settingsData) {
        setStoreSettings(settingsData as StoreSettings);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Backwards compatibility redirect for legacy URL search parameters (?tab=... and ?id=...)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ActiveTab | null;
    const idParam = searchParams.get('id');

    if (tabParam === 'product-detail' && idParam) {
      navigate(`/product/${idParam}`, { replace: true });
    } else if (tabParam && TAB_TO_PATH[tabParam]) {
      navigate(TAB_TO_PATH[tabParam], { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    trackPageViewEvent(location.pathname);
  }, [location.pathname]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('swarna_wishlist_ids_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currency, setCurrency] = useState<Currency>('INR');
  const [inquiries, setInquiries] = useState<BespokeInquiry[]>([]);

  // Sync wishlistIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swarna_wishlist_ids_v2', JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn('Failed to persist wishlist:', e);
    }
  }, [wishlistIds]);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isBespokeOpen, setIsBespokeOpen] = useState(false);

  // Cart Handler
  const handleAddToCart = (product: Product, selectedTimber?: string, isGift: boolean = false) => {
    trackCartAdd({ id: product.id, name: product.name, category: product.category });
    const timber = selectedTimber || product.timberOptions[0] || product.material;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedTimber === timber && !!item.isGift === isGift
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1, selectedTimber: timber, isGift }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const updated = prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      const hasRegularItems = updated.some((item) => !item.isGift);
      if (!hasRegularItems) {
        return [];
      }
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      const hasRegularItems = updated.some((item) => !item.isGift);
      if (!hasRegularItems) {
        return [];
      }
      return updated;
    });
  };

  // Wishlist Handler
  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  // Select product for detail view
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTabState('product-detail');
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Bespoke Inquiry submit
  const handleBespokeInquirySubmit = (inquiry: BespokeInquiry) => {
    setInquiries((prev) => [inquiry, ...prev]);

    sendContactInquiryEmail({
      name: inquiry.customerName,
      email: inquiry.customerEmail,
      phone: inquiry.customerPhone,
      message: inquiry.details,
      inquiryType: 'Bespoke Custom Wood Commission'
    }).catch(err => console.warn('Bespoke email inquiry notice:', err));

    if (inquiry.customerPhone) {
      sendBespokeInquiryWhatsApp({
        recipientPhone: inquiry.customerPhone,
        recipientName: inquiry.customerName,
        inquiryDetails: inquiry.details,
      }).catch(err => console.warn('Bespoke WhatsApp notice:', err));
    }

    dispatchWebhookEvent('lead.created', {
      name: inquiry.customerName,
      email: inquiry.customerEmail,
      phone: inquiry.customerPhone,
      details: inquiry.details,
      type: 'bespoke_inquiry'
    });
  };

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] text-[#1b1c1c]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#fed65b] border-t-[#1c1b1b] rounded-full animate-spin mx-auto"></div>
          <p className="font-label-caps uppercase tracking-widest text-xs font-bold">Loading Masterpieces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f8] text-[#1b1c1c] selection:bg-[#1c1b1b] selection:text-white">
      {/* Dynamic SEO, OpenGraph, Geo Meta Tags & Schema Manager */}
      <SeoHead activeTab={activeTab} selectedProduct={selectedProduct} />

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBespoke={() => setIsBespokeOpen(true)}
        customer={customer}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenTrackOrder={() => setIsTrackModalOpen(true)}
      />

      {/* Main Screen Views with React Router */}
      <main className="flex-1 pb-20 md:pb-0">
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                setActiveTab={setActiveTab}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
                currency={currency}
                products={products}
                pageContent={pageContent}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopView
                products={products}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlistIds={wishlistIds}
                currency={currency}
              />
            }
          />
          <Route path="/collections" element={<Navigate to="/shop" replace />} />
          <Route
            path="/product/:id"
            element={
              <ProductDetailRouteWrapper
                products={products}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlistIds={wishlistIds}
                currency={currency}
                setActiveTab={setActiveTab}
              />
            }
          />
          <Route path="/about" element={<Navigate to="/pages/about-us" replace />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/track" element={<TrackOrderView />} />
          <Route
            path="/account"
            element={
              <MyAccountView
                customer={customer}
                currency={currency}
                cartItems={cartItems}
                wishlist={wishlistProducts}
                products={products}
                setActiveTab={setActiveTab}
                onOpenAuthModal={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                onLoginSuccess={(c) => setCustomer(c)}
                onLogout={async () => {
                  localStorage.removeItem('irisjev_customer_user');
                  sessionStorage.removeItem('irisjev_saved_delivery_info');
                  localStorage.removeItem('irisjev_saved_delivery_info');
                  localStorage.removeItem('irisjev_promo_seen');
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {}
                  setCustomer(null);
                  navigate('/');
                }}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutView
                cartItems={cartItems}
                currency={currency}
                customer={customer}
                onClearCart={() => setCartItems([])}
                setActiveTab={setActiveTab}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
              />
            }
          />
          <Route
            path="/pages/:slug"
            element={<DynamicPageView onOpenBespoke={() => setIsBespokeOpen(true)} />}
          />
          <Route
            path="*"
            element={<DynamicPageView onOpenBespoke={() => setIsBespokeOpen(true)} />}
          />
        </Routes>
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Mobile Fixed Bottom Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        customer={customer}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Modals & Drawers */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleSelectProduct}
        currency={currency}
        products={products}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        currency={currency}
        products={products}
        storeSettings={storeSettings}
        onAddToCart={handleAddToCart}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistProducts}
        onRemoveFromWishlist={(id) => setWishlistIds((prev) => prev.filter((i) => i !== id))}
        onAddToCart={handleAddToCart}
        onSelectProduct={handleSelectProduct}
        currency={currency}
      />

      <BespokeOrderModal
        isOpen={isBespokeOpen}
        onClose={() => setIsBespokeOpen(false)}
        onSubmitInquiry={handleBespokeInquirySubmit}
      />
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(c) => {
          setCustomer(c);
        }}
        onTrackOrder={() => {
          setIsAuthModalOpen(false);
          navigate('/track');
        }}
      />
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<Storefront />} />
      </Routes>
    </BrowserRouter>
  );
}
