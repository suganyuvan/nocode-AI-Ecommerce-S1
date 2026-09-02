import fs from 'fs';
import path from 'path';
import { generateSitemapXml, generateRobotsTxt, generateLlmsTxt, generateLlmsFullTxt } from '../src/services/seo';
import { SITE_URL } from '../src/constants/seo';

// Catalog products fallback list for build-time generation
const CATALOG_PRODUCTS = [
  { id: 'mandala-square-panel-03', name: 'Mandala Square Panel', category: 'Square Panels', price_inr: 237500, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80', description: 'Intricate geometric mandala wall relief carving.' },
  { id: 'flowing-form-iii-05', name: 'Flowing Form III', category: 'Wall Mounts', price_inr: 283000, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80', description: 'Contemporary organic teakwood undulating wall panel.' },
  { id: 'heritage-triptych-06', name: 'Heritage Triptych', category: 'Square Panels', price_inr: 425000, image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80', description: 'Three-panel solid rosewood architectural relief carving.' },
  { id: 'serene-guardian-07', name: 'Serene Guardian', category: 'God Sculptures', price_inr: 558000, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', description: 'Authentic Hoysala style sanctified temple deity statue.' },
  { id: 'the-royal-peacock-04', name: 'The Royal Peacock', category: 'Grand Sculptures', price_inr: 1000000, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=1200&q=80', description: 'Monolithic dancing peacock sculpture with pierced feather plumes.' },
  { id: 'reclaimed-mirror-08', name: 'Reclaimed Teak Mirror', category: 'Mirrors & Decor', price_inr: 15000, image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', description: 'Heirloom architectural mirror frame crafted from salvaged temple teak.' },
  { id: 'amber-vase-bottles-09', name: 'Amber Vase Glass & Wood Set', category: 'Baskets & Bottles', price_inr: 6250, image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=80', description: 'Blown amber glass set in seasoned rosewood pedestals.' },
  { id: 'eco-woven-baskets-10', name: 'Eco Woven Baskets (Set of 3)', category: 'Baskets & Bottles', price_inr: 3250, image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1200&q=80', description: 'Handcrafted natural fiber and bamboo storage baskets.' },
  { id: 'temple-mandapam-shrine-11', name: 'Sacred Temple Mandapam Shrine', category: 'Custom Commissions', price_inr: 850000, image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1200&q=80', description: 'Sanctified home pooja mandapam with tiered gopuram shikharas.' },
  { id: 'carved-temple-doors-12', name: 'Royal Heritage Temple Doors (Pair)', category: 'Temple Doors', price_inr: 650000, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80', description: 'Heavy Burma teak entrance doors with Ashta Lakshmi reliefs.' },
  { id: 'ananthasayana-vishnu-02', name: 'Slanting Posture Vishnu', category: 'Wall Mounts', price_inr: 350000, image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80', description: 'Lord Vishnu reclining on Adisesha cosmic snake.' },
  { id: 'Shiva-sculpture-01', name: 'Lord Nataraja Wall Mount', category: 'Wall Mount', price_inr: 25999, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80', description: 'Cosmic dancer Lord Shiva encircled by holy fire halo.' },
  { id: 'prod-1787140358096', name: 'Lord Ganesha Wooden Statue', category: 'God Sculptures', price_inr: 55000, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', description: 'Auspicious four-armed Lord Ganesha seated on lotus base.' }
];

async function generateAll() {
  console.log('Generating SEO discovery files for Swarna Wooden Crafts...');

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Sitemap.xml
  const sitemapContent = generateSitemapXml(CATALOG_PRODUCTS, SITE_URL);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf-8');
  console.log('✓ Created public/sitemap.xml');

  // 2. Robots.txt
  const robotsContent = generateRobotsTxt(SITE_URL, true);
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf-8');
  console.log('✓ Created public/robots.txt');

  // 3. llms.txt
  const llmsContent = generateLlmsTxt(CATALOG_PRODUCTS, SITE_URL);
  fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsContent, 'utf-8');
  console.log('✓ Created public/llms.txt');

  // 4. llms-full.txt
  const llmsFullContent = generateLlmsFullTxt(CATALOG_PRODUCTS, SITE_URL);
  fs.writeFileSync(path.join(publicDir, 'llms-full.txt'), llmsFullContent, 'utf-8');
  console.log('✓ Created public/llms-full.txt');

  console.log('SEO and GEO discovery generation complete!');
}

generateAll().catch((err) => {
  console.error('Error generating SEO files:', err);
  process.exit(1);
});
