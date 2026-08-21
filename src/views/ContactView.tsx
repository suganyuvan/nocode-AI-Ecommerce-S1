import React from 'react';

export const ContactView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 text-[#1b1c1c]">
      <h1 className="text-4xl font-serif mb-8 text-center text-[#000000]">Contact Us</h1>
      <div className="bg-[#ffffff] p-8 md:p-12 border border-[#c4c7c7]/30">
        <div className="prose prose-stone max-w-none text-center">
          <p className="text-sm text-[#747878] italic mb-8 border-l-4 border-[#fed65b] pl-4 text-left">
            MOCK / TEST DATA — DEVELOPMENT USE ONLY<br/>
            Replace with your actual contact details.
          </p>
          <p className="mb-8">We would love to hear from you. For inquiries, commissions, or support, please reach out using the details below.</p>
          
          <div className="space-y-6 text-lg">
            <div>
              <strong className="block text-sm font-label-caps uppercase text-[#747878] tracking-widest mb-1">Company Name</strong>
              <span>IRISJEV Retail Ventures</span>
            </div>
            <div>
              <strong className="block text-sm font-label-caps uppercase text-[#747878] tracking-widest mb-1">Email</strong>
              <a href="mailto:support@irisjev.example" className="text-[#000000] underline">support@irisjev.example</a>
            </div>
            <div>
              <strong className="block text-sm font-label-caps uppercase text-[#747878] tracking-widest mb-1">Phone</strong>
              <span>+91 90000 12345</span>
            </div>
            <div>
              <strong className="block text-sm font-label-caps uppercase text-[#747878] tracking-widest mb-1">Registered Address</strong>
              <span>24, Temple Street, Chennai,<br/>Tamil Nadu – 600024</span>
            </div>
            <div>
              <strong className="block text-sm font-label-caps uppercase text-[#747878] tracking-widest mb-1">GSTIN</strong>
              <span>33MOCKIRISJEV1234Z1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
