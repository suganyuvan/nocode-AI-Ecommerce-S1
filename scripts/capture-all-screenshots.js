import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = path.resolve('docs/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching Chrome from:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Helper to capture a screenshot
  async function capture(url, filename, viewport = { width: 1440, height: 900 }, setupFn = null) {
    console.log(`Capturing ${filename} from ${url}...`);
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Dismiss any promo popups by setting localStorage before or dismissing modal if present
    await page.evaluate(() => {
      localStorage.setItem('irisjev_promo_seen', 'true');
    });

    if (setupFn) {
      await setupFn(page);
    }

    // Wait a brief moment for fonts and images to stabilize
    await new Promise(res => setTimeout(res, 1200));

    const filepath = path.join(outputDir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`✓ Saved ${filename}`);
  }

  try {
    // 1. Storefront Desktop & Mobile
    await capture('http://localhost:3000/?tab=home', 'home.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=home', 'home-mobile.png', { width: 390, height: 844 });
    
    await capture('http://localhost:3000/?tab=shop', 'shop.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=shop', 'shop-mobile.png', { width: 390, height: 844 });

    await capture('http://localhost:3000/?tab=product-detail&id=ganesha-sculpture-01', 'product-details.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=product-detail&id=ganesha-sculpture-01', 'product-details-mobile.png', { width: 390, height: 844 });

    await capture('http://localhost:3000/?tab=temple-projects', 'temple-projects.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=about', 'about.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=wholesale-export', 'wholesale-export.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=care-guide', 'care-guide.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=checkout', 'checkout.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=checkout', 'checkout-mobile.png', { width: 390, height: 844 });
    await capture('http://localhost:3000/?tab=account', 'customer-account.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=contact', 'contact.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/?tab=track-order', 'track-order.png', { width: 1440, height: 900 });

    // Interactive UI states: Cart Drawer & Wishlist Drawer
    await capture('http://localhost:3000/?tab=home', 'cart-drawer.png', { width: 1440, height: 900 }, async (p) => {
      await p.evaluate(() => {
        // Add sample item to cart and open drawer
        const btn = document.querySelector('button[title="Add to Basket"]') || document.querySelector('button');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 600));
    });

    // 2. Admin Login
    await capture('http://localhost:3000/admin/login', 'admin-login.png', { width: 1440, height: 900 });

    // Set up Admin Session in localStorage
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const mockAdminSession = {
        access_token: 'fake-admin-access-token-for-screenshot-mode',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@irisjev.com',
          user_metadata: { role: 'admin', name: 'Master Guildmaster' },
          app_metadata: { provider: 'email' },
          created_at: new Date().toISOString()
        }
      };
      localStorage.setItem('irisjev_admin_auth_token', JSON.stringify(mockAdminSession));
    });

    // 3. Admin Views
    await capture('http://localhost:3000/admin', 'admin-dashboard.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/page-builder', 'admin-page-builder.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/products', 'admin-products.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/orders', 'admin-orders.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/shipping-labels', 'admin-shipping-labels.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/customers', 'admin-customers.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/sales-analytics', 'admin-sales-analytics.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/coupons', 'admin-coupons.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/promotional-banners', 'admin-promotional-banners.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/support-tickets', 'admin-support-tickets.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/leads', 'admin-leads.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/emails', 'admin-emails.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/webhooks', 'admin-webhooks.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/shipping', 'admin-shipping.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/seo', 'admin-seo.png', { width: 1440, height: 900 });
    await capture('http://localhost:3000/admin/settings', 'admin-settings.png', { width: 1440, height: 900 });

    console.log('✨ All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
