import React, { useState } from 'react';

export const WholesaleExportView: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('Interior Designer / Architect');
  const [estimatedQuantity, setEstimatedQuantity] = useState('5-10 pieces / month');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-12 animate-fadeIn font-body-md">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-label-caps uppercase tracking-widest text-[#735c00] font-bold block">
          B2B Trade & Export Portal
        </span>
        <h1 className="font-display-lg text-4xl font-bold text-[#1b1c1c] italic">
          Wholesale & Interior Designer Partnership
        </h1>
        <p className="font-body-lg text-[#444748]">
          We partner with luxury interior designers, high-end hospitality projects, temple trusts, and boutique art galleries worldwide. Enjoy wholesale pricing, private labeling, and custom container shipments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Benefits */}
        <div className="lg:col-span-5 space-y-6 bg-[#f5f3f3] p-8 rounded-xs border border-[#e4e2e2]">
          <h3 className="font-headline-md font-bold text-xl text-[#1b1c1c]">
            Trade Account Privileges
          </h3>
          <ul className="space-y-4 text-xs font-body-md text-[#444748]">
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-[#735c00]">percent</span>
              <div>
                <strong className="text-[#1b1c1c] block">Tiered Wholesale Pricing</strong>
                Save up to 35% on volume orders and bulk mandapam commissions.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-[#735c00]">design_services</span>
              <div>
                <strong className="text-[#1b1c1c] block">Dedicated Sthapati Architect</strong>
                Direct 1-on-1 CAD design support for commercial hotel lobbies and luxury villas.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="material-symbols-outlined text-[#735c00]">public</span>
              <div>
                <strong className="text-[#1b1c1c] block">FOB & CIF Export Freight</strong>
                Fumigation certificates, phytosanitary clearance, and door-to-door shipping.
              </div>
            </li>
          </ul>
        </div>

        {/* Lead Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-xs border border-[#c4c7c7] space-y-4">
          <h3 className="font-headline-md font-bold text-xl text-[#1b1c1c]">
            Apply for Trade Account Access
          </h3>

          {submitted ? (
            <div className="bg-[#f5f3f3] p-6 text-center space-y-3 rounded-xs border border-[#fed65b]">
              <span className="material-symbols-outlined text-4xl text-[#735c00]">task_alt</span>
              <h4 className="font-headline-md font-bold text-lg text-[#1b1c1c]">
                Trade Application Received!
              </h4>
              <p className="text-xs text-[#444748]">
                Thank you, <strong>{contactName}</strong> ({businessName}). Our export manager will email your trade catalog rate card and tax-free export terms within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Atelier Luxury Interiors"
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram@atelier.com"
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  >
                    <option value="Interior Designer / Architect">Interior Designer / Architect</option>
                    <option value="Retail Art Gallery">Retail Art Gallery / Store</option>
                    <option value="Temple Trust / Religious Org">Temple Trust / Spiritual Org</option>
                    <option value="Hospitality Project">Resort / Hospitality Project</option>
                    <option value="Export Importer">International Importer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps uppercase text-[#444748] mb-1 font-bold">
                    Estimated Annual Volume
                  </label>
                  <select
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                    className="w-full p-2.5 border border-[#c4c7c7] rounded-xs bg-white text-xs"
                  >
                    <option value="1-5 pieces / year">1-5 pieces / year</option>
                    <option value="5-10 pieces / month">5-10 pieces / month</option>
                    <option value="10+ pieces / month">10+ pieces / month (Container basis)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1c1b1b] text-white font-label-caps text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer"
              >
                Submit Trade Application
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
