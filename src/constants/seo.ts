import { GeoLocationConfig, SeoSettingsRecord } from '../types/seo';

// Base Site URL (normalized without trailing slash)
export const SITE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  'https://swarnawoodencrafts.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'Swarna Wooden Crafts | IrisJev Heritage Studios';
export const SITE_SHORT_NAME = 'Swarna Wooden Crafts';
export const BRAND_NAME = 'IrisJev';
export const SITE_HANDLE = '@swarnawoodcrafts';
export const SITE_LOCALE = 'en_IN';
export const SITE_LANGUAGE = 'en';

export const SITE_TITLE_DEFAULT = 'Swarna Wooden Crafts | Sanctified Temple Architecture & Handcrafted Wood Sculptures';
export const SITE_TITLE_TEMPLATE = '%s | Swarna Wooden Crafts';

export const SITE_DESCRIPTION =
  'India’s premier atelier for handcrafted wooden temple doors, sacred god sculptures, bespoke home mandapams, and heritage rosewood & teakwood wall panels. Certified authentic artisan craftsmanship shipped worldwide with museum-grade crating.';

export const SITE_KEYWORDS = [
  'Wooden Crafts India',
  'Handcrafted Wood Sculptures',
  'Wooden Temple Doors',
  'Temple Mandapam Shrine',
  'Lord Ganesha Wooden Statue',
  'Lord Nataraja Wall Mount',
  'Teak Wood Carvings',
  'Mysore Heritage Wood Crafts',
  'Sanctified Pooja Mandir',
  'Sacred Indian Temple Architecture',
  'Rosewood Wall Panels',
  'Bespoke Wood Carvings',
  'Handmade Hindu Deities',
  'Export Quality Wood Crafts India'
];

export const AUTHOR_NAME = 'Irisjev Heritage Craft Studios';
export const AUTHOR_EMAIL = 'contact@irisjev.com';
export const AUTHOR_PHONE = '+91 98765 43210';
export const AUTHOR_WHATSAPP = '+919876543210';

export const OG_IMAGE_DEFAULT = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Geo / Local Business Constants for Mysore Heritage Zone
export const GEO_LOCATION: GeoLocationConfig = {
  placename: 'Mysore',
  region: 'IN-KA', // Karnataka, India ISO 3166-2
  country: 'IN',
  latitude: 12.295810,
  longitude: 76.639380,
  postalCode: '570001',
  streetAddress: 'Craft Studio Rd, Mysore Heritage Zone, Karnataka - 570001',
  dispatchHubName: 'Irisjev Heritage Craft Studios'
};

// Verification & Analytics Identifiers
export const GOOGLE_SITE_VERIFICATION = 'google-site-verification-token';
export const BING_SITE_VERIFICATION = 'bing-site-verification-token';
export const GOOGLE_ANALYTICS_ID = 'G-961J4BE41D';
export const MICROSOFT_CLARITY_ID = 'ybn8gumneg';
export const META_PIXEL_ID = '1019531494462407';

// Social Profiles & Citations for GEO Authority (Entity Linking)
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/irisjevcrafts',
  'https://www.facebook.com/irisjevcrafts',
  'https://www.youtube.com/@irisjevcrafts',
  'https://www.pinterest.com/irisjevcrafts'
];

// Default Database Settings fallback
export const DEFAULT_SEO_SETTINGS: SeoSettingsRecord = {
  id: 1,
  site_title: SITE_TITLE_DEFAULT,
  title_template: SITE_TITLE_TEMPLATE,
  meta_description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  canonical_base_url: SITE_URL,
  og_image_url: OG_IMAGE_DEFAULT,
  geo_placename: GEO_LOCATION.placename,
  geo_region: GEO_LOCATION.region,
  geo_country: GEO_LOCATION.country,
  geo_latitude: GEO_LOCATION.latitude,
  geo_longitude: GEO_LOCATION.longitude,
  geo_postal_code: GEO_LOCATION.postalCode,
  geo_street_address: GEO_LOCATION.streetAddress,
  business_phone: AUTHOR_PHONE,
  business_email: AUTHOR_EMAIL,
  google_site_verification: GOOGLE_SITE_VERIFICATION,
  bing_site_verification: BING_SITE_VERIFICATION,
  enable_ai_crawlers: true
};
