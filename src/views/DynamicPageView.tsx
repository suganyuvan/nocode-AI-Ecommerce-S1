import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { AboutView } from './AboutView';
import { TempleProjectsView } from './TempleProjectsView';
import { WholesaleExportView } from './WholesaleExportView';
import { CareGuideView } from './CareGuideView';
import { TermsView } from './TermsView';
import { PrivacyView } from './PrivacyView';
import { RefundView } from './RefundView';
import { ShippingView } from './ShippingView';
import { FileText, ArrowLeft, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface DynamicPageViewProps {
  onOpenBespoke?: () => void;
}

export const DynamicPageView: React.FC<DynamicPageViewProps> = ({ onOpenBespoke }) => {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = (slug || '').toLowerCase().trim();

  const [dbPageContent, setDbPageContent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check built-in pages first
    const isBuiltIn = [
      'about', 'about-us',
      'temple-projects',
      'wholesale-export',
      'care-guide',
      'terms', 'terms-and-conditions',
      'privacy', 'privacy-policy',
      'refund', 'refund-policy',
      'shipping', 'shipping-policy'
    ].includes(normalizedSlug);

    if (isBuiltIn) {
      setLoading(false);
      return;
    }

    // Otherwise fetch dynamic page content from Supabase
    async function fetchDynamicPage() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('page_content')
          .select('*')
          .eq('section', `page_${normalizedSlug}`)
          .maybeSingle();

        if (data && !error) {
          setDbPageContent(data.content);
        } else {
          setDbPageContent(null);
        }
      } catch (err) {
        setDbPageContent(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDynamicPage();
  }, [normalizedSlug]);

  // Handle standard static built-in slugs
  if (normalizedSlug === 'about' || normalizedSlug === 'about-us') {
    return <AboutView setActiveTab={() => {}} onOpenBespoke={onOpenBespoke} />;
  }
  if (normalizedSlug === 'temple-projects') {
    return <TempleProjectsView setActiveTab={() => {}} />;
  }
  if (normalizedSlug === 'wholesale-export') {
    return <WholesaleExportView />;
  }
  if (normalizedSlug === 'care-guide') {
    return <CareGuideView />;
  }
  if (normalizedSlug === 'terms' || normalizedSlug === 'terms-and-conditions') {
    return <TermsView />;
  }
  if (normalizedSlug === 'privacy' || normalizedSlug === 'privacy-policy') {
    return <PrivacyView />;
  }
  if (normalizedSlug === 'refund' || normalizedSlug === 'refund-policy') {
    return <RefundView />;
  }
  if (normalizedSlug === 'shipping' || normalizedSlug === 'shipping-policy') {
    return <ShippingView />;
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#fbf9f8]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#fed65b] border-t-[#1c1b1b] rounded-full animate-spin mx-auto"></div>
          <p className="font-label-caps uppercase tracking-widest text-xs font-bold text-[#444748]">
            Loading Page...
          </p>
        </div>
      </div>
    );
  }

  // Dynamic CMS Page Rendered from Supabase
  if (dbPageContent) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-12 space-y-8 animate-fadeIn font-body-md">
        <div className="border-b border-[#c4c7c7]/40 pb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#735c00] hover:text-[#1c1b1b] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="font-display-lg text-3xl md:text-4xl font-bold text-[#1b1c1c] capitalize">
            {dbPageContent.title || normalizedSlug.replace(/-/g, ' ')}
          </h1>
          {dbPageContent.subtitle && (
            <p className="text-sm text-[#444748] mt-2 font-body-md leading-relaxed">
              {dbPageContent.subtitle}
            </p>
          )}
        </div>

        <div className="prose prose-amber max-w-none text-[#1b1c1c] leading-relaxed space-y-6">
          {dbPageContent.body ? (
            <div dangerouslySetInnerHTML={{ __html: dbPageContent.body }} />
          ) : (
            <p className="text-sm text-[#444748]">{JSON.stringify(dbPageContent)}</p>
          )}
        </div>
      </div>
    );
  }

  // 404 Page Not Found Fallback
  return (
    <div className="max-w-[800px] mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 bg-[#fed65b]/20 text-[#735c00] rounded-full flex items-center justify-center mx-auto">
        <FileText className="w-8 h-8" />
      </div>
      <h1 className="font-display-lg text-3xl font-bold text-[#1b1c1c]">Page Not Found</h1>
      <p className="text-sm text-[#444748] max-w-md mx-auto leading-relaxed">
        The custom page <code className="bg-[#e9e8e7] px-2 py-0.5 rounded text-xs">/pages/{normalizedSlug}</code> could not be found or has not been published yet in the Admin Page Builder.
      </p>
      <div className="pt-4 flex justify-center gap-4">
        <Link
          to="/"
          className="bg-[#1c1b1b] text-white px-6 py-2.5 text-xs font-label-caps uppercase tracking-widest font-bold hover:bg-[#313030] transition-colors rounded-xs"
        >
          Return Home
        </Link>
        <Link
          to="/shop"
          className="border border-[#1c1b1b] text-[#1c1b1b] px-6 py-2.5 text-xs font-label-caps uppercase tracking-widest font-bold hover:bg-[#1c1b1b] hover:text-white transition-colors rounded-xs"
        >
          Explore Shop
        </Link>
      </div>
    </div>
  );
};
