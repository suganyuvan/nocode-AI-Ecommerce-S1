import React, { useState } from 'react';
import { Product, CartItem, Currency, ActiveTab, BespokeInquiry } from './types';
import { PRODUCTS } from './data/products';
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

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['ganesha-sculpture-01']);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [inquiries, setInquiries] = useState<BespokeInquiry[]>([]);

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

        {activeTab === 'product-detail' && (
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
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        currency={currency}
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

export default App;
