# 🛍️ Irisjev Wooden Crafts - E-Commerce Web Application

A modern, full-stack luxury e-commerce web application specializing in handcrafted wooden temples, spiritual sculptures, custom woodwork, and home decor. Built with React 19, TypeScript, Tailwind CSS, and Supabase.

## 🌐 Live Demo

**Customer Website:**  
https://irisjev.netlify.app/

**Admin Dashboard:**  
https://irisjev.netlify.app/admin

---

## 🔐 Demo Admin Login

**Email:** admin@Irisjev.com  
**Password:** TN09CQ5716

> These credentials are provided for project evaluation and administrative demonstration.

---

## 📂 Source Code

**GitHub Repository:**  
https://github.com/suganyuvan/nocode-AI-Ecommerce-S1

---

## 📝 Project Overview

**Irisjev Wooden Crafts** is a production-grade full-stack e-commerce web application crafted for artisanal woodwork, home temples, and luxury wooden decor. Customers can browse rich product catalogs with category and attribute filtering, examine high-resolution product galleries, apply promotional discount coupons, track orders in real-time, and securely check out via Razorpay or Cash on Delivery (COD).

The platform also features a comprehensive **Admin Operations Dashboard** for managing products, tracking and updating customer orders, printing thermal/A4 shipping labels and GST invoices, configuring zone-based delivery fees, orchestrating marketing banners, analyzing sales and visitor metrics, and handling customer support tickets.

---

## ✨ Features

### Customer Features

- **Product Catalog & Filtering**: Browse handcrafted wooden products by category (Temples, Statues, Wall Decor, Custom Furniture), price range, and wood type.
- **Product Search & Recommendations**: Instant client-side search with keyword indexing and related product recommendations.
- **Rich Product Detail Pages**: High-resolution image galleries with zoom, dimensions, wood type specs, stock indicators, and verified customer reviews.
- **Interactive Cart System**: Slide-out cart drawer with real-time quantity adjustment, stock limit enforcement, and instant subtotal recalculation.
- **Flexible Checkout Flow**: Multi-step checkout with address verification, delivery zone calculation, and coupon discount engine.
- **Dual Payment Options**: Seamless Razorpay online payment gateway integration alongside Cash on Delivery (COD) support with configurable surcharges.
- **Order Tracking**: Real-time parcel tracking system displaying step-by-step progress from order placement to delivery.
- **Downloadable & Printable Tax Invoices**: Automated invoice generator with GST breakdown, customer billing info, and printable layout.
- **Customer Portal / My Account**: Order history, order tracking, address book management, and support ticket creation.
- **Custom Woodwork & B2B Inquiry Portals**: Dedicated forms for custom temple architecture projects, wholesale orders, and international export inquiries.
- **Care Guide & Knowledge Hub**: Detailed maintenance and care guidelines for preserving solid wood craft.
- **Responsive & Modern UI**: Fluid animations with Framer Motion, gold-accented luxury theme, and 100% mobile-friendly responsive layout.
- **Built-in SEO & Rich Schema**: Pre-configured JSON-LD structured schema for products, breadcrumbs, and OpenGraph/Twitter social cards.

### Admin Features

- **Admin Authentication**: Secure PIN and password-protected administrative access with persistent session state.
- **Executive Dashboard**: Key performance indicators including total revenue, order count, top-selling products, and recent orders overview.
- **Product Management**: Complete CRUD operations for adding, editing, and deleting products with multi-image URLs, dimensions, wood types, badges, and stock control.
- **Orders & Dispatch Center**: Real-time order monitoring with status filtering (Pending, Processing, Shipped, Delivered, Cancelled), courier partner assignment, and tracking ID updates.
- **Shipping Label Generator**: One-click thermal and A4 shipping slip generation with barcodes, order metadata, package dimensions, and sender/receiver addresses.
- **Shipping Zones & Rates**: Set zone-wise shipping rates, free delivery thresholds, COD eligibility, and express delivery rules.
- **Coupons & Promotions Engine**: Create percentage or fixed-amount discount codes with validity periods, minimum purchase amounts, and usage limits.
- **Promotional Banners Manager**: Create and toggle top announcement bars and promotional banner alerts across the storefront.
- **Page Builder & Hero Section**: Dynamic storefront headline, banner image, and CTA customization directly from the admin panel.
- **Customer Support Desk**: View and reply to customer inquiries, tickets, and feedback.
- **Sales & Visitor Analytics**: Track page views, conversion trends, revenue distribution, and traffic metrics over time.
- **SEO & Metadata Management**: In-app SEO settings controller to update meta titles, descriptions, and keywords.

---

## 🛠️ Technologies Used

- **Frontend Framework:** React 19 (Hooks, Context API)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) & Custom Gold-Accent Luxury Theme
- **Icons & Animations:** Lucide React, Motion (Framer Motion)
- **Database & Backend:** Supabase (PostgreSQL, Row Level Security, Storage)
- **Payment Processing:** Razorpay Checkout SDK
- **Build Tool:** Vite 6
- **Hosting & Deployment:** Netlify (Frontend) / Docker & Dokploy (Containerized Production Ready)
- **AI Integrations:** Google Gemini API (`@google/genai`)

---

## 🏗️ Project Structure

```text
src/
├── admin/                         # Complete Admin Operations Portal
│   ├── components/                # Admin navigation, modal dialogs & form components
│   ├── views/                     # Admin views (Products, Orders, Shipping, Coupons, Analytics, etc.)
│   ├── AdminApp.tsx               # Admin portal root & routing controller
│   └── AdminLogin.tsx             # Admin authentication & PIN login screen
├── components/                    # Customer-facing Storefront UI Components
│   ├── Header.tsx                 # Navigation bar, brand logo, search bar, and cart trigger
│   ├── Footer.tsx                 # Footer links, newsletter, certifications, and policies
│   ├── CartDrawer.tsx             # Slide-out interactive shopping cart drawer
│   ├── InvoiceModal.tsx           # Tax invoice generator and printable modal view
│   ├── ShippingLabelSlip.tsx      # Thermal / A4 formatted shipping slip with barcode
│   └── PromotionalBanner.tsx      # Configurable top promotional header banner
├── views/                         # Storefront Page Views
│   ├── HomeView.tsx               # Landing page, hero slider, featured collections & reviews
│   ├── ShopView.tsx               # Product catalog with category and price filters
│   ├── ProductDetailView.tsx      # Product detail, image gallery, specs, and review section
│   ├── CheckoutView.tsx           # Multi-step checkout with Razorpay & COD payment methods
│   ├── TrackOrderView.tsx         # Real-time order and shipment tracking portal
│   ├── MyAccountView.tsx          # Customer profile, saved addresses, and order history
│   ├── InvoiceView.tsx            # Dedicated standalone invoice viewing & print page
│   ├── TempleProjectsView.tsx     # Custom temple construction & bespoke woodwork portfolio
│   ├── WholesaleExportView.tsx    # B2B bulk ordering and export inquiry form
│   ├── CareGuideView.tsx          # Wood maintenance and care instructions
│   └── ...                        # About, Contact, Privacy, Terms, and Refund policies
├── services/                      # API integration and data services
│   ├── supabase.ts                # Supabase client configuration & auth handlers
│   ├── productService.ts          # Product queries, category filtering, and inventory updates
│   ├── orderService.ts            # Order creation, status updates, and tracking lookup
│   ├── paymentService.ts          # Razorpay payment verification and transaction management
│   ├── couponService.ts           # Promo code validation and discount calculation
│   └── shippingService.ts         # Shipping zone rate calculation and dispatch rules
├── types/ & types.ts              # TypeScript interfaces, data models, and type definitions
├── constants/                     # SEO metadata, static fallbacks, and category definitions
├── utils/                         # Currency formatting (INR), date helpers, and invoice utilities
├── App.tsx                        # Main application router and global state provider
└── main.tsx                       # React application root mount point
```
