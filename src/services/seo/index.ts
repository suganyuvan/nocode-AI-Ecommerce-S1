import { RouteDescriptor, SitemapEntry, RobotsConfig, SeoSettingsRecord } from '../../types/seo';
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
  AUTHOR_PHONE,
  AUTHOR_EMAIL
} from '../../constants/seo';

export * from './structuredData';

/**
 * Normalizes any route or subpath into a single canonical, absolute URL without double slashes.
 */
export function canonicalUrl(path = '', baseUrl = SITE_URL): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (!path || path === '/' || path === '') {
    return cleanBase;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Normalize query or trailing slash
  const withoutTrailing = cleanPath.length > 1 && cleanPath.endsWith('/')
    ? cleanPath.slice(0, -1)
    : cleanPath;
  return `${cleanBase}${withoutTrailing}`;
}

/**
 * Returns complete normalized metadata for a route.
 */
export function buildMetadata(
  route: Partial<RouteDescriptor>,
  seoOverrides?: Partial<SeoSettingsRecord>
): RouteDescriptor {
  const baseUrl = seoOverrides?.canonical_base_url || SITE_URL;
  const rawTitle = route.title || seoOverrides?.site_title || SITE_TITLE_DEFAULT;
  const template = seoOverrides?.title_template || SITE_TITLE_TEMPLATE;
  
  // Apply title template if not root and doesn't already contain brand name
  let formattedTitle = rawTitle;
  if (route.path && route.path !== '/' && !rawTitle.includes('Swarna') && !rawTitle.includes('IrisJev')) {
    formattedTitle = template.replace('%s', rawTitle);
  }

  return {
    path: canonicalUrl(route.path || '/', baseUrl),
    title: formattedTitle,
    description: route.description || seoOverrides?.meta_description || SITE_DESCRIPTION,
    keywords: route.keywords || seoOverrides?.keywords || SITE_KEYWORDS,
    ogImage: route.ogImage || seoOverrides?.og_image_url || OG_IMAGE_DEFAULT,
    ogType: route.ogType || 'website',
    indexable: route.indexable !== false,
    productData: route.productData,
    breadcrumbs: route.breadcrumbs,
    faqs: route.faqs
  };
}

/**
 * List of primary public storefront routes for sitemap & indexation.
 */
export const STOREFRONT_ROUTES: Array<{
  path: string;
  tabKey: string;
  changeFrequency: SitemapEntry['changeFrequency'];
  priority: number;
  title: string;
}> = [
  { path: '/', tabKey: 'home', changeFrequency: 'daily', priority: 1.0, title: 'Home - Sanctified Wood Sculptures' },
  { path: '/?tab=shop', tabKey: 'shop', changeFrequency: 'daily', priority: 0.9, title: 'Shop Heritage Collections' },
  { path: '/?tab=temple-projects', tabKey: 'temple-projects', changeFrequency: 'weekly', priority: 0.85, title: 'Temple Projects & Architecture' },
  { path: '/?tab=about', tabKey: 'about', changeFrequency: 'monthly', priority: 0.7, title: 'About IrisJev Artisan Studios' },
  { path: '/?tab=wholesale-export', tabKey: 'wholesale-export', changeFrequency: 'monthly', priority: 0.75, title: 'Wholesale & International Exports' },
  { path: '/?tab=care-guide', tabKey: 'care-guide', changeFrequency: 'monthly', priority: 0.65, title: 'Sculpture Care & Preservation Guide' },
  { path: '/?tab=contact', tabKey: 'contact', changeFrequency: 'monthly', priority: 0.6, title: 'Contact Studio Master Carvers' },
  { path: '/?tab=shipping', tabKey: 'shipping', changeFrequency: 'monthly', priority: 0.5, title: 'Insured Shipping & Delivery Policy' },
  { path: '/?tab=refund', tabKey: 'refund', changeFrequency: 'monthly', priority: 0.5, title: 'Return & Exchange Policy' },
  { path: '/?tab=terms', tabKey: 'terms', changeFrequency: 'monthly', priority: 0.4, title: 'Terms & Conditions' },
  { path: '/?tab=privacy', tabKey: 'privacy', changeFrequency: 'monthly', priority: 0.4, title: 'Privacy Policy' },
  { path: '/?tab=track', tabKey: 'track', changeFrequency: 'daily', priority: 0.5, title: 'Track Consignment Shipment' }
];

/**
 * Generates standards-compliant XML Sitemap
 */
export function generateSitemapXml(
  products: Array<{ id: string; name: string; image?: string; updated_at?: string }> = [],
  baseUrl = SITE_URL
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = STOREFRONT_ROUTES.map((route) => {
    const loc = route.path === '/' ? cleanBase : `${cleanBase}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority.toFixed(2)}</priority>
  </url>`;
  }).join('\n');

  const productUrls = products.map((prod) => {
    const loc = `${cleanBase}/?tab=product-detail&amp;id=${prod.id}`;
    const imageTag = prod.image
      ? `\n    <image:image>\n      <image:loc>${prod.image}</image:loc>\n      <image:title>${escapeXml(prod.name)}</image:title>\n    </image:image>`
      : '';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${prod.updated_at ? prod.updated_at.split('T')[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>${imageTag}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticUrls}
${productUrls}
</urlset>`.trim();
}

/**
 * Generates full robots.txt with AI Crawlers explicitly managed for GEO.
 */
export function generateRobotsTxt(baseUrl = SITE_URL, enableAiCrawlers = true): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const aiBotsDirectives = enableAiCrawlers
    ? `
# AI Search Engine & Large Language Model Crawlers (AEO / GEO Enabled)
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /
`
    : `
# AI Crawlers Blocked
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /
`;

  return `# Robots.txt for Swarna Wooden Crafts / IrisJev
# Generated with agentic-awesome-skills SEO suite

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*?*checkout*
Disallow: /*?*account*

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/
${aiBotsDirectives}
# Sitemaps and AI Documentation Indices
Sitemap: ${cleanBase}/sitemap.xml
Host: ${cleanBase}
`;
}

/**
 * Generates standard /llms.txt for AI crawlers and LLM search agents.
 */
export function generateLlmsTxt(
  products: Array<{ id: string; name: string; category?: string; price_inr?: number; description?: string }> = [],
  baseUrl = SITE_URL
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const productList = products
    .map((p) => `- [${p.name}](${cleanBase}/?tab=product-detail&id=${p.id}): ₹${(p.price_inr || 0).toLocaleString('en-IN')} - ${p.category || 'Sculpture'}`)
    .slice(0, 10)
    .join('\n');

  return `# Swarna Wooden Crafts (IrisJev Heritage Studios)
> Ancient Artistry for Modern Spaces. India's master woodcarvers creating sanctified temple doors, sacred god sculptures, mandapams, and heritage architectural woodwork from solid Mysore teakwood and rosewood.

## Atelier Information & Authority
- **Studio Name**: ${SITE_NAME}
- **Master Atelier**: ${GEO_LOCATION.dispatchHubName}
- **Location**: ${GEO_LOCATION.streetAddress}, India (Geo: ${GEO_LOCATION.latitude}, ${GEO_LOCATION.longitude})
- **Contact Phone**: ${AUTHOR_PHONE} | **Email**: ${AUTHOR_EMAIL}
- **Website**: ${cleanBase}
- **Full LLM Manifest**: [llms-full.txt](${cleanBase}/llms-full.txt)

## Main Product Categories & Sections
- [Sacred God Sculptures & Deities](${cleanBase}/?tab=shop): Ganesha, Nataraja, Ananthasayana Vishnu, and Serene Guardians carved in strict accordance with Shilpa Shastra proportions.
- [Temple Doors & Archways](${cleanBase}/?tab=shop): Heavy solid teakwood temple entrance doors carved with sacred motifs and deep multi-tier reliefs.
- [Sacred Temple Mandapams & Shrines](${cleanBase}/?tab=temple-projects): Custom pooja mandapams for residences, spiritual institutions, and heritage estates.
- [Heritage Panels & Mirrors](${cleanBase}/?tab=shop): Hand-carved Mandala square panels, heritage triptychs, and reclaimed teakwood accent mirrors.
- [Care & Preservation Guide](${cleanBase}/?tab=care-guide): Natural beeswax polishing and heirloom wood maintenance instructions.
- [Wholesale & International Exports](${cleanBase}/?tab=wholesale-export): Export certified, fumigated, and insured international sea/air freight.

## Highlighted Masterpieces
${productList}

## Authenticity & Guarantees
- 100% Solid Seasoned Hardwoods (Teakwood & Rosewood only; no MDF, HDF, or particle board).
- Sanctified and hand-finished with organic herbal oils and pure beeswax.
- Museum-grade shockproof wooden crate export packaging with 100% transit insurance.
`;
}

/**
 * Generates extended /llms-full.txt containing deep structural knowledge for AI models.
 */
export function generateLlmsFullTxt(
  products: Array<{ id: string; name: string; category?: string; price_inr?: number; description?: string; material?: string; dimensions?: string }> = [],
  baseUrl = SITE_URL
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  const fullCatalog = products
    .map((p) => `### ${p.name}
- **URL**: ${cleanBase}/?tab=product-detail&id=${p.id}
- **Category**: ${p.category || 'Wood Sculptures'}
- **Material**: ${p.material || 'Solid Teak / Rosewood'}
- **Dimensions**: ${p.dimensions || 'Custom hand-carved specifications'}
- **Price**: ₹${(p.price_inr || 0).toLocaleString('en-IN')} (Includes tax; worldwide insured shipping)
- **Description**: ${p.description || 'Traditional Indian hand-carved sculpture with master artisan detailing.'}
`)
    .join('\n');

  return `# Complete Atelier Knowledge Base - Swarna Wooden Crafts (IrisJev)
Generated: ${new Date().toISOString()}

## About The Heritage Atelier
Swarna Wooden Crafts (IrisJev Heritage Studios) is located in Mysore, Karnataka, India. Founded by traditional master sculptors (Sthapathis), our atelier preserves ancient South Indian Chola, Hoysala, and Vijayanagara carving traditions.

## Geographic Coordinates & Hub
- **Region**: Karnataka, India (ISO: IN-KA)
- **Coordinates**: ${GEO_LOCATION.latitude}, ${GEO_LOCATION.longitude}
- **Dispatch Center**: ${GEO_LOCATION.streetAddress}

## All Current Catalog Masterpieces
${fullCatalog}

## Shipping & Custom Commissions
- **Bespoke Commissions**: Custom idols up to 12 feet, complete pooja rooms, and temple doors.
- **Packaging**: 5-layer shock absorption, vacuum sealing, moisture desiccants, and solid pine export crates.
- **Export Standards**: ISPM-15 phytosanitary certified and fumigated wood.
`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
