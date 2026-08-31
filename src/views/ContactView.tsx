import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { sendContactInquiryEmail } from '../utils/resendEmailEngine';
import { dispatchWebhookEvent } from '../utils/webhookDispatcher';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Save to leads table in Supabase
      try {
        await supabase.from('newsletter_subscribers').insert([{
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }]);
      } catch (dbErr) {
        // ignore duplicate email in newsletter table
      }

      // 2. Dispatch Resend Email Alert to Customer & Admin
      await sendContactInquiryEmail({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim() || 'General Storefront Inquiry',
        message: message.trim(),
        inquiryType: 'Contact Us Inquiry'
      });

      // 3. Dispatch Webhook
      dispatchWebhookEvent('lead.created', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
        type: 'contact_form'
      });

      setIsSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setError('Failed to send inquiry: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 text-[#1b1c1c]">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-label-caps uppercase tracking-widest text-[#fed65b] bg-[#17201e] px-3.5 py-1 rounded-full border border-[#fed65b]/30">
          Heritage Concierge
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#111615] mt-3 font-bold">Contact Our Atelier</h1>
        <p className="text-sm text-[#747878] mt-2">
          Reach out for bespoke temple commissions, sculpture customization, or any order inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Contact Info Card */}
        <div className="lg:col-span-2 bg-[#17201e] text-white p-8 rounded-2xl border border-[#283634] shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-xl font-serif text-[#fed65b] font-bold mb-2">Irisjev Wooden Crafts</h3>
            <p className="text-xs text-[#a19f99] leading-relaxed">
              Sacred woodcarving heritage spanning generations. Our master artisans in Swamimalai & Madurai sculpt timeless treasures.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#fed65b] mt-0.5 shrink-0" />
              <div>
                <strong className="block text-[11px] font-label-caps uppercase text-[#747878] tracking-widest">Email Concierge</strong>
                <a href="mailto:support@irisjev.com" className="text-white hover:text-[#fed65b] transition-colors">
                  support@irisjev.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#fed65b] mt-0.5 shrink-0" />
              <div>
                <strong className="block text-[11px] font-label-caps uppercase text-[#747878] tracking-widest">Phone / WhatsApp</strong>
                <span className="text-white">+91 90000 12345</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#fed65b] mt-0.5 shrink-0" />
              <div>
                <strong className="block text-[11px] font-label-caps uppercase text-[#747878] tracking-widest">Registered Atelier</strong>
                <span className="text-white">24, Temple Street, Chennai, Tamil Nadu – 600024</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2a3a37] text-[11px] text-[#747878]">
            <p>GSTIN: 33MOCKIRISJEV1234Z1</p>
            <p className="text-emerald-400 mt-1">● Real-time Resend Email Notifications Active</p>
          </div>
        </div>

        {/* Right: Interactive Contact Form */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-[#ece8df] shadow-xl">
          {isSubmitted ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif text-[#111615] font-bold">Inquiry Transmitted</h3>
              <p className="text-sm text-[#747878] max-w-md mx-auto">
                Thank you for contacting Irisjev Wooden Crafts. A confirmation email has been sent via Resend, and our master artisans will reach out to you shortly.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-[#17201e] text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl hover:bg-[#283634] transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-[#111615] font-serif">Send an Inquiry</h3>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. S. Ramanathan"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#17201e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#17201e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#17201e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-600 font-bold mb-1">
                    Inquiry Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Custom Dancing Nataraja Sculpture"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#17201e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-gray-600 font-bold mb-1">
                  Message / Custom Requirements *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your desired dimensions, preferred timber (Teak/Rosewood/Sandalwood), or specific requirements..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#17201e] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#17201e] hover:bg-[#283634] text-white text-xs font-label-caps uppercase tracking-wider font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#fed65b]" />
                <span>{isSubmitting ? 'Transmitting to Atelier...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
