import { JsonLd, SchemaType } from '../../types/seo';
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  AUTHOR_NAME,
  AUTHOR_EMAIL,
  AUTHOR_PHONE,
  GEO_LOCATION,
  SOCIAL_PROFILES,
  BRAND_NAME
} from '../../constants/seo';

/**
 * Pure helper to construct standard Schema.org JSON-LD object.
 */
export function createJsonLd(type: SchemaType | SchemaType[], data: Record<string, unknown>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };
}

/**
 * Organization & LocalBusiness / Store Schema (with Mysore Geo Coordinates & Contact points)
 */
export function storeOrganizationJsonLd(baseUrl = SITE_URL): JsonLd {
  return createJsonLd(['Store', 'Organization'], {
    '@id': `${baseUrl}/#store`,
    name: SITE_NAME,
    legalName: AUTHOR_NAME,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
      slogan: 'Ancient Artistry for Modern Spaces'
    },
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/favicon.svg`,
      caption: 'Swarna Wooden Crafts Logo'
    },
    image: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: SITE_DESCRIPTION,
    telephone: AUTHOR_PHONE,
    email: AUTHOR_EMAIL,
    priceRange: '₹₹₹',
    currenciesAccepted: 'INR, USD, EUR, GBP, AED',
    paymentAccepted: 'Credit Card, Debit Card, Net Banking, UPI, International Wire Transfer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: GEO_LOCATION.streetAddress,
      addressLocality: GEO_LOCATION.placename,
      addressRegion: 'Karnataka',
      postalCode: GEO_LOCATION.postalCode,
      addressCountry: GEO_LOCATION.country
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: GEO_LOCATION.latitude,
      longitude: GEO_LOCATION.longitude
    },
    hasMap: 'https://maps.google.com/?q=Mysore+Karnataka+India',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00'
      }
    ],
    sameAs: SOCIAL_PROFILES,
    knowsAbout: [
      'Temple Architecture',
      'Sacred Hindu Iconography',
      'Teakwood Wood Carving',
      'Rosewood Artisanship',
      'Bespoke Pooja Mandir Shrine Design',
      'Indian Heritage Handicrafts'
    ]
  });
}

/**
 * WebSite Schema with Sitelinks SearchAction for Rich SERP display
 */
export function websiteJsonLd(baseUrl = SITE_URL): JsonLd {
  return createJsonLd('WebSite', {
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE_NAME,
    alternateName: ['Swarna Crafts', 'IrisJev Crafts', 'Swarna Wooden Crafts'],
    description: SITE_DESCRIPTION,
    publisher: {
      '@id': `${baseUrl}/#store`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?tab=shop&search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'en-IN'
  });
}

/**
 * Product Schema for rich SERP stars, price ranges, in-stock badges and dimensions
 */
export function productJsonLd(
  product: {
    id: string;
    name: string;
    category?: string;
    priceINR?: number;
    priceUSD?: number;
    image?: string;
    galleryImages?: string[];
    description?: string;
    shortDescription?: string;
    dimensions?: string;
    material?: string;
    rating?: number | string;
    reviewCount?: number;
    isBestSeller?: boolean;
    isLimitedEdition?: boolean;
  },
  baseUrl = SITE_URL
): JsonLd {
  const productUrl = `${baseUrl}/?tab=product-detail&id=${product.id}`;
  const price = product.priceINR || 50000;
  const ratingValue = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 4.9);
  const reviewCount = product.reviewCount || 12;

  const images = [
    product.image,
    ...(product.galleryImages || [])
  ].filter(Boolean) as string[];

  return createJsonLd('Product', {
    '@id': productUrl,
    name: product.name,
    image: images.length > 0 ? images : [`${baseUrl}/favicon.svg`],
    description: product.description || product.shortDescription || `${product.name} - Handcrafted sanctified wooden masterpiece from Swarna Wooden Crafts.`,
    sku: `SWC-${product.id}`,
    mpn: `MPN-${product.id.toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME
    },
    category: product.category || 'Wooden Sculptures',
    material: product.material || 'Solid Seasoned Teak / Rosewood',
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: price.toString(),
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'd'
          }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, ratingValue)).toFixed(1),
      reviewCount: reviewCount,
      bestRating: '5',
      worstRating: '1'
    }
  });
}

/**
 * BreadcrumbList Schema for Google rich breadcrumb navigation in SERP
 */
export function breadcrumbListJsonLd(
  items: Array<{ name: string; url: string }>,
  baseUrl = SITE_URL
): JsonLd {
  return createJsonLd('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`
    }))
  });
}

/**
 * FAQPage Schema for Q&A rich snippets and AEO citation
 */
export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>): JsonLd {
  return createJsonLd('FAQPage', {
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  });
}
