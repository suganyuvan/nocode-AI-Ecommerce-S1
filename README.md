# Swarna Wooden Crafts

Swarna Wooden Crafts is a responsive, full-stack e-commerce platform designed for showcasing, selling, and managing handcrafted traditional wooden sculptures, intricate relief panels, and custom temple architecture. Built with React 19, TypeScript, Vite, Tailwind CSS, Supabase, Razorpay, and Resend, it features a luxury customer storefront and a comprehensive administrative suite.

---

## ⭐ Live Demo & Links

- **Customer Storefront:** [https://irisjev.netlify.app/](https://irisjev.netlify.app/)
- **Admin Dashboard:** [https://irisjev.netlify.app/admin](https://irisjev.netlify.app/admin)
- **Source Code Repository:** [https://github.com/suganyuvan/nocode-AI-Ecommerce-S1](https://github.com/suganyuvan/nocode-AI-Ecommerce-S1)

> 🔐 **Demo Admin Login (For Project Evaluation):**  
> - **Email:** `admin@Irisjev.com`  
> - **Password:** `TN09CQ5716`

---

## 📸 Real Project Preview

![Swarna Wooden Crafts Storefront Homepage](docs/screenshots/home.png)

---

## ⭐ Key Features

### 🛒 Customer Storefront
- **Responsive Homepage**: Hero section with animated heritage collage, spotlight collections, and craftsmanship narrative.
- **Product Catalogue**: Category filtering (*Sculptures, Wall Reliefs, Temple Pillars, Wooden Furniture*), timber type selector (*Teakwood, Rosewood, Sandalwood*), price sorting, and live modal search.
- **Product Detail Views**: High-resolution image galleries, dynamic timber option picker, dimensions, weight, care instructions, certified authenticity badge, and wishlist integration.
- **Dynamic Dual Currency**: Instant switching between Indian Rupee (**INR ₹**) and US Dollar (**USD $**).
- **Custom Bespoke Commissions**: Inquiry modal for custom temple doors, mandapams, and architectural woodwork requests.
- **Interactive Cart Drawer**: Real-time subtotal calculation, free shipping progress bar, complimentary tier gifts, discount coupon redemption, and PIN code delivery estimator.
- **Multi-Step Checkout**: Streamlined checkout flow supporting address book pre-fills, PIN code serviceability validation, Razorpay online payments (UPI/Cards/NetBanking), and Cash-on-Delivery (COD).
- **Customer Account Portal**: Order history tracking, address book manager, and profile settings.
- **Live Order Tracking**: Shipment lookup via Order ID or Phone number with real-time status timeline.
- **Sacred Architectural Showcase**: Portfolio view for temple projects and heritage restoration.
- **B2B Wholesale & Global Export**: Inquiry portal for commercial interior designers and international importers.

### 🛡️ Admin Management Suite (`/admin`)
- **Executive Overview Dashboard**: Real-time gross revenue, sales metrics, order stream, active customers, and stock alerts.
- **Product & Inventory Manager**: Full CRUD management for items, INR/USD pricing, timber attributes, stock badges, and image galleries.
- **Order Management & Fulfillment**: Tracking order fulfillment stages (*Processing, Handcrafted, Dispatched, Delivered*), payment status, and PDF invoice generation.
- **Automated Shipping Label Generator**: Printable dispatch slips complete with recipient details, SKU breakdown, weight, and QR tracking.
- **Customer Relationship Management (CRM)**: Customer directory, lifetime value metrics, and order history.
- **Smart Coupon & Voucher Engine**: Custom rules for fixed rupee discounts, percentage vouchers, minimum order thresholds, and usage caps.
- **Promotional Campaign Manager**: Top announcement bar editor, hero slides, and promotional popup banners.
- **Sales & Traffic Analytics**: Visitor analytics reporting top-viewed items, conversion funnels, and revenue trends.
- **Dynamic SEO & GEO Settings**: Dynamic Meta Title/Description tags, OpenGraph social cards, and Schema.org JSON-LD editor.
- **Visual Page Builder**: Customizable hero banner copy, story blocks, and featured product slots.
- **Logistics & Shipping Zone Rates**: Regional PIN code rules, express surcharges, and estimated lead times.
- **Resend Email System Logs**: Audit trail for transactional receipts, welcome vouchers (`WELCOME10`), and admin alerts.
- **Webhooks Integration Hub**: Real-time event streaming (`order.created`, `lead.created`, `ticket.created`) for n8n / custom automation endpoints.
- **Customer Support Tickets**: Resolution inbox for bespoke commission requests and contact inquiries.

---

## 🛠️ Technology Stack

| Category | Technology | Usage / Purpose |
|---|---|---|
| **Frontend Framework** | React 19 (`react` ^19.0.1) | Component Architecture & UI State Management |
| **Language** | TypeScript (~5.8.2) | Static Type Safety & Developer Experience |
| **Build Tool** | Vite 6 (`vite` ^6.2.3) | Lightning-fast HMR and Production Bundles |
| **Styling System** | Tailwind CSS v4 + Vanilla CSS | Utility Styling & Custom Luxury Theme Tokens |
| **Database & Auth** | Supabase Postgres & Auth | Relational Data Store & Isolated Customer/Admin Auth Sessions |
| **Payment Gateway** | Razorpay SDK | Online Payment Processing (UPI, Credit/Debit Cards, Net Banking) |
| **Email Engine** | Resend API | Transactional Email Notifications & Voucher Delivery |
| **Webhooks Engine** | Custom Dispatcher | Event Streaming for Automation Pipelines (n8n / Make) |
| **Routing** | React Router DOM v7 | URL Navigation & Query Parameter State Sync (`?tab=` / `?id=`) |
| **Icons & Motion** | Lucide React + Motion | Modern Iconography & Smooth Micro-Interactions |
| **Screenshot Automation** | Puppeteer Core | Headless Chrome Automated UI Verification & Screenshots |
| **Deployment** | Netlify / Docker + Nginx | Cloud Hosting & Containerized Production Environment |

---

## 📸 Storefront Walkthrough & Screenshots

### 1. Storefront Home Page
An animated heritage hero section with curated collection cards and spotlight products.

![Home Page](docs/screenshots/home.png)

### 2. Shop Catalogue & Filtering
Real-time search, category filters (*Sculptures, Reliefs, Temple Pillars, Furniture*), timber selector, and price sorting.

![Shop Catalogue](docs/screenshots/shop.png)

### 3. Product Details Page
Product galleries, dynamic timber option selector, dimensions, weight, care instructions, certified authenticity badge, and wishlist integration.

![Product Details](docs/screenshots/product-detail.png)

### 4. Sacred Architecture & Temple Projects
Portfolio showcasing custom temple doors, mandapams, deity pedestals, and architectural restoration projects.

![Temple Projects](docs/screenshots/temple-projects.png)

### 5. Artisanal Heritage & Craftsmanship Story
In-depth narrative explaining century-old woodcarving heritage, master craftsmen, and sustainable timber sourcing.

![About Us](docs/screenshots/about.png)

### 6. B2B Wholesale & International Export
Inquiry form for interior designers, architects, and international importers requesting bulk pricing and freight shipping quotes.

![Wholesale & Export](docs/screenshots/wholesale-export.png)

### 7. Wood Care & Maintenance Manual
Educational guide on preserving natural oil finishes, protecting hardwoods against climate changes, and routine polishing.

![Care Guide](docs/screenshots/care-guide.png)

### 8. Interactive Cart Drawer
Slide-over cart with live quantity controls, free shipping progress bar, gift option, discount voucher input, and PIN code delivery estimator.

![Cart Drawer](docs/screenshots/cart-drawer.png)

### 9. Multi-Step Checkout Page
Streamlined checkout supporting address pre-fills, PIN code serviceability validation, Razorpay online payments, and Cash-on-Delivery (COD).

![Checkout Page](docs/screenshots/checkout.png)

### 10. Customer Account Portal
Customer dashboard displaying active orders, historical shipments, downloadable invoices, saved addresses, and profile details.

![Customer Account](docs/screenshots/customer-account.png)

### 11. Live Order Tracking Timeline
Shipment lookup via Order ID or Phone number with real-time fulfillment timeline stages.

![Order Tracking](docs/screenshots/track-order.png)

### 12. Contact Studio
Studio contact details, location details, inquiry form, and direct WhatsApp messaging connection.

![Contact Us](docs/screenshots/contact.png)

---

## 🛡️ Admin Dashboard Walkthrough & Screenshots

### 1. Protected Admin Login
Secure authentication interface connected to Supabase Auth.

![Admin Login](docs/screenshots/admin-login.png)

### 2. Executive Dashboard Overview
High-level operational overview displaying gross revenue, sales volume, customer count, low-stock warnings, and recent order stream.

![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### 3. Product & Inventory Manager
Full CRUD management for catalog items. Control INR/USD pricing, timber attributes, stock quantities, spotlight flags, and image galleries.

![Admin Products](docs/screenshots/admin-products.png)

### 4. Order Management & Fulfillment Center
Track orders, update fulfillment statuses (*Pending, Processing, Shipped, Delivered*), inspect payment status, and generate customer tax invoices.

![Admin Orders](docs/screenshots/admin-orders.png)

### 5. Customer CRM Directory
Comprehensive list of registered customers, lifetime spend statistics, contact details, shipping addresses, and order history.

![Admin Customers](docs/screenshots/admin-customers.png)

### 6. Smart Coupon & Discount Engine
Create and manage promotional discount codes with rules for fixed rupee amounts, percentage discounts, minimum order thresholds, and usage caps.

![Admin Coupons](docs/screenshots/admin-coupons.png)

### 7. Storefront Promotional Campaign Manager
Control top announcement ticker messages, hero promotional slides, discount badges, and pop-up banners.

![Admin Promotions](docs/screenshots/admin-promotions.png)

### 8. Sales Performance & Page View Analytics
Visual metrics reporting top-viewed product pages, category traffic, checkout conversion funnels, and revenue trends.

![Admin Analytics](docs/screenshots/admin-analytics.png)

### 9. Dynamic SEO & GEO Settings Manager
Customize meta titles, descriptions, OpenGraph social preview images, and JSON-LD structured data across all pages.

![Admin SEO](docs/screenshots/admin-seo.png)

### 10. Visual Page Builder & Hero Customizer
Customize hero banner content, promotional copy, featured product spotlight slots, and homepage storytelling sections.

![Admin Page Builder](docs/screenshots/admin-page-builder.png)

### 11. Logistics & Shipping Zone Rates
Define free shipping thresholds, regional PIN code rules, express shipping surcharges, and estimated delivery lead times.

![Admin Shipping](docs/screenshots/admin-shipping.png)

### 12. Shipping Label & Dispatch Slip Generator
Generate and print standardized dispatch labels complete with shipping address, order SKU list, package weight, and QR tracking codes.

![Admin Shipping Labels](docs/screenshots/admin-shipping-labels.png)

### 13. Resend Email System Logs
Monitor transactional email delivery logs for order receipts, welcome discount codes, and customer inquiry auto-responders.

![Admin Email System](docs/screenshots/admin-email.png)

### 14. Webhooks & Automation Integration Hub
Configure custom webhook URLs (e.g., n8n, Make, Zapier) and view delivery payload logs for event triggers (`order.created`, `lead.created`).

![Admin Webhooks](docs/screenshots/admin-webhooks.png)

### 15. Customer Support Tickets & Inquiries
Inbox for managing custom bespoke temple requests, wholesale B2B inquiries, and customer contact submissions.

![Admin Support Tickets](docs/screenshots/admin-support-tickets.png)

---

## 🏗️ Architecture & Project Structure

```
nocode-AI-Ecommerce-S1/
├── src/
│   ├── admin/                      # Admin Dashboard Sub-Application
│   │   ├── components/             # Layout & Navigation Sidebars
│   │   ├── views/                  # 18 Specialized Admin Module Managers
│   │   ├── AdminApp.tsx            # Admin Router & Session Verification
│   │   └── AdminLogin.tsx          # Protected Admin Sign-In Screen
│   ├── components/                 # Storefront Shared UI Components & Modals
│   │   ├── Header.tsx              # Storefront Navigation & Currency Selector
│   │   ├── Footer.tsx              # Storefront Footer with Newsletter & Links
│   │   ├── CartDrawer.tsx          # Interactive Slide-over Shopping Cart
│   │   ├── WishlistDrawer.tsx      # Customer Saved Favorites Drawer
│   │   ├── BespokeOrderModal.tsx   # Custom Temple Architecture Request Form
│   │   ├── CustomerAuthModal.tsx   # Customer Login & Welcome Voucher Modal
│   │   ├── TrackOrderModal.tsx     # Order Status Lookup Modal
│   │   ├── PromotionalBanner.tsx   # Announcement & Campaign Banners
│   │   ├── SeoHead.tsx             # Dynamic SEO & JSON-LD Schema Manager
│   │   └── ShippingLabelSlip.tsx   # Printable Dispatch Slip Component
│   ├── views/                      # Public Storefront Page Views
│   │   ├── HomeView.tsx            # Heritage Hero, Categories & Spotlight Products
│   │   ├── ShopView.tsx            # Product Catalogue with Filters & Sorting
│   │   ├── ProductDetailView.tsx   # Specs, Gallery, Timber Options & Authenticity
│   │   ├── TempleProjectsView.tsx  # Architectural Woodwork Showcase
│   │   ├── AboutView.tsx           # Artisanal Heritage & Sourcing Narrative
│   │   ├── WholesaleExportView.tsx # B2B Wholesale Inquiry Form
│   │   ├── CareGuideView.tsx       # Wood Care Manual
│   │   ├── CheckoutView.tsx        # Multi-Step Address & Payment Gateway Flow
│   │   ├── MyAccountView.tsx       # Customer Account Portal & Order History
│   │   ├── TrackOrderView.tsx      # Order Status Lookup Timeline Page
│   │   └── ContactView.tsx         # Studio Contact & Inquiry Form
│   ├── utils/                      # Service Utilities & External APIs
│   │   ├── supabaseClient.ts       # Isolated Supabase Client Instances
│   │   ├── razorpay.ts             # Razorpay Payment Gateway Helper
│   │   ├── resendEmailEngine.ts    # Transactional Email Sender
│   │   ├── couponEngine.ts         # Discount Rule Evaluator
│   │   ├── pincodeValidator.ts     # PIN Code Serviceability Engine
│   │   ├── webhookDispatcher.ts    # Webhook Event Dispatcher
│   │   └── salesAnalyticsEngine.ts # Revenue & Analytics Engine
│   ├── types.ts                    # Global TypeScript Models
│   ├── App.tsx                     # Main Storefront Router
│   └── index.css                   # Tailwind CSS Utilities & Design System
├── docs/
│   └── screenshots/                # Real Captured PNG Screenshots
├── scripts/
│   └── capture-screenshots.js      # Headless Puppeteer Automation Tool
├── supabase/                       # SQL Schema Setup Scripts
├── Dockerfile                      # Production Multi-Stage Dockerfile
├── docker-compose.yml              # Container Orchestration Spec
├── nginx.conf                      # Production Web Server Configuration
└── package.json                    # Dependencies & NPM Scripts
```

---

## ⚡ Database & Third-Party Integrations

- **Supabase Postgres Database**: Relational schema storing `products`, `orders`, `customers`, `coupons`, `page_content`, `store_settings`, `leads`, `support_tickets`, `page_views`, and `webhook_logs`.
- **Dual Supabase Auth Clients**: Independent browser storage keys (`irisjev_customer_auth_token` for Customer Storefront vs `irisjev_admin_auth_token` for Admin Panel) prevent session leakage.
- **Razorpay Payments**: Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Cash-on-Delivery (COD).
- **Resend Email Engine**: Automated transactional delivery for welcome vouchers (`WELCOME10`), customer order confirmation receipts, and admin inquiry notices.
- **n8n / Automation Webhooks**: Real-time JSON payload streaming for external CRM and order processing pipelines.
- **WhatsApp Direct Connect**: Floating action button for real-time customer assistance.

---

## 📱 SEO, Responsive Design & Performance

### 🔍 SEO, GEO & AEO Strategy
- **Dynamic Head Controller**: Managed via `SeoHead.tsx`, updating title tags, meta descriptions, and canonical links per page.
- **Structured Data (JSON-LD)**: Schema.org markup formatted for search engines and AI engines (ChatGPT, Perplexity, Claude):
  - `Product` (pricing, currency, availability, rating)
  - `BreadcrumbList` (navigation path)
  - `Organization` & `LocalBusiness` (brand and contact info)
- **Generative Engine Optimization (GEO)**: Passage-level optimization for factual AI search indexing.

### 📱 Responsive Mobile Testing
Designed mobile-first with a touch-friendly bottom navigation bar, swipeable image carousels, and slide-over drawers. Tested across viewports:
- **320px / 360px**: Small Mobile
- **390px / 414px**: Modern Smartphones (iPhone 13/14/15, Samsung Galaxy)
- **768px / 1024px**: Tablets & iPads
- **1280px / 1440px**: Desktop & Widescreen

| Mobile Homepage (390x844) | Mobile Shop Catalogue (390x844) |
|---|---|
| ![Mobile Homepage](docs/screenshots/home-mobile.png) | ![Mobile Shop](docs/screenshots/shop-mobile.png) |

---

## 🧪 Testing & Screenshot Automation

The repository includes an automated screenshot capture script built using `puppeteer-core` and system Chrome to generate clean 2x HiDPI PNG screenshots directly from the running dev server:

```bash
# Run local dev server
npm run dev

# Execute screenshot capture script
node scripts/capture-screenshots.js
```

The script captures every storefront view (Desktop 1440x900 & Mobile 390x844) and every admin manager view, saving them cleanly to `docs/screenshots/`.

---

## 🚀 Deployment & Future Improvements

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/suganyuvan/nocode-AI-Ecommerce-S1.git
cd nocode-AI-Ecommerce-S1

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env)
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_RAZORPAY_KEY_ID=...
# VITE_RESEND_API_KEY=...

# 4. Start local development server
npm run dev
```

### Docker & Cloud Deployment
- **Dockerfile**: Multi-stage build compiling static assets into Nginx on port 80.
- **Dokploy / VPS**: Ready for deployment on Dokploy, Netlify, Vercel, or custom Docker hosts.

### 🔮 Planned / Future Enhancements
- **3D Interactive Model Viewer**: AR preview for large temple sculptures in real-world spaces using WebGL/Three.js.
- **Multi-Language Support**: Localization in Tamil, Hindi, and English.
- **Automated Carrier API Integration**: Live real-time rate fetching and tracking sync with Indian Post & DHL Express.

---

## 📄 License & Author

Developed by **Sugavaneshwaran** as a showcase e-commerce platform for handcrafted wooden sculptures and temple architecture.

- **Developer:** Sugavaneshwaran  
- **Repository:** [suganyuvan/nocode-AI-Ecommerce-S1](https://github.com/suganyuvan/nocode-AI-Ecommerce-S1)  
- **License:** MIT License  
