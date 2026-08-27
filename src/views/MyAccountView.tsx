import React, { useState, useEffect } from 'react';
import { Customer, Order, Currency, ActiveTab, CartItem, Product } from '../types';
import { supabase } from '../utils/supabaseClient';
import { formatPrice } from '../utils/currency';
import { InvoiceModal } from '../components/InvoiceModal';

interface MyAccountViewProps {
  customer: Customer | null;
  currency: Currency;
  cartItems: CartItem[];
  wishlist: Product[];
  products: Product[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const MyAccountView: React.FC<MyAccountViewProps> = ({
  customer,
  currency,
  cartItems,
  wishlist,
  products,
  setActiveTab,
  onOpenAuthModal,
  onLogout,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'address' | 'overview'>('orders');

  // Address edit state
  const [savedAddress, setSavedAddress] = useState(customer?.address || '');
  const [savedCity, setSavedCity] = useState(customer?.city || '');
  const [savedState, setSavedState] = useState(customer?.state || 'Karnataka');
  const [savedPin, setSavedPin] = useState(customer?.postal_code || '');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState(false);

  // Fetch customer orders from Supabase
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!customer) {
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      try {
        // Query by customer_id or phone
        let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

        if (customer.id) {
          query = query.or(`customer_id.eq.${customer.id},payment_info.ilike.%${customer.phone || ''}%`);
        }

        const { data, error } = await query;
        if (data) {
          setOrders(data);
        }
      } catch (err) {
        console.warn('Orders fetch error:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchCustomerOrders();
  }, [customer]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsSavingAddress(true);
    try {
      if (customer.id) {
        await supabase
          .from('customers')
          .update({
            address: savedAddress,
            city: savedCity,
            state: savedState,
            postal_code: savedPin,
          })
          .eq('id', customer.id);
      }

      // Update localStorage
      const updatedCust = {
        ...customer,
        address: savedAddress,
        city: savedCity,
        state: savedState,
        postal_code: savedPin,
      };
      localStorage.setItem('irisjev_customer_user', JSON.stringify(updatedCust));
      setAddressSuccess(true);
      setTimeout(() => setAddressSuccess(false), 3000);
    } catch (err) {
      console.warn('Address update error:', err);
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="bg-white p-10 border border-[#e4e2e2] shadow-sm rounded-xs max-w-md mx-auto space-y-5">
          <span className="material-symbols-outlined text-5xl text-[#735c00]">account_circle</span>
          <h2 className="font-display-lg text-2xl text-[#1b1c1c] italic">Collector Portal Sign-In</h2>
          <p className="text-xs text-[#444748]">
            Sign in with your mobile number to view and track your past orders, access tax invoices, and manage your delivery details.
          </p>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-black transition-colors rounded-xs font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">sms</span>
            Sign In with Mobile OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn font-body-md">
      {/* Profile Header Banner */}
      <div className="bg-[#1c1b1b] text-white p-6 sm:p-8 rounded-xs border border-[#fed65b]/20 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#fed65b]/20 border-2 border-[#fed65b] flex items-center justify-center text-2xl font-bold font-display text-[#fed65b]">
            {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display-lg text-2xl sm:text-3xl text-white italic">{customer.full_name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#fed65b]/20 text-[#fed65b] px-2 py-0.5 rounded-full border border-[#fed65b]/30">
                Verified Collector
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {customer.phone && <span>📞 {customer.phone}</span>}
              {customer.email && <span>✉️ {customer.email}</span>}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setActiveTab('shop')}
            className="px-4 py-2 bg-white text-[#1c1b1b] text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs hover:bg-[#fed65b] transition-colors cursor-pointer"
          >
            Browse Sculptures
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white/10 text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xs hover:bg-red-600 transition-colors border border-white/20 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Navigation Tabs */}
      <div className="flex border-b border-[#e4e2e2] gap-8">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'orders'
              ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
              : 'text-[#747878] hover:text-[#1c1b1b]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">local_shipping</span>
          My Orders & Invoices ({orders.length})
        </button>
        <button
          onClick={() => setActiveSubTab('address')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'address'
              ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
              : 'text-[#747878] hover:text-[#1c1b1b]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">home_pin</span>
          Saved Delivery Address
        </button>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-xs font-label-caps uppercase tracking-wider font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'text-[#1c1b1b] border-b-2 border-[#1c1b1b]'
              : 'text-[#747878] hover:text-[#1c1b1b]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Cart & Wishlist Overview
        </button>
      </div>

      {/* Orders Tab */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          {isLoadingOrders ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-8 h-8 border-2 border-[#1c1b1b] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#747878] font-label-caps uppercase">Loading Your Order History...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 text-center border border-[#e4e2e2] rounded-xs space-y-4">
              <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">inventory_2</span>
              <h3 className="font-display-lg text-xl text-[#1b1c1c] italic">No Orders Placed Yet</h3>
              <p className="text-xs text-[#747878] max-w-sm mx-auto">
                Any orders you complete will appear right here with instant live tracking and downloadable tax invoices.
              </p>
              <button
                onClick={() => setActiveTab('shop')}
                className="px-6 py-3 bg-[#1c1b1b] text-white text-xs font-label-caps uppercase tracking-widest font-bold rounded-xs hover:bg-black transition-colors cursor-pointer"
              >
                Explore Curated Heritage Collection
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const isPaid = order.payment_status === 'paid' || order.status === 'confirmed';
                const isCOD = order.payment_method === 'cod' || order.payment_info === 'Cash on Delivery';

                return (
                  <div key={order.id} className="bg-white border border-[#e4e2e2] rounded-xs overflow-hidden shadow-2xs">
                    {/* Order Top Bar */}
                    <div className="p-4 sm:p-5 bg-[#faf9f8] border-b border-[#e4e2e2] flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#1b1c1c]">
                            {order.order_number || `#SWARNA-${order.id?.slice(0, 8)?.toUpperCase()}`}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isPaid ? 'Payment Confirmed' : isCOD ? 'Cash on Delivery (Pending)' : 'Processing'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#747878] block mt-0.5">
                          Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-label-caps text-[#747878] block">Total Amount</span>
                          <span className="font-headline-md text-base font-bold text-[#1b1c1c]">
                            {formatPrice(order.total_amount || 0, currency)}
                          </span>
                        </div>

                        {/* View Invoice Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceOrder({
                              items: (order.order_items || []).map((i: any) => {
                                const matchedProd = products.find(p => p.id === i.product_id || p.name === i.product_name || i.product_name?.includes(p.name));
                                return {
                                  product: {
                                    id: i.product_id,
                                    name: i.product_name,
                                    priceINR: i.unit_price,
                                    priceUSD: i.unit_price / 83,
                                    image: matchedProd?.image || '',
                                    galleryImages: matchedProd?.galleryImages || [],
                                    description: matchedProd?.description || '',
                                    dimensions: matchedProd?.dimensions || '',
                                    material: i.selected_timber || 'Wood',
                                    style: matchedProd?.style || '',
                                    authenticity: 'Certified',
                                    timberOptions: [],
                                    rating: 5,
                                    reviewCount: 1,
                                  },
                                  quantity: i.quantity,
                                  selectedTimber: i.selected_timber || 'Classic Teak',
                                };
                              }),
                              customerName: customer.full_name,
                              address: typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address?.address || customer.address || ''}, ${order.shipping_address?.city || customer.city || ''}`,
                              subtotal: order.subtotal || order.total_amount,
                              discountAmount: order.discount_amount || 0,
                              shipping: order.shipping_charge || 0,
                              gstAmount: order.gst_amount || 0,
                              gstRate: order.gst_rate || 3,
                              total: order.total_amount,
                              invoiceNumber: `INV-${order.order_number?.replace(/\D/g, '') || '88392'}`,
                              razorpayPaymentId: order.razorpay_payment_id || order.payment_info || 'COD-VERIFIED',
                              paymentMethod: order.payment_method || (isCOD ? 'cod' : 'prepaid'),
                              codHandlingFee: isCOD ? 150 : 0,
                            });
                          }}
                          className="px-3 py-1.5 bg-white border border-[#c4c7c7] text-[#1c1b1b] text-xs font-label-caps uppercase font-bold rounded-xs hover:bg-[#1c1b1b] hover:text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-sm">receipt_long</span>
                          Tax Invoice
                        </button>
                      </div>
                    </div>

                    {/* Ordered Items Preview */}
                    <div className="p-4 sm:p-5 divide-y divide-[#f0efee]">
                      {(order.order_items || []).map((item: any, idx: number) => {
                        const matchedProd = products.find(p => p.id === item.product_id || p.name === item.product_name || item.product_name?.includes(p.name));
                        const isFreeGift = item.unit_price === 0 || item.product_name?.toLowerCase().includes('gift') || item.product_name?.toLowerCase().includes('free');

                        return (
                          <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {/* Product Thumbnail */}
                              <div className="w-14 h-14 bg-[#f5f3f3] border border-[#e4e2e2] rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                                {matchedProd?.image ? (
                                  <img src={matchedProd.image} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-2xl text-[#735c00]">category</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-[#1b1c1c]">{item.product_name}</h4>
                                  {isFreeGift && (
                                    <span className="text-[10px] bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/40 font-bold px-1.5 py-0.2 rounded-xs uppercase">
                                      Free Gift
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[#747878] block mt-0.5">
                                  Timber Finish: <strong className="text-[#1b1c1c]">{item.selected_timber || 'Heritage Teak'}</strong> • Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="font-headline-md text-sm font-bold text-[#1b1c1c] shrink-0">
                              {isFreeGift ? '₹0' : formatPrice(item.unit_price * item.quantity, currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Courier Status Footnote */}
                    <div className="px-4 py-2.5 bg-[#fbfaf8] border-t border-[#e4e2e2] flex items-center justify-between text-xs text-[#747878]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-[#2e6930]">verified</span>
                        Transit: Handled via BlueDart / Delhivery Air Cargo
                      </span>
                      <span className="font-medium text-[#1c1b1b]">
                        Destination: {typeof order.shipping_address === 'string' ? order.shipping_address : `${order.shipping_address?.city || customer.city || ''}, ${order.shipping_address?.state || customer.state || ''}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Saved Address Tab */}
      {activeSubTab === 'address' && (
        <div className="bg-white p-6 sm:p-8 border border-[#e4e2e2] rounded-xs max-w-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[#e4e2e2] pb-3">
            <span className="material-symbols-outlined text-[#735c00]">home_pin</span>
            <h3 className="font-headline-md font-bold text-base text-[#1b1c1c]">Primary Delivery Address</h3>
          </div>

          {addressSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
              <span>Address saved successfully! It will automatically autofill at checkout.</span>
            </div>
          )}

          <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase font-label-caps text-[#444748] mb-1">
                Street Address / Landmark
              </label>
              <textarea
                rows={2}
                value={savedAddress}
                onChange={(e) => setSavedAddress(e.target.value)}
                placeholder="House/Apartment #, Road, Colony..."
                className="w-full p-3 border border-[#c4c7c7] rounded-xs text-sm focus:outline-none focus:border-[#1c1b1b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block uppercase font-label-caps text-[#444748] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={savedCity}
                  onChange={(e) => setSavedCity(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full p-3 border border-[#c4c7c7] rounded-xs text-sm focus:outline-none focus:border-[#1c1b1b]"
                />
              </div>

              <div>
                <label className="block uppercase font-label-caps text-[#444748] mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={savedState}
                  onChange={(e) => setSavedState(e.target.value)}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full p-3 border border-[#c4c7c7] rounded-xs text-sm focus:outline-none focus:border-[#1c1b1b]"
                />
              </div>

              <div>
                <label className="block uppercase font-label-caps text-[#444748] mb-1">
                  6-Digit PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={savedPin}
                  onChange={(e) => setSavedPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="600024"
                  className="w-full p-3 border border-[#c4c7c7] rounded-xs text-sm focus:outline-none focus:border-[#1c1b1b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingAddress}
              className="px-6 py-3 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-wider font-bold rounded-xs hover:bg-black transition-colors cursor-pointer"
            >
              {isSavingAddress ? 'Saving Address...' : 'Update Default Address'}
            </button>
          </form>
        </div>
      )}

      {/* Cart & Wishlist Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Cart */}
          <div className="bg-white p-6 border border-[#e4e2e2] rounded-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e4e2e2] pb-3">
              <h3 className="font-headline-md font-bold text-base text-[#1b1c1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                Current Cart Items ({cartItems.length})
              </h3>
              <button
                onClick={() => setActiveTab('checkout')}
                className="text-xs text-[#735c00] font-bold hover:underline cursor-pointer"
              >
                Proceed to Checkout →
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-xs text-[#747878] py-4">Your cart is currently empty.</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-[#f5f3f3] last:border-0">
                    <div>
                      <span className="font-bold text-[#1b1c1c] block">{item.product.name}</span>
                      <span className="text-[#747878]">{item.selectedTimber} • Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold">{formatPrice(item.product.priceINR * item.quantity, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <div className="bg-white p-6 border border-[#e4e2e2] rounded-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e4e2e2] pb-3">
              <h3 className="font-headline-md font-bold text-base text-[#1b1c1c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">favorite</span>
                Saved Wishlist ({wishlist.length})
              </h3>
              <button
                onClick={() => setActiveTab('shop')}
                className="text-xs text-[#735c00] font-bold hover:underline cursor-pointer"
              >
                Browse Shop →
              </button>
            </div>

            {wishlist.length === 0 ? (
              <p className="text-xs text-[#747878] py-4">No items saved to your wishlist.</p>
            ) : (
              <div className="space-y-3">
                {wishlist.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-[#f5f3f3] last:border-0">
                    <span className="font-bold text-[#1b1c1c]">{prod.name}</span>
                    <span className="font-bold">{formatPrice(prod.priceINR, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          cartItems={selectedInvoiceOrder.items}
          customerName={selectedInvoiceOrder.customerName}
          address={selectedInvoiceOrder.address}
          currency={currency}
          subtotal={selectedInvoiceOrder.subtotal}
          discountAmount={selectedInvoiceOrder.discountAmount}
          shipping={selectedInvoiceOrder.shipping}
          gstAmount={selectedInvoiceOrder.gstAmount}
          gstRate={selectedInvoiceOrder.gstRate}
          total={selectedInvoiceOrder.total}
          invoiceNumber={selectedInvoiceOrder.invoiceNumber}
          razorpayPaymentId={selectedInvoiceOrder.razorpayPaymentId}
          paymentMethod={selectedInvoiceOrder.paymentMethod}
          codHandlingFee={selectedInvoiceOrder.codHandlingFee}
        />
      )}
    </div>
  );
};
