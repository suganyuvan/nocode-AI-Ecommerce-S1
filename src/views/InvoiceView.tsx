import React, { useRef } from 'react';
import { CartItem, Currency, ActiveTab } from '../types';
import { formatPrice } from '../utils/currency';

interface InvoiceViewProps {
  invoiceData: {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    subtotal: number;
    discountAmount: number;
    couponCode?: string;
    total: number;
    invoiceNumber: string;
    dateString: string;
    payByString: string;
  };
  currency: Currency;
  setActiveTab: (tab: ActiveTab) => void;
}


export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoiceData,
  currency,
  setActiveTab,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 pt-24 min-h-screen">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('home')}
          className="text-sm font-label-caps uppercase tracking-widest hover:text-[#735c00] transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Home
        </button>
        <button 
          onClick={handlePrint}
          className="bg-white p-3 rounded-full text-[#444748] hover:text-[#1c1b1b] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          <span className="text-xs font-label-caps uppercase">Print</span>
        </button>
      </div>

      <div className="mb-8 p-8 bg-white border border-[#e4e2e2] shadow-sm text-center space-y-4 print:hidden">
        <span className="material-symbols-outlined text-5xl text-[#735c00]">verified</span>
        <h4 className="font-headline-md text-2xl font-bold text-[#1b1c1c]">
          Reservation Confirmed!
        </h4>
        <p className="font-body-md text-sm text-[#444748] max-w-2xl mx-auto">
          Thank you, <strong>{invoiceData.customerName || 'Valued Collector'}</strong>. Your handcrafted piece is reserved. Our concierge will contact you at <strong>{invoiceData.customerEmail || invoiceData.customerPhone}</strong> with white-glove transit details.
        </p>
        <div className="bg-[#f5f3f3] p-4 rounded-xs border border-[#c4c7c7] text-left text-xs font-label-caps space-y-1 inline-block mx-auto max-w-md w-full mt-4">
          <p><strong>Order ID:</strong> #{invoiceData.invoiceNumber}</p>
          <p><strong>Craft Studio:</strong> Irisjev Wooden Crafts, Karnataka</p>
          <p><strong>Insurance:</strong> 100% Transit Insured</p>
        </div>
        <div className="mt-6">
          <button
            onClick={() => setActiveTab('home')}
            className="w-full sm:w-auto px-8 py-3 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer shadow-md"
          >
            Continue Browsing Collection
          </button>
        </div>
      </div>

      <div className="bg-[#F9F7F3] shadow-lg rounded-sm overflow-hidden print:shadow-none custom-scrollbar" ref={contentRef}>
        <div className="p-8 sm:p-12 text-[#1c1b1b] bg-[#F9F7F3] min-h-[800px] flex flex-col font-sans">
          {/* Header */}
          <div className="flex justify-between items-start mb-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#C8A97E]">
                <path d="M50 15 C55 35 75 40 85 55 C90 62 85 75 75 80 C60 88 55 70 50 60 C45 70 40 88 25 80 C15 75 10 62 15 55 C25 40 45 35 50 15 Z" stroke="currentColor" strokeWidth="2" fill="transparent"/>
                <path d="M50 25 C53 40 68 45 75 55 C78 60 75 68 68 70 C58 75 53 62 50 55 C47 62 42 75 32 70 C25 68 22 60 25 55 C32 45 47 40 50 25 Z" stroke="currentColor" strokeWidth="2" fill="transparent"/>
                <path d="M50 40 C52 50 60 52 65 60 C67 63 65 67 60 68 C54 70 52 63 50 58 C48 63 46 70 40 68 C35 67 33 63 35 60 C40 52 48 50 50 40 Z" stroke="currentColor" strokeWidth="2" fill="transparent"/>
                <path d="M50 15 L50 60" stroke="currentColor" strokeWidth="2"/>
                <path d="M38 82 C42 85 48 85 50 85 C52 85 58 85 62 82" stroke="currentColor" strokeWidth="2" fill="transparent" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl tracking-widest text-[#1c1b1b]" style={{ fontFamily: 'Times New Roman, serif' }}>INVOICE</h1>
          </div>

          {/* Billing Info */}
          <div className="flex justify-between items-start mb-12 text-sm sm:text-base">
            <div>
              <h2 className="font-bold mb-1 tracking-wider text-xs sm:text-sm uppercase">BILLED TO:</h2>
              <div className="whitespace-pre-line text-[#444748] leading-relaxed">
                {invoiceData.customerName ? invoiceData.customerName + '\n' : ''}
                {invoiceData.address || '145 Bay 79th St.\nManhattan, NY, 11221'}
              </div>
            </div>
            <div className="text-right text-[#444748]">
              <div>Invoice No. {invoiceData.invoiceNumber}</div>
              <div>{invoiceData.dateString}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <div className="flex border-b border-t border-[#1c1b1b] py-3 text-xs sm:text-sm font-bold tracking-wide">
              <div className="flex-1 text-left">Item</div>
              <div className="w-20 text-center">Quantity</div>
              <div className="w-24 text-right">Unit Price</div>
              <div className="w-24 text-right">Total</div>
            </div>
            
            {invoiceData.items.length > 0 ? (
              invoiceData.items.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className="flex border-b border-[#c4c7c7] py-4 text-sm text-[#444748]">
                  <div className="flex-1 text-left pr-4">{item.product.name} {item.selectedTimber ? `(${item.selectedTimber})` : ''}</div>
                  <div className="w-20 text-center">{item.quantity}</div>
                  <div className="w-24 text-right">{formatPrice(item.product.priceINR, currency)}</div>
                  <div className="w-24 text-right">{formatPrice(item.product.priceINR * item.quantity, currency)}</div>
                </div>
              ))
            ) : (
              <div className="flex justify-center border-b border-[#c4c7c7] py-8 text-sm text-[#444748]">
                No items
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end pt-4">
              <div className="w-60 space-y-3 text-sm">
                <div className="flex justify-between text-[#444748]">
                  <span className="font-bold text-[#1c1b1b]">Subtotal</span>
                  <span>{formatPrice(invoiceData.subtotal, currency)}</span>
                </div>
                {invoiceData.discountAmount > 0 && (
                  <div className="flex justify-between text-[#2e6930] font-bold">
                    <span>{invoiceData.couponCode ? `Coupon (${invoiceData.couponCode})` : 'Discount'}</span>
                    <span>-{formatPrice(invoiceData.discountAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#444748] border-b border-[#c4c7c7] pb-3">
                  <span className="font-bold text-[#1c1b1b]">Tax (0%)</span>
                  <span>{formatPrice(0, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg sm:text-xl pt-2 text-[#1c1b1b]">
                  <span>Total</span>
                  <span>{formatPrice(invoiceData.total, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Footer */}
          <div className="mt-8">
            <h3 className="text-2xl text-[#1c1b1b] mb-12">Thank you!</h3>
            
            <div className="flex flex-col sm:flex-row justify-between items-end text-sm">
              <div className="w-full sm:w-auto mb-6 sm:mb-0">
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider mb-2">PAYMENT INFORMATION</h4>
                <div className="text-[#444748] leading-relaxed">
                  <div>Paid via Credit Card</div>
                  <div>Processed securely.</div>
                  <div>Account Name: Irisjev Crafts</div>
                </div>
              </div>
              
              <div className="text-right w-full sm:w-auto">
                <div className="text-lg text-[#1c1b1b] mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>Samantha Jordan</div>
                <div className="text-[#444748]">123 Anywhere St., Any City, ST 12345</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
