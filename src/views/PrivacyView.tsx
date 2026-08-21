import React from 'react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 text-[#1b1c1c]">
      <h1 className="text-4xl font-serif mb-8 text-center text-[#000000]">Privacy Policy</h1>
      <div className="bg-[#ffffff] p-8 md:p-12 border border-[#c4c7c7]/30">
        <div className="prose prose-stone max-w-none">
          <p className="text-sm text-[#747878] italic mb-8 border-l-4 border-[#fed65b] pl-4">
            MOCK / TEST DATA — DEVELOPMENT USE ONLY<br/>
            Replace with your actual privacy policy.
          </p>
          <p><strong>Last Updated:</strong> 21 August 2026</p>
          <p>At <strong>IRISJEV</strong>, we are committed to protecting your personal information and your right to privacy.</p>
          
          <h2 className="text-xl font-serif mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect personal information that you provide to us, such as name, address, contact information, passwords and security data, and payment information.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and/or your consent.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">3. Information Sharing</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

          <h2 className="text-xl font-serif mt-8 mb-4">4. Contact Us</h2>
          <p>If you have questions or comments about this policy, you may email us at support@irisjev.example or by post to:</p>
          <p>
            IRISJEV Retail Ventures<br/>
            24, Temple Street, Chennai, Tamil Nadu – 600024
          </p>
        </div>
      </div>
    </div>
  );
};
