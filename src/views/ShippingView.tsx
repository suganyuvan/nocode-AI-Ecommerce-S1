import React from 'react';

export const ShippingView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 text-[#1b1c1c]">
      <h1 className="text-4xl font-serif mb-8 text-center text-[#000000]">Shipping & Delivery Policy</h1>
      <div className="bg-[#ffffff] p-8 md:p-12 border border-[#c4c7c7]/30">
        <div className="prose prose-stone max-w-none">
          <p className="text-sm text-[#747878] italic mb-8 border-l-4 border-[#fed65b] pl-4">
            MOCK / TEST DATA — DEVELOPMENT USE ONLY<br/>
            Replace with your actual shipping policy.
          </p>
          <p><strong>Last Updated:</strong> 21 August 2026</p>
          <p>Welcome to <strong>IRISJEV</strong> Shipping & Delivery Policy.</p>
          
          <h2 className="text-xl font-serif mt-8 mb-4">1. Processing Time</h2>
          <p>All orders are processed within 2-3 business days. Masterpiece and custom items may take longer as described on the product page. Orders are not shipped or delivered on weekends or holidays.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">2. Shipping Rates & Delivery Estimates</h2>
          <p>Shipping charges for your order will be calculated and displayed at checkout. Standard delivery typically takes 5-7 business days within India.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">3. Shipment Confirmation & Order Tracking</h2>
          <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s).</p>

          <h2 className="text-xl font-serif mt-8 mb-4">4. Damages</h2>
          <p>IRISJEV takes utmost care with White-Glove transit for high-value items. If your order arrives damaged, please save all packaging materials and damaged goods and contact us immediately.</p>
        </div>
      </div>
    </div>
  );
};
