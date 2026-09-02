export type SchemaType =
  | 'Organization'
  | 'LocalBusiness'
  | 'Store'
  | 'WebSite'
  | 'WebPage'
  | 'Product'
  | 'Offer'
  | 'AggregateRating'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'Article'
  | 'ItemPage'
  | 'CollectionPage';

export interface RouteDescriptor {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  indexable?: boolean;
  productData?: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    sku?: string;
    rating?: number;
    reviewCount?: number;
    category?: string;
    material?: string;
    dimensions?: string;
    availability?: 'InStock' | 'PreOrder' | 'OutOfStock';
  };
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

export interface RobotsConfig {
  rules: Array<{
    userAgent: string;
    allow?: string[];
    disallow?: string[];
  }>;
  sitemaps: string[];
  host?: string;
}

export interface GeoLocationConfig {
  placename: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  postalCode: string;
  streetAddress: string;
  dispatchHubName: string;
}

export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': SchemaType | SchemaType[];
  [key: string]: unknown;
}

export interface SeoSettingsRecord {
  id?: number;
  site_title: string;
  title_template: string;
  meta_description: string;
  keywords: string[];
  canonical_base_url: string;
  og_image_url: string;
  geo_placename: string;
  geo_region: string;
  geo_country: string;
  geo_latitude: number;
  geo_longitude: number;
  geo_postal_code: string;
  geo_street_address: string;
  business_phone: string;
  business_email: string;
  google_site_verification: string;
  bing_site_verification: string;
  enable_ai_crawlers: boolean;
  custom_robots_txt?: string;
  updated_at?: string;
}
