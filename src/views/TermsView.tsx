import React from 'react';
import { ActiveTab } from '../types';

export const TermsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 text-[#1b1c1c]">
      <h1 className="text-4xl font-serif mb-8 text-center text-[#000000]">Terms & Conditions</h1>
      <div className="bg-[#ffffff] p-8 md:p-12 border border-[#c4c7c7]/30">
        <div className="prose prose-stone max-w-none">
          <p className="text-sm text-[#747878] italic mb-8 border-l-4 border-[#fed65b] pl-4">
            MOCK / TEST DATA — DEVELOPMENT USE ONLY<br/>
            The business name, address, email, phone number and GSTIN in this document are fictional test values. Replace them with your actual legal/business details before publishing this policy or submitting the website for payment-gateway verification.
          </p>
          <p><strong>Last Updated:</strong> 21 August 2026</p>
          <p>Welcome to <strong>IRISJEV</strong>. These Terms & Conditions govern your access to and use of the IRISJEV website and your purchase of products through our online store.</p>
          
          <h2 className="text-xl font-serif mt-8 mb-4">1. About IRISJEV</h2>
          <p>IRISJEV is an online store offering physical products to customers in India.</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Legal/Business Name:</strong> IRISJEV Retail Ventures</li>
            <li><strong>Registered/Business Address:</strong> 24, Temple Street, Chennai, Tamil Nadu – 600024</li>
            <li><strong>Email:</strong> support@irisjev.example</li>
            <li><strong>Phone:</strong> +91 90000 12345</li>
            <li><strong>GSTIN:</strong> 33MOCKIRISJEV1234Z1</li>
          </ul>

          <h2 className="text-xl font-serif mt-8 mb-4">2. Products</h2>
          <p>We make reasonable efforts to ensure that product descriptions, photographs, dimensions, colours, materials and specifications displayed on the website are accurate. However, products made using natural materials or handmade processes may have minor variations in colour, texture, grain pattern, finish, dimensions, shape, and appearance. Such variations may not constitute a defect where they are a natural characteristic of the material or manufacturing process.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">3. Product Pricing</h2>
          <p>All prices displayed on the website are in Indian Rupees (INR). Prices may include or exclude applicable taxes depending on how the product price is displayed at checkout. Any applicable shipping charges or additional charges will be shown before order confirmation. IRISJEV reserves the right to correct pricing or product-information errors. If an order has been placed at an obviously incorrect price, we may contact the customer before processing the order.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">4. Orders</h2>
          <p>An order placed through the website constitutes a request to purchase the selected products. An order is considered accepted when IRISJEV sends an order confirmation or otherwise confirms acceptance. IRISJEV may cancel an order where reasonably necessary, including in cases involving product unavailability, incorrect pricing, payment failure, suspected fraudulent activity, incorrect customer information, delivery restrictions, or circumstances beyond reasonable control. If an order is cancelled after payment has been received, the eligible amount will be refunded using the applicable refund process.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">5. Customer Information</h2>
          <p>Customers are responsible for providing accurate information including name, phone number, email address and delivery address. IRISJEV is not responsible for delivery problems caused by incorrect or incomplete information supplied by the customer.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">6. Payments</h2>
          <p>Payments may be processed through third-party payment service providers. IRISJEV does not ordinarily receive or store complete card numbers, CVV numbers or banking credentials when payment is processed through a third-party payment gateway. Customers must follow the payment provider's authentication and security procedures.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">7. Shipping and Delivery</h2>
          <p>Orders will be processed and shipped according to the Shipping & Delivery Policy published on this website. Estimated delivery timelines are indicative and may vary due to courier delays, weather, public holidays, transportation disruptions, remote delivery locations, government restrictions, incorrect address information, or other circumstances outside IRISJEV's reasonable control.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">8. Cancellation, Returns and Refunds</h2>
          <p>Orders may be cancelled, returned or refunded only according to the applicable Cancellation & Refund Policy and Return & Exchange Policy published on the website. Customers should review those policies before placing an order.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">9. Damaged or Incorrect Products</h2>
          <p>If a product arrives damaged, defective or different from the product ordered, the customer should contact IRISJEV within the period specified in the Return & Exchange Policy. Customers may be requested to provide photographs, videos, packaging details, order information or other reasonable evidence to help investigate the issue.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">10. Intellectual Property</h2>
          <p>All website content, including text, logos, graphics, photographs, product descriptions, designs and other materials, belongs to IRISJEV or its respective licensors unless otherwise stated. You may not reproduce, copy, modify, distribute, sell or commercially exploit website content without prior written permission.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">11. Website Use</h2>
          <p>You agree not to use the website for unlawful purposes, attempt to gain unauthorised access, introduce malicious software, interfere with operation, use another person's information without authorisation, submit fraudulent orders, or misuse promotional offers or discounts.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">12. Third-Party Services</h2>
          <p>The website may use third-party services including payment gateways, logistics providers, analytics services, communication services and other technology providers. Those services may have their own terms and privacy policies.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">13. Limitation of Liability</h2>
          <p>IRISJEV will take reasonable steps to provide accurate product information and reliable services. To the extent permitted by applicable law, IRISJEV shall not be liable for indirect or consequential losses arising from circumstances beyond its reasonable control. Nothing in these Terms & Conditions is intended to exclude or restrict any consumer rights that cannot lawfully be excluded.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">14. Force Majeure</h2>
          <p>IRISJEV will not be responsible for delays or failures caused by circumstances beyond reasonable control, including natural disasters, severe weather, strikes, transportation disruption, government restrictions, technical failures or other extraordinary events.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">15. Governing Law</h2>
          <p>These Terms & Conditions shall be governed by the laws applicable in India. Any dispute shall be subject to the jurisdiction of the competent courts having jurisdiction over the relevant location, subject to applicable consumer-protection laws.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">16. Changes to These Terms</h2>
          <p>IRISJEV may update these Terms & Conditions from time to time. The updated version will be published on this website with the revised date.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">17. Contact</h2>
          <p>For questions regarding these Terms & Conditions:</p>
          <ul className="list-disc pl-6">
            <li><strong>Email:</strong> support@irisjev.example</li>
            <li><strong>Phone:</strong> +91 90000 12345</li>
            <li><strong>Address:</strong> 24, Temple Street, Chennai, Tamil Nadu – 600024</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
