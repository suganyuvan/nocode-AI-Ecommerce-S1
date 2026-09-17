import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Define desktop & mobile viewports
  const setDesktop = async () => {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  };

  const setMobile = async () => {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  };

  // Helper to set admin session in localStorage
  const injectAdminSession = async () => {
    await page.evaluate(() => {
      localStorage.setItem('irisjev_admin_demo', 'true');
      localStorage.setItem('irisjev_promo_seen', 'true');
    });
  };

  const disablePromoSeen = async () => {
    await page.evaluate(() => {
      localStorage.setItem('irisjev_promo_seen', 'true');
    });
  };

  // 1. STOREFRONT PAGES
  console.log('Capturing Storefront Pages...');

  // Home (Desktop)
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=home`, { waitUntil: 'networkidle0' });
  await disablePromoSeen();
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'home.png') });
  console.log('✓ Captured home.png');

  // Home (Mobile)
  await setMobile();
  await page.goto(`${BASE_URL}?tab=home`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'home-mobile.png') });
  console.log('✓ Captured home-mobile.png');

  // Shop Catalogue (Desktop)
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=shop`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shop.png') });
  console.log('✓ Captured shop.png');

  // Shop Catalogue (Mobile)
  await setMobile();
  await page.goto(`${BASE_URL}?tab=shop`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'shop-mobile.png') });
  console.log('✓ Captured shop-mobile.png');

  // Product Detail View
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=product-detail&id=ganesha-sculpture-01`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'product-detail.png') });
  console.log('✓ Captured product-detail.png');

  // Temple Projects
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=temple-projects`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'temple-projects.png') });
  console.log('✓ Captured temple-projects.png');

  // About Artisanal Craftsmanship
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=about`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'about.png') });
  console.log('✓ Captured about.png');

  // Wholesale & Global Export
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=wholesale-export`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'wholesale-export.png') });
  console.log('✓ Captured wholesale-export.png');

  // Wood Care Guide
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=care-guide`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'care-guide.png') });
  console.log('✓ Captured care-guide.png');

  // Cart Drawer (Desktop with open cart)
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=home`, { waitUntil: 'networkidle0' });
  await delay(500);
  await page.evaluate(() => {
    const cartBtn = document.querySelector('button[aria-label*="Cart"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cart') || b.querySelector('svg'));
    if (cartBtn) cartBtn.click();
  });
  await delay(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'cart-drawer.png') });
  console.log('✓ Captured cart-drawer.png');

  // Checkout Page
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=checkout`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'checkout.png') });
  console.log('✓ Captured checkout.png');

  // Customer Account Page
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=account`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'customer-account.png') });
  console.log('✓ Captured customer-account.png');

  // Track Order Page
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=track`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'track-order.png') });
  console.log('✓ Captured track-order.png');

  // Contact Us Page
  await setDesktop();
  await page.goto(`${BASE_URL}?tab=contact`, { waitUntil: 'networkidle0' });
  await delay(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'contact.png') });
  console.log('✓ Captured contact.png');


  // 2. ADMIN PAGES
  console.log('Capturing Admin Pages...');

  // Admin Login Screen
  await setDesktop();
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
  await delay(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-login.png') });
  console.log('✓ Captured admin-login.png');

  // Inject Admin Session for subsequent admin views
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await injectAdminSession();

  // Admin Dashboard Overview
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-dashboard.png') });
  console.log('✓ Captured admin-dashboard.png');

  // Admin Products Manager
  await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-products.png') });
  console.log('✓ Captured admin-products.png');

  // Admin Orders Manager
  await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-orders.png') });
  console.log('✓ Captured admin-orders.png');

  // Admin Customers Manager
  await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-customers.png') });
  console.log('✓ Captured admin-customers.png');

  // Admin Coupons Manager
  await page.goto(`${BASE_URL}/admin/coupons`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-coupons.png') });
  console.log('✓ Captured admin-coupons.png');

  // Admin Promotional Banners Manager
  await page.goto(`${BASE_URL}/admin/promotional-banners`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-promotions.png') });
  console.log('✓ Captured admin-promotions.png');

  // Admin Sales Analytics Manager
  await page.goto(`${BASE_URL}/admin/sales-analytics`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-analytics.png') });
  console.log('✓ Captured admin-analytics.png');

  // Admin SEO Settings Manager
  await page.goto(`${BASE_URL}/admin/seo`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-seo.png') });
  console.log('✓ Captured admin-seo.png');

  // Admin Page Builder Manager
  await page.goto(`${BASE_URL}/admin/page-builder`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-page-builder.png') });
  console.log('✓ Captured admin-page-builder.png');

  // Admin Shipping & Logistics
  await page.goto(`${BASE_URL}/admin/shipping`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-shipping.png') });
  console.log('✓ Captured admin-shipping.png');

  // Admin Shipping Labels
  await page.goto(`${BASE_URL}/admin/shipping-labels`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-shipping-labels.png') });
  console.log('✓ Captured admin-shipping-labels.png');

  // Admin Resend Email System
  await page.goto(`${BASE_URL}/admin/emails`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-email.png') });
  console.log('✓ Captured admin-email.png');

  // Admin Webhooks Hub
  await page.goto(`${BASE_URL}/admin/webhooks`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-webhooks.png') });
  console.log('✓ Captured admin-webhooks.png');

  // Admin Support Tickets
  await page.goto(`${BASE_URL}/admin/support-tickets`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'admin-support-tickets.png') });
  console.log('✓ Captured admin-support-tickets.png');

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
