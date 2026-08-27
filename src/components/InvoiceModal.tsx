import React, { useRef } from 'react';
import { CartItem, Currency } from '../types';
import { formatPrice } from '../utils/currency';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  customerName: string;
  address: string;
  currency: Currency;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shipping: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  invoiceNumber?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  codHandlingFee?: number;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  customerName,
  address,
  currency,
  subtotal,
  discountAmount,
  couponCode,
  shipping,
  gstAmount,
  gstRate,
  total,
  invoiceNumber,
  razorpayPaymentId,
  paymentMethod,
  codHandlingFee = 0,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const displayInvoiceNumber = invoiceNumber || `SWARNA-${Math.floor(10000 + Math.random() * 90000)}`;
  const today = new Date();
  const dateString = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const payByDate = new Date();
  payByDate.setDate(payByDate.getDate() + 7);
  const payByString = payByDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 print:p-0 print:block">
      <div
        className="absolute inset-0 bg-[#1c1b1b]/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      <div className="relative bg-[#F9F7F3] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col print:shadow-none print:w-full print:h-full print:max-w-none print:max-h-none print:bg-white custom-scrollbar">
        <div className="absolute top-4 right-4 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-white p-2 rounded-full text-[#444748] hover:text-[#1c1b1b] shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
            title="Print Invoice"
          >
            <span className="material-symbols-outlined text-sm">print</span>
          </button>
          <button
            onClick={onClose}
            className="bg-white p-2 rounded-full text-[#444748] hover:text-[#1c1b1b] shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 text-[#1c1b1b] bg-[#F9F7F3] flex flex-col font-sans" ref={contentRef}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#C8A97E]">
                <path d="M50 15 C55 35 75 40 85 55 C90 62 85 75 75 80 C60 88 55 70 50 60 C45 70 40 88 25 80 C15 75 10 62 15 55 C25 40 45 35 50 15 Z" stroke="currentColor" strokeWidth="2" fill="transparent" />
                <path d="M50 25 C53 40 68 45 75 55 C78 60 75 68 68 70 C58 75 53 62 50 55 C47 62 42 75 32 70 C25 68 22 60 25 55 C32 45 47 40 50 25 Z" stroke="currentColor" strokeWidth="2" fill="transparent" />
                <path d="M50 40 C52 50 60 52 65 60 C67 63 65 67 60 68 C54 70 52 63 50 58 C48 63 46 70 40 68 C35 67 33 63 35 60 C40 52 48 50 50 40 Z" stroke="currentColor" strokeWidth="2" fill="transparent" />
                <path d="M50 15 L50 60" stroke="currentColor" strokeWidth="2" />
                <path d="M38 82 C42 85 48 85 50 85 C52 85 58 85 62 82" stroke="currentColor" strokeWidth="2" fill="transparent" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl tracking-widest text-[#1c1b1b]" style={{ fontFamily: 'Times New Roman, serif' }}>INVOICE</h1>
          </div>

          {/* Billing Info */}
          <div className="flex justify-between items-start mb-8 text-sm sm:text-base">
            <div>
              <h2 className="font-bold mb-1 tracking-wider text-xs sm:text-sm uppercase">BILLED TO:</h2>
              <div className="whitespace-pre-line text-[#444748] leading-relaxed">
                {customerName ? customerName + '\n' : ''}
                {address || '145 Bay 79th St.\nManhattan, NY, 11221'}
              </div>
              {couponCode && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-[#2e6930]/10 border border-[#2e6930]/30 text-[#2e6930] px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                  <span>🎟️ Promo Code: {couponCode}</span>
                  {discountAmount > 0 && <span>(-{formatPrice(discountAmount, currency)})</span>}
                </div>
              )}
            </div>
            <div className="text-right text-[#444748]">
              <div>Invoice No. {displayInvoiceNumber}</div>
              <div>{dateString}</div>
              {razorpayPaymentId && (
                <div className="text-xs text-[#735c00] font-mono mt-1 font-semibold">
                  Paid via Razorpay: {razorpayPaymentId}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="flex border-b border-t border-[#1c1b1b] py-3 text-xs sm:text-sm font-bold tracking-wide">
              <div className="flex-1 text-left">Item</div>
              <div className="w-20 text-center">Quantity</div>
              <div className="w-24 text-right">Unit Price</div>
              <div className="w-24 text-right">Total</div>
            </div>

            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className="flex border-b border-[#c4c7c7] py-4 text-sm text-[#444748]">
                  <div className="flex-1 text-left pr-4">
                    {item.product.name} {item.selectedTimber ? `(${item.selectedTimber})` : ''}
                    {item.isGift && <span className="text-[#2e6930] font-bold text-xs ml-2">(FREE GIFT)</span>}
                  </div>
                  <div className="w-20 text-center">{item.quantity}</div>
                  <div className="w-24 text-right">
                    {item.isGift ? <span className="text-[#2e6930] font-bold">FREE</span> : formatPrice(item.product.priceINR, currency)}
                  </div>
                  <div className="w-24 text-right">
                    {item.isGift ? <span className="text-[#2e6930] font-bold">FREE</span> : formatPrice(item.product.priceINR * item.quantity, currency)}
                  </div>
                </div>
              ))
            ) : (
              // Mock data for preview if cart is empty
              <>
                <div className="flex border-b border-[#c4c7c7] py-4 text-sm text-[#444748]">
                  <div className="flex-1 text-left pr-4">Handmade wooden tablet</div>
                  <div className="w-20 text-center">1</div>
                  <div className="w-24 text-right">$123</div>
                  <div className="w-24 text-right">$123</div>
                </div>
                <div className="flex border-b border-[#c4c7c7] py-4 text-sm text-[#444748]">
                  <div className="flex-1 text-left pr-4">White framed mirror</div>
                  <div className="w-20 text-center">2</div>
                  <div className="w-24 text-right">$127</div>
                  <div className="w-24 text-right">$254</div>
                </div>
                <div className="flex border-b border-[#c4c7c7] py-4 text-sm text-[#444748]">
                  <div className="flex-1 text-left pr-4">Twin size bed</div>
                  <div className="w-20 text-center">1</div>
                  <div className="w-24 text-right">$123</div>
                  <div className="w-24 text-right">$123</div>
                </div>
              </>
            )}

            {/* Totals */}
            <div className="flex justify-end pt-4">
              <div className="w-60 space-y-3 text-sm">
                <div className="flex justify-between text-[#444748]">
                  <span className="font-bold text-[#1c1b1b]">Subtotal</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#2e6930] font-bold">
                    <span>{couponCode ? `Coupon (${couponCode})` : 'Discount'}</span>
                    <span>-{formatPrice(discountAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#444748]">
                  <span className="font-bold text-[#1c1b1b]">Shipping</span>
                  <span>{shipping === 0 ? (
                    <span className="text-[#2e6930] font-bold">
                      {couponCode?.includes('SHIP') ? `FREE (Coupon ${couponCode})` : 'FREE'}
                    </span>
                  ) : (
                    formatPrice(shipping, currency)
                  )}</span>
                </div>
                {paymentMethod === 'cod' && codHandlingFee > 0 && (
                  <div className="flex justify-between text-[#735c00]">
                    <span className="font-bold text-[#1c1b1b]">COD Fee</span>
                    <span>+{formatPrice(codHandlingFee, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#444748] border-b border-[#c4c7c7] pb-3">
                  <span className="font-bold text-[#1c1b1b]">GST ({gstRate}%)</span>
                  <span>{formatPrice(gstAmount, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg sm:text-xl pt-2 text-[#1c1b1b]">
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>


          {/* Footer */}
          <div className="mt-8">
            <h3 className="text-2xl text-[#1c1b1b] mb-6">Thank you!</h3>

            <div className="flex flex-col sm:flex-row justify-between items-end text-sm">
              <div className="w-full sm:w-auto mb-6 sm:mb-0">
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider mb-2">PAYMENT INFORMATION</h4>
                  {paymentMethod === 'cod' ? (
                    <>
                      <div>Payment Method: <span className="font-bold">Cash on Delivery (COD)</span></div>
                      <div>Status: <strong className="text-[#735c00]">Pending Delivery</strong></div>
                      <div>Date: {dateString}</div>
                    </>
                  ) : razorpayPaymentId ? (
                    <>
                      <div>Gateway: Razorpay Automated Checkout</div>
                      <div>Payment ID: <span className="font-mono">{razorpayPaymentId}</span></div>
                      <div>Status: <strong className="text-[#2e6930]">Paid & Verified</strong></div>
                      <div>Date: {dateString}</div>
                    </>
                  ) : (
                    <>
                      <div>Briard Bank</div>
                      <div>Account Name: Irisjev Crafts</div>
                      <div>Account No.: 9876543210</div>
                      <div>Pay by: {payByString}</div>
                    </>
                  )}
              </div>

              <div className="text-right w-full sm:w-auto">
                <div className="text-xs text-[#747878] font-label-caps uppercase">
                  100% Heirloom Quality Guaranteed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
