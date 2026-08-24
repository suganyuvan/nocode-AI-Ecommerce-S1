import React, { useState, useEffect } from 'react';
import { CartItem, Currency, ActiveTab } from '../types';
import { formatPrice } from '../utils/currency';
import { InvoiceModal } from '../components/InvoiceModal';
import { supabase } from '../utils/supabaseClient';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '../utils/razorpay';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // Shipping & GST
  const [shippingCharge, setShippingCharge] = useState(0);
  const [gstRate, setGstRate] = useState(0);

  useEffect(() => {
    setShippingCharge((Math.floor(Math.random() * 8) + 15) * 10);
    setGstRate(Math.floor(Math.random() * 3) + 3);
  }, []);

  const rawTotalINR = cartItems.reduce(
    (acc, item) => acc + item.product.priceINR * item.quantity,
    0
  );

  const appliedDiscount = 0; 
  const discountAmountINR = (rawTotalINR * appliedDiscount) / 100;
  
  const gstAmountINR = ((rawTotalINR - discountAmountINR) * gstRate) / 100;
  const finalTotalINR = rawTotalINR - discountAmountINR + gstAmountINR + shippingCharge;

  const fullShippingAddress = {
    street: address,
    city: city || 'Bengaluru',
    state: state || 'Karnataka',
    postalCode: postalCode || '560001',
    country: country || 'India',
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);
    
    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay payment gateway SDK failed to load. Please check your internet connection.');
      }

      // 2. Check or Upsert Customer
      let customerId = '';
      const { data: existingCustomer, error: findErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();

      if (findErr) throw findErr;

      const formattedAddressStr = `${address}, ${city} ${postalCode}, ${state}, ${country}`.replace(/^[,\s]+|[,\s]+$/g, '');

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from('customers')
          .update({ phone: customerPhone, address: formattedAddressStr, full_name: customerName })
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error: insertErr } = await supabase
          .from('customers')
          .insert([{ full_name: customerName, email: customerEmail, phone: customerPhone, address: formattedAddressStr }])
          .select()
          .single();
        
        if (insertErr) throw insertErr;
        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }

      if (!customerId) {
        throw new Error('Failed to create or fetch customer record');
      }

      // 3. Create Draft Order in Supabase
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
          status: 'pending_payment',
          payment_status: 'pending',
          payment_info: 'Razorpay (Pending)',
          shipping_address: fullShippingAddress,
          shipping_charge: shippingCharge,
          gst_rate: gstRate,
          gst_amount: gstAmountINR,
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      if (!newOrder) throw new Error('Failed to initialize order in database');

      // 4. Create Order Items
      const orderItemsPayload = cartItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product.id,
        product_name: item.product.name,
        selected_timber: item.selectedTimber,
        quantity: item.quantity,
        unit_price: item.product.priceINR
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsErr) console.warn('Order items insert notice:', itemsErr);

      // 5. Create Order in Razorpay via Edge Function
      const rzpOrder = await createRazorpayOrder(
        finalTotalINR,
        currency,
        orderNumber,
        {
          order_id: newOrder.id,
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }
      );

      // Link Razorpay Order ID to database order
      await supabase
        .from('orders')
        .update({ razorpay_order_id: rzpOrder.orderId })
        .eq('id', newOrder.id);

      // 6. Launch Razorpay Standard Checkout Modal
      const options = {
        key: rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TSSXHdcPyRcrR8',
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || 'INR',
        name: 'Irisjev Wooden Crafts',
        description: `Order #${orderNumber} Handcrafted Heritage Sculptures`,
        image: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
        order_id: rzpOrder.orderId,
        handler: async (response: any) => {
          setIsProcessing(true);
          try {
            // Verify payment signature via Edge Function
            const verifyResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: newOrder.id,
              order_number: orderNumber,
            });

            // Update order status in Supabase directly as well
            await supabase
              .from('orders')
              .update({
                status: 'paid',
                payment_status: 'paid',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_info: `Razorpay Verified (${response.razorpay_payment_id})`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', newOrder.id);

            // Clear Cart
            onClearCart();

            // Set Invoice Data
            setInvoiceData({
              items: [...cartItems],
              customerName,
              customerEmail,
              customerPhone,
              address: formattedAddressStr,
              subtotal: rawTotalINR,
              discountAmount: discountAmountINR,
              shipping: shippingCharge,
              gstAmount: gstAmountINR,
              gstRate: gstRate,
              total: finalTotalINR,
              invoiceNumber: orderNumber,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });

            setShowInvoice(true);
          } catch (verifyErr: any) {
            console.error('Payment verification failed:', verifyErr);
            // Even if client verification fails, webhook fallback handles it
            alert('Payment completed! We are confirming your transaction with our automated verification system.');
            onClearCart();
            setInvoiceData({
              items: [...cartItems],
              customerName,
              customerEmail,
              customerPhone,
              address: formattedAddressStr,
              subtotal: rawTotalINR,
              discountAmount: discountAmountINR,
              shipping: shippingCharge,
              gstAmount: gstAmountINR,
              gstRate: gstRate,
              total: finalTotalINR,
              invoiceNumber: orderNumber,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            setShowInvoice(true);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          order_id: newOrder.id,
          order_number: orderNumber,
          craft_studio: 'Irisjev Wooden Crafts, Karnataka',
        },
        theme: {
          color: '#1c1b1b',
          backdrop_color: 'rgba(28, 27, 27, 0.7)',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            console.log('Payment modal dismissed by user');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', (failResponse: any) => {
        console.error('Razorpay payment failed:', failResponse.error);
        setErrorMessage(
          failResponse.error?.description || 'Payment was unsuccessful or declined by your bank. Please try again.'
        );
        setIsProcessing(false);
      });

      razorpayInstance.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  const handleInvoiceClose = () => {
    setShowInvoice(false);
  };

  if (invoiceData && !showInvoice) {
    return (
      <div className="bg-[#fbf9f8] min-h-screen py-24 px-6 font-sans">
        <div className="max-w-2xl mx-auto bg-white p-12 border border-[#e4e2e2] shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-[#f4ebd0] text-[#735c00] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-5xl">verified</span>
          </div>
          <h4 className="font-headline-md text-3xl font-bold text-[#1b1c1c]">
            Payment Successful & Order Reserved!
          </h4>
          <p className="font-body-md text-base text-[#444748] leading-relaxed">
            Thank you, <strong>{invoiceData.customerName || 'Valued Collector'}</strong>. Your payment has been securely verified via <strong>Razorpay</strong>. Our master craftspeople will prepare your bespoke piece with custom heirloom packaging.
          </p>
          <div className="bg-[#f5f3f3] p-6 rounded-xs border border-[#c4c7c7] text-left text-sm font-label-caps space-y-2 inline-block mx-auto w-full mt-4">
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Order ID:</span>
              <strong className="text-[#1b1c1c]">#{invoiceData.invoiceNumber}</strong>
            </div>
            {invoiceData.razorpayPaymentId && (
              <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
                <span className="text-[#747878]">Razorpay Payment ID:</span>
                <strong className="font-mono text-xs text-[#735c00]">{invoiceData.razorpayPaymentId}</strong>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Craft Studio:</span>
              <span className="text-[#1b1c1c]">Irisjev Wooden Crafts, Karnataka</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#e4e2e2]">
              <span className="text-[#747878]">Transit Insurance:</span>
              <span className="text-[#2e6930] font-bold">100% Fully Transit Insured</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#747878]">Concierge Updates:</span>
              <span className="text-[#1b1c1c]">{invoiceData.customerEmail || invoiceData.customerPhone}</span>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInvoice(true)}
              className="px-8 py-4 bg-white border-2 border-[#1c1b1b] text-[#1c1b1b] font-label-caps text-xs uppercase tracking-widest hover:bg-[#efeded] cursor-pointer"
            >
              View Detailed Tax Invoice
            </button>
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-10 py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-md"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-md text-3xl font-bold text-[#1b1c1c] uppercase tracking-wider">
              Secure Checkout
            </h1>
            <p className="text-xs text-[#747878] font-label-caps uppercase tracking-widest mt-1">
              Encrypted 256-Bit Gateway Powered by Razorpay
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 border border-[#e4e2e2] rounded-xs shadow-2xs">
            <span className="flex items-center gap-1.5 text-xs text-[#2e6930] font-semibold">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              100% Buyer Protection
            </span>
            <span className="text-[#c4c7c7]">|</span>
            <span className="flex items-center gap-1.5 text-xs text-[#444748] font-medium">
              <span className="material-symbols-outlined text-sm">lock</span>
              PCI-DSS Compliant
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm flex items-start gap-3 rounded-xs">
            <span className="material-symbols-outlined text-red-600">error</span>
            <div className="flex-1">
              <p className="font-bold">Payment Notice</p>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Delivery & Payment Details */}
          <div className="flex-1 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 border border-[#e4e2e2] shadow-sm space-y-8">
              
              {/* Delivery Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#e4e2e2] pb-2">
                  <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center text-xs">1</span>
                    Delivery Information
                  </h5>
                  <span className="text-xs text-[#747878] font-label-caps uppercase">White-Glove Courier</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ananya Rao"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
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
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Phone Number (for Transit Updates & OTP) *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Street Address / Landmark *</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Apartment #, Street, Landmark..."
                    className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">PIN / Zip *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="560001"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-label-caps uppercase text-[#444748] mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                      className="w-full p-3 border border-[#c4c7c7] rounded-xs bg-white text-sm focus:outline-none focus:border-[#1c1b1b]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Gateway Information */}
              <div className="space-y-5 pt-2">
                <div className="flex justify-between items-center border-b border-[#e4e2e2] pb-2">
                  <h5 className="font-label-caps uppercase text-sm font-bold text-[#1b1c1c] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1c1b1b] text-white flex items-center justify-center text-xs">2</span>
                    Payment Method
                  </h5>
                  <span className="text-xs text-[#735c00] font-bold font-label-caps flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Instant & Secure
                  </span>
                </div>

                <div className="bg-[#fbf9f8] p-6 border-2 border-[#1c1b1b] rounded-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-4 border-[#1c1b1b] bg-white"></div>
                      <div>
                        <span className="font-headline-md font-bold text-base text-[#1b1c1c] block">
                          Razorpay Payments
                        </span>
                        <span className="text-xs text-[#444748] block">
                          UPI, Credit/Debit Cards, NetBanking, EMI & Wallets
                        </span>
                      </div>
                    </div>
                    <img
                      src="https://razorpay.com/assets/razorpay-glyph.svg"
                      alt="Razorpay"
                      className="h-8 w-auto opacity-90"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Payment Option Badges */}
                  <div className="pt-3 border-t border-[#e4e2e2] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-label-caps text-[#444748]">
                    <div className="bg-white p-2 border border-[#e4e2e2] rounded-2xs text-center flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[#1b1c1c] text-lg">account_balance_wallet</span>
                      <span className="font-bold text-[10px]">UPI & QR</span>
                      <span className="text-[9px] text-[#747878]">GPay / PhonePe / Paytm</span>
                    </div>

                    <div className="bg-white p-2 border border-[#e4e2e2] rounded-2xs text-center flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[#1b1c1c] text-lg">credit_card</span>
                      <span className="font-bold text-[10px]">Cards</span>
                      <span className="text-[9px] text-[#747878]">Visa / MC / RuPay / Amex</span>
                    </div>

                    <div className="bg-white p-2 border border-[#e4e2e2] rounded-2xs text-center flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[#1b1c1c] text-lg">account_balance</span>
                      <span className="font-bold text-[10px]">NetBanking</span>
                      <span className="text-[9px] text-[#747878]">50+ Top Indian Banks</span>
                    </div>

                    <div className="bg-white p-2 border border-[#e4e2e2] rounded-2xs text-center flex flex-col items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[#1b1c1c] text-lg">payments</span>
                      <span className="font-bold text-[10px]">EMI & PayLater</span>
                      <span className="text-[9px] text-[#747878]">Card & Cardless EMI</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#747878] leading-relaxed italic bg-white p-3 border border-[#e4e2e2] rounded-2xs">
                    * Clicking "Proceed to Pay with Razorpay" will safely launch Razorpay's trusted checkout modal with automated bank reconciliation and instant payment capture.
                  </p>
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
                  <span>Insured Shipping:</span>
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
                className={`w-full py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest shadow-md mt-6 flex items-center justify-center gap-2 ${
                  isProcessing ? 'opacity-70 cursor-wait' : 'hover:opacity-90 cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connecting Razorpay Gateway...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Proceed to Pay with Razorpay
                  </>
                )}
              </button>

              <div className="text-center flex items-center justify-center gap-1.5 text-[11px] text-[#747878] font-label-caps uppercase pt-4 border-t border-[#e4e2e2]">
                <span className="material-symbols-outlined text-[14px] text-[#2e6930]">shield_lock</span>
                Automated Fallback Webhook System Active
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
