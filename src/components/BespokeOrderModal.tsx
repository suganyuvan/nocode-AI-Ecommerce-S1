import React, { useState } from 'react';
import { BespokeInquiry } from '../types';

interface BespokeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitInquiry: (inquiry: BespokeInquiry) => void;
}

export const BespokeOrderModal: React.FC<BespokeOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitInquiry({
      id: `inquiry-${Date.now()}`,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      details,
      date: new Date().toISOString(),
      status: 'pending',
    });
    onClose();
    setName('');
    setEmail('');
    setPhone('');
    setDetails('');
    alert('Thank you for your inquiry. Our master artisans will review your request and contact you shortly.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-[#1c1b1b]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-[#fbf9f8] w-full max-w-lg shadow-2xl rounded-xs flex flex-col max-h-full border border-[#c4c7c7]/40">
        <div className="p-6 border-b border-[#c4c7c7]/40 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="font-display-lg text-2xl text-[#1c1b1b] italic">Custom Order Inquiry</h2>
          <button 
            onClick={onClose}
            className="text-[#444748] hover:text-[#1c1b1b] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <p className="text-sm text-[#444748] mb-6 font-body-md">
            Commission a unique masterpiece. Provide your contact information and details about your custom request, and our artisans will get back to you with a consultation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-label-caps uppercase tracking-widest text-[#444748] mb-1.5">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#c4c7c7] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#1c1b1b] transition-colors"
                placeholder="Your Name"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-widest text-[#444748] mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#c4c7c7] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#1c1b1b] transition-colors"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-widest text-[#444748] mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#c4c7c7] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#1c1b1b] transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-widest text-[#444748] mb-1.5">Project Details</label>
              <textarea 
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full border border-[#c4c7c7] bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-[#1c1b1b] transition-colors resize-none"
                placeholder="Describe the dimensions, wood preference, and design motifs for your custom piece..."
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-md mt-6"
            >
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
