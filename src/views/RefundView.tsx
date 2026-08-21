import React from 'react';

export const RefundView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 text-[#1b1c1c]">
      <h1 className="text-4xl font-serif mb-8 text-center text-[#000000]">Cancellation & Refund Policy</h1>
      <div className="bg-[#ffffff] p-8 md:p-12 border border-[#c4c7c7]/30">
        <div className="prose prose-stone max-w-none">
          <p className="text-sm text-[#747878] italic mb-8 border-l-4 border-[#fed65b] pl-4">
            MOCK / TEST DATA — DEVELOPMENT USE ONLY<br/>
            Replace with your actual cancellation and refund policy.
          </p>
          <p><strong>Last Updated:</strong> 21 August 2026</p>
          <p>Thank you for shopping at <strong>IRISJEV</strong>. We want you to be completely satisfied with your purchase.</p>
          
          <h2 className="text-xl font-serif mt-8 mb-4">1. Order Cancellations</h2>
          <p>You may request an order cancellation within 24 hours of placing the order. Custom or bespoke commissions cannot be cancelled once work has commenced.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">2. Returns</h2>
          <p>If you are not entirely satisfied with your purchase, you have 7 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused, in the same condition that you received it, and in the original packaging.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">3. Refunds</h2>
          <p>Once we receive your item, we will inspect it and notify you. If your return is approved, we will initiate a refund to your credit card (or original method of payment) within 7-10 business days.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">4. Shipping for Returns</h2>
          <p>You will be responsible for paying for your own shipping costs for returning your item unless the item arrived damaged or defective.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions on how to return your item to us, contact us at support@irisjev.example.</p>
        </div>
      </div>
    </div>
  );
};
