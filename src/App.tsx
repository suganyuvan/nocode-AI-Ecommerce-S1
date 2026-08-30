import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

import { trackPageViewEvent, trackCartAdd } from './utils/pageViewAnalyticsEngine';

export function Storefront() {

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pageContent, setPageContent] = useState<PageContent[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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


  // Trigger Welcome Promo / OTP signup on first visit if not logged in
  useEffect(() => {
    const hasSeen = localStorage.getItem('irisjev_promo_seen');
    if (!hasSeen && !customer) {
      const timer = setTimeout(() => {
        setAuthModalMode('promo');
        setIsAuthModalOpen(true);
      }, 1500);
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

  useEffect(() => {
    trackPageViewEvent(activeTab);
  }, [activeTab]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['ganesha-sculpture-01']);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [inquiries, setInquiries] = useState<BespokeInquiry[]>([]);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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

      // If no regular products remain, clear any free gifts too
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
      // If no regular products remain, clear any free gifts too
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
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Bespoke Inquiry submit
  const handleBespokeInquirySubmit = (inquiry: BespokeInquiry) => {
    setInquiries((prev) => [inquiry, ...prev]);
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


      {/* Main Screen Views */}
      <main className="flex-1 pb-20 md:pb-0">
        {activeTab === 'home' && (
          <HomeView
            setActiveTab={setActiveTab}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
            currency={currency}
            products={products}
            pageContent={pageContent}
          />
        )}

        {activeTab === 'shop' && (
          <ShopView
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            currency={currency}
          />
        )}

        {activeTab === 'product-detail' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={wishlistIds.includes(selectedProduct.id)}
            currency={currency}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'temple-projects' && (
          <TempleProjectsView
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'about' && (
          <AboutView
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'wholesale-export' && <WholesaleExportView />}

        {activeTab === 'care-guide' && <CareGuideView />}

        {activeTab === 'account' && (
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
            onLoginSuccess={(c) => {
              setCustomer(c);
            }}
            onLogout={async () => {
              localStorage.removeItem('irisjev_customer_user');
              sessionStorage.removeItem('irisjev_saved_delivery_info');
              localStorage.removeItem('irisjev_saved_delivery_info');
              try {
                await supabase.auth.signOut();
              } catch (e) {}
              setCustomer(null);
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutView 
            cartItems={cartItems}
            currency={currency}
            customer={customer}
            onClearCart={() => setCartItems([])}
            setActiveTab={setActiveTab}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
          />
        )}

        {activeTab === 'terms' && <TermsView />}
        {activeTab === 'privacy' && <PrivacyView />}
        {activeTab === 'refund' && <RefundView />}
        {activeTab === 'shipping' && <ShippingView />}
        {activeTab === 'contact' && <ContactView />}
        {activeTab === 'track' && <TrackOrderView />}
      </main>


      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
      />

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
          setActiveTab('checkout');
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
        onTrackOrder={(query) => {
          setIsAuthModalOpen(false);
          setActiveTab('track');
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
