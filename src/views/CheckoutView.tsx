import React, { useState, useEffect } from 'react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../utils/currency';
import { InvoiceModal } from '../components/InvoiceModal';
import { supabase } from '../utils/supabaseClient';
import { ActiveTab } from '../types';

interface CheckoutViewProps {
  cartItems: CartItem[];
  currency: Currency;
  onClearCart: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  currency,
  onClearCart,
  setActiveTab,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Form states for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Payment states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Shipping & GST
  const [shippingCharge, setShippingCharge] = useState(0);
  const [gstRate, setGstRate] = useState(0);

  useEffect(() => {
    setShippingCharge((Math.floor(Math.random() * 8) + 15) * 10);
    setGstRate(Math.floor(Math.random() * 3) + 3);
  }, []);

  const getCardBrand = (number: string) => {
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    return null;
  };

  const rawTotalINR = cartItems.reduce(
    (acc, item) => acc + item.product.priceINR * item.quantity,
    0
  );

  // In this preview we just assume no coupon for simplicity, or we could pass appliedDiscount.
  // We'll keep it simple: no discount applied in checkout view unless we pass it.
  const appliedDiscount = 0; 
  const discountAmountINR = (rawTotalINR * appliedDiscount) / 100;
  
  const gstAmountINR = ((rawTotalINR - discountAmountINR) * gstRate) / 100;
  const finalTotalINR = rawTotalINR - discountAmountINR + gstAmountINR + shippingCharge;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // 1. Check or Upsert Customer
      let customerId = '';
      const { data: existingCustomer, error: findErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (findErr) throw findErr;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase.from('customers').update({ phone: customerPhone, address, full_name: customerName }).eq('id', customerId);
      } else {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert([{ full_name: customerName, email: customerEmail, phone: customerPhone, address }])
          .select()
          .single();
        
        if (insertErr) throw insertErr;
        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      if (!customerId) {
        throw new Error('Failed to create or fetch customer');
      }

      // 2. Create Order
      const orderNumber = `SWARNA-${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: customerId,
          subtotal: rawTotalINR,
          discount_amount: discountAmountINR,
          total_amount: finalTotalINR,
          currency,
          payment_info: `Credit Card (${getCardBrand(cardNumber) || 'Card'}) ending in ${cardNumber.slice(-4) || 'XXXX'}`
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      if (!newOrder) throw new Error('Failed to create order');

      // 3. Create Order Items
      const orderItemsPayload = cartItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        product_name: item.product.name,
        selected_timber: item.selectedTimber,
        quantity: item.quantity,
        unit_price: item.product.priceINR
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsErr) throw itemsErr;

      onClearCart();
      
      setInvoiceData({
        items: [...cartItems],
        customerName,
        customerEmail,
        customerPhone,
        address,
        subtotal: rawTotalINR,
        discountAmount: discountAmountINR,
        shipping: shippingCharge,
        gstAmount: gstAmountINR,
        gstRate: gstRate,
        total: finalTotalINR,
        invoiceNumber: orderNumber,
      });
      setShowInvoice(true);
    } catch (err: any) {
      console.error('Order failed:', err);
      alert('Order failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvoiceClose = () => {
    setShowInvoice(false);
    // Don't route to home immediately, let the order confirmed screen render!
  };

  if (invoiceData && !showInvoice) {
    return (
      <div className="bg-[#fbf9f8] min-h-screen py-24 px-6 font-sans">
        <div className="max-w-2xl mx-auto bg-white p-12 border border-[#e4e2e2] shadow-sm text-center space-y-6">
          <span className="material-symbols-outlined text-6xl text-[#735c00]">verified</span>
          <h4 className="font-headline-md text-3xl font-bold text-[#1b1c1c]">
            Order Confirmed!
          </h4>
          <p className="font-body-md text-base text-[#444748] leading-relaxed">
            Thank you, <strong>{invoiceData.customerName || 'Valued Collector'}</strong>. Your handcrafted piece is reserved. Our concierge will contact you at <strong>{invoiceData.customerEmail || invoiceData.customerPhone}</strong> with white-glove transit details.
          </p>
          <div className="bg-[#f5f3f3] p-6 rounded-xs border border-[#c4c7c7] text-left text-sm font-label-caps space-y-2 inline-block mx-auto w-full mt-4">
            <p><strong>Order ID:</strong> #{invoiceData.invoiceNumber}</p>
            <p><strong>Craft Studio:</strong> Irisjev Wooden Crafts, Karnataka</p>
            <p><strong>Insurance:</strong> 100% Transit Insured</p>
          </div>
          <div className="pt-8">
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-10 py-4 bg-[#1c1b1b] text-white font-label-caps text-sm uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-md"
            >
              Continue Browsing Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !showInvoice) {
    return (
      <div className="py-24 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#c4c7c7]">shopping_bag</span>
          <h2 className="font-headline-md text-2xl font-bold text-[#1b1c1c]">Your Cart is Empty</h2>
          <button
            onClick={() => setActiveTab('shop')}
            className="mt-6 px-8 py-3 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer"
          >
            Continue Browsing Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9f8] min-h-screen py-12 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-headline-md text-3xl font-bold text-[#1b1c1c] mb-8 uppercase tracking-wider">
          Secure Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Form */}
          <div className="flex-1 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 border border-[#e4e2e2] shadow-sm space-y-8">
              
              {/* Delivery Information */}
              <div className="space-y-4">
                <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] border-b border-[#e4e2e2] pb-2">
                  1. Delivery Information
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ananya Rao"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Phone Number (for Transit Updates) *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Shipping Address *</label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Landmark, City, Pincode/Zip..."
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] border-b border-[#e4e2e2] pb-2">
                  2. Secure Payment
                </h5>

                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Name on Card *</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Ananya Rao"
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-label-caps uppercase text-[#444748]">Card Number *</label>
                    {getCardBrand(cardNumber) === 'Visa' && (
                      <span className="text-xs font-bold text-[#1a1f71] italic">VISA</span>
                    )}
                    {getCardBrand(cardNumber) === 'Mastercard' && (
                      <span className="text-xs font-bold text-[#eb001b] italic">Mastercard</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={16}
                    minLength={16}
                    pattern="[0-9]{16}"
                    title="16 digit card number"
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm tracking-widest font-mono"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Expiry Date *</label>
                    <input
                      type="month"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">CVV *</label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      maxLength={3}
                      minLength={3}
                      pattern="[0-9]{3}"
                      title="3 digit CVV"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm tracking-widest font-mono"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Preview */}
          <div className="w-full lg:w-96 space-y-6">
            <div className="bg-white p-6 border border-[#e4e2e2] shadow-sm space-y-4 sticky top-6">
              <h4 className="font-headline-md text-lg font-bold border-b border-[#e4e2e2] pb-2">Order Summary</h4>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-3 items-center bg-[#fbf9f8] p-2 rounded-xs border border-[#e4e2e2] relative group">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xs border border-[#c4c7c7]/30"
                    />
                    <div className="flex-1">
                      <h5 className="font-headline-md font-semibold text-sm text-[#1b1c1c] leading-tight pr-6">
                        {item.product.name}
                      </h5>
                      <span className="text-[11px] font-body-md text-[#735c00] block mt-0.5">
                        {item.selectedTimber}
                      </span>
                      <span className="font-headline-md font-bold text-sm text-[#000000] block mt-1.5">
                        {formatPrice(item.product.priceINR * item.quantity, currency)}
                      </span>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer bg-white shadow-sm"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-label-caps px-1">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-full border border-[#c4c7c7] flex items-center justify-center text-xs hover:bg-[#efeded] cursor-pointer bg-white shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="absolute top-2 right-2 text-[#747878] hover:text-[#ba1a1a] p-1 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#e4e2e2] space-y-2 text-sm font-label-caps">
                <div className="flex justify-between text-[#444748]">
                  <span>Subtotal:</span>
                  <span>{formatPrice(rawTotalINR, currency)}</span>
                </div>
                <div className="flex justify-between text-[#444748]">
                  <span>Shipping:</span>
                  <span>{formatPrice(shippingCharge, currency)}</span>
                </div>
                <div className="flex justify-between text-[#444748]">
                  <span>GST ({gstRate}%):</span>
                  <span>{formatPrice(gstAmountINR, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-[#000000] border-t border-[#e4e2e2] pt-3 mt-1">
                  <span>Total Payable:</span>
                  <span>{formatPrice(finalTotalINR, currency)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className={`w-full py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest shadow-md mt-6 ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:opacity-90 cursor-pointer'}`}
              >
                {isProcessing ? 'Processing Payment...' : 'Confirm Order & Pay'}
              </button>

              <div className="text-center flex items-center justify-center gap-1 text-[11px] text-[#747878] font-label-caps uppercase pt-4 border-t border-[#e4e2e2]">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Secured via AES-256 Encryption
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvoice && invoiceData && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={handleInvoiceClose}
          cartItems={invoiceData.items}
          customerName={invoiceData.customerName}
          address={invoiceData.address}
          currency={currency}
          subtotal={invoiceData.subtotal}
          discountAmount={invoiceData.discountAmount}
          shipping={invoiceData.shipping}
          gstAmount={invoiceData.gstAmount}
          gstRate={invoiceData.gstRate}
          total={invoiceData.total}
        />
      )}
    </div>
  );
};
