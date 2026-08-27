import React from 'react';
import { ShippingLabelSettings } from '../types';
import { ShieldCheck, Truck, AlertTriangle, QrCode, Barcode as BarcodeIcon, PackageCheck, MapPin, Phone } from 'lucide-react';

interface ShippingLabelSlipProps {
  order: any;
  settings: ShippingLabelSettings;
  compact?: boolean;
}

export const ShippingLabelSlip: React.FC<ShippingLabelSlipProps> = ({ order, settings, compact = false }) => {
  const isCOD = order.payment_status === 'COD' || order.payment_info?.method === 'COD' || order.payment_info?.is_cod;
  const orderNum = order.order_number || order.id || 'ORD-999';
  const trackingNumber = `AWB-${orderNum.replace('#', '')}-EXP`;

  const address = order.shipping_address || {};
  const customerName = address.name || address.fullName || order.customer_name || 'Valued Heritage Collector';
  const streetAddress = address.address || address.street || 'Heritage Residency, MG Road';
  const city = address.city || 'Mysore';
  const state = address.state || 'Karnataka';
  const zip = address.zip || address.pincode || '570001';
  const phone = address.phone || order.customer_phone || '+91 98765 00000';

  const orderItems = order.items || order.cart_items || [];
  const grandTotal = order.total_amount || order.subtotal || 0;

  return (
    <div className="bg-white text-black font-sans border-2 border-black rounded-lg p-3 sm:p-4 space-y-3 relative overflow-hidden text-xs shadow-xs page-break-inside-avoid">
      
      {/* Top Header: Brand & Routing Hub */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          {settings.brand_logo_url && (
            <img src={settings.brand_logo_url} alt="Brand" className="w-7 h-7 object-contain" />
          )}
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider leading-tight">
              {settings.dispatch_hub_name || 'Irisjev Wooden Crafts'}
            </h4>
            <span className="text-[10px] text-gray-700 font-semibold block">EXPRESS PRIORITY SHIPPING SLIP</span>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="text-right">
          <span className="bg-black text-white font-mono font-black text-[11px] px-2 py-1 uppercase tracking-widest inline-block border border-black">
            AIR EXPRESS
          </span>
          <span className="block text-[9px] font-bold text-gray-600 mt-0.5">HUB CODE: MYS-BLR-01</span>
        </div>
      </div>

      {/* Barcode & QR Code Strip */}
      <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 items-center">
        <div className="col-span-8 space-y-1">
          {settings.show_barcode ? (
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-gray-500 uppercase block">AWB / TRACKING NO:</span>
              {/* Simulated High-Res SVG Barcode */}
              <svg className="w-full h-8" viewBox="0 0 200 40">
                <rect x="0" y="0" width="200" height="40" fill="#fff" />
                {[...Array(35)].map((_, i) => (
                  <rect
                    key={i}
                    x={i * 5.6 + 4}
                    y="2"
                    width={i % 3 === 0 ? 3 : 1.5}
                    height="36"
                    fill="#000"
                  />
                ))}
              </svg>
              <div className="text-center font-mono font-black text-xs tracking-widest">
                {trackingNumber}
              </div>
            </div>
          ) : (
            <div className="font-mono font-bold text-sm">
              ORDER ID: {orderNum}
            </div>
          )}
        </div>

        <div className="col-span-4 flex flex-col items-end justify-center">
          {settings.show_qr_code && (
            <div className="p-1 border border-black bg-white rounded text-center">
              <svg className="w-10 h-10" viewBox="0 0 40 40">
                <rect x="0" y="0" width="40" height="40" fill="#fff" />
                <rect x="2" y="2" width="12" height="12" fill="#000" />
                <rect x="4" y="4" width="8" height="8" fill="#fff" />
                <rect x="6" y="6" width="4" height="4" fill="#000" />

                <rect x="26" y="2" width="12" height="12" fill="#000" />
                <rect x="28" y="4" width="8" height="8" fill="#fff" />
                <rect x="30" y="6" width="4" height="4" fill="#000" />

                <rect x="2" y="26" width="12" height="12" fill="#000" />
                <rect x="4" y="28" width="8" height="8" fill="#fff" />
                <rect x="6" y="30" width="4" height="4" fill="#000" />

                <rect x="18" y="18" width="6" height="6" fill="#000" />
                <rect x="26" y="20" width="12" height="4" fill="#000" />
                <rect x="20" y="28" width="8" height="10" fill="#000" />
              </svg>
              <span className="text-[8px] font-mono font-bold block mt-0.5">SCAN VERIFY</span>
            </div>
          )}
        </div>
      </div>

      {/* Destination & Payment Verification Stamp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b-2 border-black pb-3">
        
        {/* Consignee Address */}
        <div className="space-y-1">
          <span className="font-extrabold uppercase text-[10px] text-gray-500 block border-b border-gray-300 pb-0.5">
            DELIVER TO (SHIP TO):
          </span>
          <h3 className="font-black text-sm uppercase leading-tight text-black">
            {customerName}
          </h3>
          <p className="font-bold text-xs leading-snug">
            {streetAddress}
          </p>
          <p className="font-extrabold text-xs">
            {city}, {state} - <span className="font-mono text-sm underline">{zip}</span>
          </p>
          <div className="flex items-center gap-1 font-bold text-[11px] pt-1">
            <Phone className="w-3 h-3 text-black shrink-0" />
            <span>Ph: {phone}</span>
          </div>
        </div>

        {/* Payment Badge & Dispatch Hub */}
        <div className="space-y-2 flex flex-col justify-between">
          
          {/* Payment Type Stamp */}
          {settings.show_cod_badge && (
            <div className={`p-2 border-2 text-center rounded ${
              isCOD ? 'border-red-600 bg-red-50 text-red-900' : 'border-emerald-600 bg-emerald-50 text-emerald-900'
            }`}>
              <span className="font-black uppercase text-xs tracking-wider block">
                {isCOD ? '💵 CASH ON DELIVERY (COD)' : '✅ PREPAID ORDER'}
              </span>
              {isCOD ? (
                <span className="font-black text-base font-mono block mt-0.5">
                  COLLECT: ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="font-bold text-[10px] uppercase block">
                  DO NOT COLLECT PAYMENT
                </span>
              )}
            </div>
          )}

          {/* Return Address / Dispatch Hub */}
          {settings.show_return_address && (
            <div className="bg-gray-100 p-1.5 border border-black rounded text-[10px]">
              <span className="font-bold uppercase text-[9px] text-gray-600 block">IF UNDELIVERED RETURN TO:</span>
              <p className="font-bold leading-tight truncate">{settings.dispatch_hub_name}</p>
              <p className="text-gray-700 text-[9px] leading-tight truncate">{settings.dispatch_hub_address}</p>
            </div>
          )}

        </div>
      </div>

      {/* Fragile Warning Banner */}
      {settings.show_fragile_warning && (
        <div className="bg-amber-100 border-2 border-amber-800 p-1.5 rounded flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="font-black text-[10px] uppercase tracking-wider">
              {settings.custom_declaration_note || 'FRAGILE - Sanctified Heritage Wooden Sculptures • 100% Insured Transit'}
            </span>
          </div>
        </div>
      )}

      {/* Optional Item Breakdown */}
      {settings.show_order_items && orderItems.length > 0 && (
        <div className="border-t border-gray-300 pt-1 text-[10px]">
          <span className="font-bold uppercase text-gray-500 block mb-0.5">PACKAGE CONTENTS ({orderItems.length} ITEMS):</span>
          <div className="space-y-0.5 max-h-16 overflow-hidden">
            {orderItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between font-bold">
                <span className="truncate max-w-[200px]">• {item.name || item.title}</span>
                <span>Qty: {item.quantity || 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Timestamp & Verification */}
      <div className="flex justify-between items-center text-[8px] text-gray-500 pt-1 border-t border-gray-200">
        <span>Order Date: {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}</span>
        <span>Verified Irisjev Logistics • System Label ID: #{orderNum}</span>
      </div>

    </div>
  );
};
