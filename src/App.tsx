import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminApp } from './admin/AdminApp';
import { Product, CartItem, Currency, ActiveTab, BespokeInquiry, PageContent } from './types';
import { supabase } from './utils/supabaseClient';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { AdminModal } from './components/AdminModal';
import { BespokeOrderModal } from './components/BespokeOrderModal';
import { PromoPopup } from './components/PromoPopup';
import { WhatsAppButton } from './components/WhatsAppButton';

import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { TempleProjectsView } from './views/TempleProjectsView';
import { AboutView } from './views/AboutView';
import { WholesaleExportView } from './views/WholesaleExportView';
import { CareGuideView } from './views/CareGuideView';
import { CheckoutView } from './views/CheckoutView';
import { TermsView } from './views/TermsView';
import { PrivacyView } from './views/PrivacyView';
import { RefundView } from './views/RefundView';
import { ShippingView } from './views/ShippingView';
import { ContactView } from './views/ContactView';

export function Storefront() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pageContent, setPageContent] = useState<PageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      setIsLoading(false);
    };
    fetchData();
  }, []);
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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Cart Handler
  const handleAddToCart = (product: Product, selectedTimber?: string) => {
    const timber = selectedTimber || product.timberOptions[0] || product.material;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedTimber === timber
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1, selectedTimber: timber }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
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

  // Add Product (Admin)
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Delete Product (Admin)
  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
        isAdmin={isAdmin}
        setIsAdmin={(val) => {
          setIsAdmin(val);
          if (val) setIsAdminOpen(true);
        }}
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

        {activeTab === 'checkout' && (
          <CheckoutView 
            cartItems={cartItems}
            currency={currency}
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

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        currency={currency}
      />

      <BespokeOrderModal
        isOpen={isBespokeOpen}
        onClose={() => setIsBespokeOpen(false)}
        onSubmitInquiry={handleBespokeInquirySubmit}
      />
      <PromoPopup />
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
