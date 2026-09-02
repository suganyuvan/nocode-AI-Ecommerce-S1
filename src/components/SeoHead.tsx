import React, { useEffect, useState } from 'react';
import { Product, ActiveTab } from '../types';
import { SeoSettingsRecord, JsonLd } from '../types/seo';
import { supabase } from '../utils/supabaseClient';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  OG_IMAGE_DEFAULT,
  GEO_LOCATION,
  AUTHOR_NAME,
  DEFAULT_SEO_SETTINGS
} from '../constants/seo';
import {
  canonicalUrl,
  buildMetadata,
  storeOrganizationJsonLd,
  websiteJsonLd,
  productJsonLd,
  breadcrumbListJsonLd,
  faqPageJsonLd
} from '../services/seo';

interface SeoHeadProps {
  activeTab: ActiveTab;
  selectedProduct?: Product | null;
}

export function SeoHead({ activeTab, selectedProduct }: SeoHeadProps) {
  const [seoSettings, setSeoSettings] = useState<SeoSettingsRecord>(DEFAULT_SEO_SETTINGS);

  // 1. Fetch dynamic backend SEO settings from Supabase if available
  useEffect(() => {
    async function loadSeoSettings() {
      try {
        const { data, error } = await supabase
          .from('seo_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data && !error) {
          setSeoSettings((prev) => ({
            ...prev,
            ...data,
            keywords: Array.isArray(data.keywords) ? data.keywords : prev.keywords
          }));
        }
      } catch (err) {
        // Fallback gracefully to default constants
      }
    }
    loadSeoSettings();
  }, []);

  // 2. Compute dynamic metadata and JSON-LD structured data on route/tab change
  useEffect(() => {
    const baseUrl = seoSettings.canonical_base_url || SITE_URL;
    let title = seoSettings.site_title || SITE_TITLE_DEFAULT;
    let description = seoSettings.meta_description || SITE_DESCRIPTION;
    let ogImage = seoSettings.og_image_url || OG_IMAGE_DEFAULT;
    let ogType: 'website' | 'article' | 'product' = 'website';
    let path = '/';
    let jsonLdPayload: JsonLd[] = [];

    switch (activeTab) {
      case 'home':
        path = '/';
        title = seoSettings.site_title || SITE_TITLE_DEFAULT;
        description = seoSettings.meta_description || SITE_DESCRIPTION;
        jsonLdPayload = [
          storeOrganizationJsonLd(baseUrl),
          websiteJsonLd(baseUrl),
          breadcrumbListJsonLd([{ name: 'Home', url: baseUrl }], baseUrl)
        ];
        break;

      case 'shop':
        path = '/?tab=shop';
        title = 'Heritage Handcrafted Collections | Swarna Wooden Crafts';
        description =
          'Explore sanctified wooden sculptures, intricate mandala panels, deity idols, and bespoke temple carvings hand-chiseled from authentic Indian teakwood & rosewood.';
        jsonLdPayload = [
          websiteJsonLd(baseUrl),
          breadcrumbListJsonLd(
            [
              { name: 'Home', url: baseUrl },
              { name: 'Shop Collections', url: `${baseUrl}/?tab=shop` }
            ],
            baseUrl
          )
        ];
        break;

      case 'product-detail':
        if (selectedProduct) {
          path = `/?tab=product-detail&id=${selectedProduct.id}`;
          title = `${selectedProduct.name} - Solid Wood Handcrafted Masterpiece`;
          description =
            selectedProduct.shortDescription ||
            selectedProduct.description ||
            `Certified authentic hand-carved ${selectedProduct.name} from Swarna Wooden Crafts. Sanctified, beeswax polished, and crated for worldwide insured delivery.`;
          ogImage = selectedProduct.image || ogImage;
          ogType = 'product';

          jsonLdPayload = [
            productJsonLd(
              {
                id: selectedProduct.id,
                name: selectedProduct.name,
                category: selectedProduct.category,
                priceINR: selectedProduct.priceINR,
                priceUSD: selectedProduct.priceUSD,
                image: selectedProduct.image,
                galleryImages: selectedProduct.galleryImages,
                description: selectedProduct.description,
                shortDescription: selectedProduct.shortDescription,
                dimensions: selectedProduct.dimensions,
                material: selectedProduct.material,
                rating: selectedProduct.rating,
                reviewCount: selectedProduct.reviewCount
              },
              baseUrl
            ),
            breadcrumbListJsonLd(
              [
                { name: 'Home', url: baseUrl },
                { name: selectedProduct.category || 'Sculptures', url: `${baseUrl}/?tab=shop` },
                { name: selectedProduct.name, url: `${baseUrl}/?tab=product-detail&id=${selectedProduct.id}` }
              ],
              baseUrl
            )
          ];
        }
        break;

      case 'temple-projects':
        path = '/?tab=temple-projects';
        title = 'Sacred Temple Architecture & Custom Mandapam Shrines';
        description =
          'Specialized craftsmanship in traditional Indian temple architecture, sanctified garbhagriha doors, vimanams, and residential pooja mandapam commissions.';
        jsonLdPayload = [
          breadcrumbListJsonLd(
            [
              { name: 'Home', url: baseUrl },
              { name: 'Temple Projects', url: `${baseUrl}/?tab=temple-projects` }
            ],
            baseUrl
          )
        ];
        break;

      case 'about':
        path = '/?tab=about';
        title = 'Our Heritage & Artisan Lineage | IrisJev Studios';
        description =
          'Discover our centuries-old artisan lineage of master woodcarvers preserving authentic Indian temple sculpting techniques in Mysore, Karnataka.';
        jsonLdPayload = [
          storeOrganizationJsonLd(baseUrl),
          breadcrumbListJsonLd(
            [
              { name: 'Home', url: baseUrl },
              { name: 'About Us', url: `${baseUrl}/?tab=about` }
            ],
            baseUrl
          )
        ];
        break;

      case 'care-guide':
        path = '/?tab=care-guide';
        title = 'Sculpture Care, Preservation & Polishing Guide';
        description =
          'Expert guidelines for preserving heirloom teak and rosewood sculptures against humidity, temperature changes, and natural patina maintenance.';
        jsonLdPayload = [
          faqPageJsonLd([
            {
              question: 'How do I clean dust from intricate wooden carvings?',
              answer: 'Use a soft natural bristle brush or a clean microfiber cloth. Never use harsh chemical sprays or water on raw seasoned wood.'
            },
            {
              question: 'How often should beeswax wood polish be applied?',
              answer: 'We recommend applying natural organic beeswax once every 6 to 12 months to nourish the wood and maintain its deep lustrous grain.'
            },
            {
              question: 'Can I place wooden sculptures in direct outdoor sunlight?',
              answer: 'Prolonged direct UV exposure will dry out natural wood oils. Keep sculptures indoors or in covered shaded mandapams away from direct rain and harsh sun.'
            }
          ]),
          breadcrumbListJsonLd(
            [
              { name: 'Home', url: baseUrl },
              { name: 'Care Guide', url: `${baseUrl}/?tab=care-guide` }
            ],
            baseUrl
          )
        ];
        break;

      case 'wholesale-export':
        path = '/?tab=wholesale-export';
        title = 'Wholesale Orders & International Export Crating';
        description =
          'Global export of handcrafted wooden temple doors and statues with phytosanitary certification, fumigation, and shockproof museum-grade crating.';
        jsonLdPayload = [
          breadcrumbListJsonLd(
            [
              { name: 'Home', url: baseUrl },
              { name: 'Wholesale & Export', url: `${baseUrl}/?tab=wholesale-export` }
            ],
            baseUrl
          )
        ];
        break;

      case 'shipping':
        path = '/?tab=shipping';
        title = 'Insured Transit & White-Glove Delivery Policy';
        description =
          'Comprehensive shipping timelines, courier tracking, and 100% full-value insured transit for all domestic and international shipments.';
        break;

      case 'refund':
        path = '/?tab=refund';
        title = 'Cancellation, Return & Replacement Policy';
        description =
          'Our transparent 7-day transit damage replacement guarantee and cancellation policies for heirloom handcrafted wood sculptures.';
        break;

      case 'terms':
        path = '/?tab=terms';
        title = 'Terms & Conditions of Service';
        description = 'Official terms of purchase, natural material variations, and legal guidelines for Swarna Wooden Crafts.';
        break;

      case 'privacy':
        path = '/?tab=privacy';
        title = 'Privacy Policy & Data Security';
        description = 'How Swarna Wooden Crafts protects your personal data, transaction security, and communication preferences.';
        break;

      case 'contact':
        path = '/?tab=contact';
        title = 'Contact Master Sculptors | Atelier Inquiries';
        description =
          'Direct consultation with our master woodcarvers in Mysore for bespoke idol commissions, temple doors, and pooja shrines.';
        break;

      case 'track':
        path = '/?tab=track';
        title = 'Live Consignment Tracking';
        description = 'Track real-time shipment status and dispatch updates for your Swarna Wooden Crafts order.';
        break;

      default:
        break;
    }

    const canonical = canonicalUrl(path, baseUrl);
    const meta = buildMetadata({ path, title, description, ogImage, ogType }, seoSettings);

    // Apply document title
    document.title = meta.title;

    // Helper to safely set or create a <meta> tag
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', meta.description);
    setMetaTag('name', 'keywords', (meta.keywords || SITE_KEYWORDS).join(', '));
    setMetaTag('name', 'robots', meta.indexable ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow');
    setMetaTag('name', 'author', AUTHOR_NAME);

    // Geo Meta Tags (Critical for GEO & Local SEO Mysore)
    setMetaTag('name', 'geo.region', seoSettings.geo_region || GEO_LOCATION.region);
    setMetaTag('name', 'geo.placename', seoSettings.geo_placename || GEO_LOCATION.placename);
    setMetaTag('name', 'geo.position', `${seoSettings.geo_latitude || GEO_LOCATION.latitude};${seoSettings.geo_longitude || GEO_LOCATION.longitude}`);
    setMetaTag('name', 'ICBM', `${seoSettings.geo_latitude || GEO_LOCATION.latitude}, ${seoSettings.geo_longitude || GEO_LOCATION.longitude}`);

    // Open Graph Meta Tags
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:image', meta.ogImage || OG_IMAGE_DEFAULT);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag('property', 'og:type', meta.ogType || 'website');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:locale', 'en_IN');

    // Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:image', meta.ogImage || OG_IMAGE_DEFAULT);
    setMetaTag('name', 'twitter:site', '@swarnawoodcrafts');

    // Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // JSON-LD Structured Data Script Injection
    let jsonLdScript = document.getElementById('dynamic-jsonld-schema') as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'dynamic-jsonld-schema';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }

    if (jsonLdPayload.length > 0) {
      jsonLdScript.textContent = JSON.stringify(
        jsonLdPayload.length === 1 ? jsonLdPayload[0] : jsonLdPayload
      );
    } else {
      jsonLdScript.textContent = JSON.stringify(websiteJsonLd(baseUrl));
    }
  }, [activeTab, selectedProduct, seoSettings]);

  return null;
}
