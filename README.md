# STELLARA | Artificial & China Gold Jewellery Online

> **Live Site:** [https://www.jewellerystellara.com](https://www.jewellerystellara.com)

**STELLARA** is a premium e-commerce jewellery storefront offering high-quality China Gold and high-sparkle Zircon jewellery at accessible prices. This repository contains the full-stack web application powering the storefront and its admin operations.

Built with **Next.js 16 (App Router)** and **React 19**, backed by **Supabase** (PostgreSQL + Storage), and deployed on **Vercel**.

---

## 🌟 Features

### 🛍️ Client-Facing Storefront
- **Immersive Landing Page**: Hero section, animated fade-ins, and a curated brand aesthetic using Outfit & Playfair Display typography, glassmorphism, and dark-mode-ready CSS variables.
- **Collections Browser**: Tree-structured navigation (categories → sub-collections) with search and filter by type. Supports nested collection hierarchies displayed in a rich grid layout.
- **Product Pagination**: Each collection displays up to **15 products per page** with full pagination controls.
- **Product Modal**: Full product detail view with multi-image gallery, color variant switching (with per-color images and stock), size chart, refcode, price, discount price, and stock indicator.
- **Cart System**: Persistent cart via React Context, with color/size variant support, quantity control, and a slide-over CartDrawer summary.
- **Checkout Flow**: Dedicated `/checkout` page with customer details form, advance payment via SadaPay / Bank Transfer (requires uploading screenshot of the payment receipt to Supabase Storage), flat Rs. 100 shipping fee, and order submission.
- **Menu Drawer Navigation**: Combined mobile navigation panel containing a collapsible/expandable category tree, live product search (filters by name/refcode), and a Recently Viewed strip.
- **Live Search**: Full-catalog fuzzy search modal on desktop, and a mobile-friendly search form integrated directly inside the MenuDrawer with recently viewed history (localStorage).
- **Deep-Link URLs**: Every collection and product has a shareable URL:
  - Collection: `jewellerystellara.com/?collection=zircon-pendant-set`
  - Product: `jewellerystellara.com/?collection=zircon-pendant-set&product=42`
- **Hash Anchor Routing**: `jewellerystellara.com/#collections` scrolls directly to the collections section.
- **WhatsApp CTA**: Floating WhatsApp enquiry button.
- **Sample Request Flow**: Modal form for requesting product samples directly from product pages.
- **Recently Viewed**: Displays the last 5 viewed products via localStorage.
- **Lightbox**: Full-screen image zoom viewer for product images.
- **Legal Modals**: Footer-accessible Privacy Policy, Terms of Service, and Refund & Return Policy modals.

### 🔒 Admin Portal (/admin)
- **Authentication**: Supabase email/password login protecting the entire admin dashboard.
- **Collection CRUD**: Create, edit, delete, and drag-to-reorder collections. Supports parent/child hierarchy (type: category | collection).
- **Product CRUD**: Full product management — name, price, base cost, discount price, description, multi-image upload (with compression), color variants (per-color images & stock), sizes, refcode, stock level, and display order.
- **Drag-and-Drop Reordering**: SortableJS-powered ordering for both collections and products with auto-save.
- **Inventory Manager**: Searchable, filterable product inventory table with quick inline stock editing and unlimited/limited stock toggle.
- **Walk-in Billing**: Create manual invoices for walk-in customers — add products from catalog, set per-item quantities and custom prices, apply discounts, add notes. Generates a printable bill.
- **Parcel Receipt Printing**: Print-friendly parcel receipts with sender (STELLARA), recipient, itemised list, and billing formula breakdown.
- **Order Aggregation & Grouping**: Individual database rows representing items in a single multi-item checkout order (sharing a confirmation code) or walk-in bill (sharing a bill number) are dynamically aggregated in the admin dashboard. This displays them as a single order card, avoids duplicate metrics, and supports bulk status updates and deletion.
- **Order Management**: View, search, date/status filter, and update status of all grouped online orders, walk-in sales, and sample requests.
- **Financial Tracking**: Revenue uses the actual price charged on the bill (not catalog price). Calculates Cost (base price x qty) and Profit per order. Dashboard shows total revenue, total base cost, and estimated net profit without double-counting grouped items.
- **Auto-Confirmation Emails**: Sends order confirmation emails via EmailJS when status is set to Confirmed.
- **Analytics Dashboard**: Bar and Doughnut charts (Chart.js) showing order metrics, collection distribution, and inventory metrics.
- **Image Optimization & Compression**: Collection and product images are compressed on the client side using Canvas before uploading to Supabase Storage to minimize storage footprint and egress bandwidth.
- **Cascade Deletion**: Deleting a collection/product automatically deletes associated media files from Supabase Storage.

### 🔍 SEO & Discoverability
- **Optimised Metadata**: Title, description, keywords, Open Graph, and Twitter card tags targeting "artificial jewellery", "China gold jewellery", "Stellara", "jewellery Stellara" etc.
- **JSON-LD Structured Data**: Organization and WebSite schema for rich search results.
- **Canonical URL**: Points to https://www.jewellerystellara.com
- **robots.txt**: Allows all crawlers, points to sitemap.
- **sitemap.xml**: Lists all primary pages for Google Search Console indexing.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (images bucket) |
| Auth | Supabase Auth (admin only) |
| Styling | Vanilla CSS (custom variables, grid, animations) |
| Charts | Chart.js + react-chartjs-2 |
| Drag & Drop | SortableJS + react-sortablejs |
| Email | EmailJS |
| Deployment | Vercel |
| Domain | jewellerystellara.com |

---

## 📂 Project Structure

```
STELLARA/
├── app/
│   ├── admin/
│   │   └── page.jsx          # Full admin portal: CRUD, billing, inventory, analytics
│   ├── checkout/
│   │   └── page.jsx          # Customer checkout form & order submission
│   ├── globals.css           # Global styles, CSS variables, typography, animations
│   ├── layout.jsx            # Root layout: SEO metadata, JSON-LD, fonts, canonical URL
│   └── page.jsx              # Main landing page — deep-link routing, state orchestration
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx            # Top navigation bar (Home, Collections, FAQ, Contact, Cart)
│   │   ├── Hero.jsx              # Landing hero section
│   │   ├── Collections.jsx       # Collection grid with tree navigation (category > collection)
│   │   ├── ProductsView.jsx      # Product catalog grid with 15-per-page pagination
│   │   ├── MenuDrawer.jsx        # Mobile slide-over navigation drawer with search & tree nav
│   │   ├── CartContext.jsx       # Global cart state provider (React Context)
│   │   ├── CartDrawer.jsx        # Slide-over cart summary drawer
│   │   ├── CartDrawer.css        # Styles for the cart drawer
│   │   ├── SearchModal.jsx       # Live catalog search modal + recently viewed
│   │   ├── SampleFormModal.jsx   # Sample product request form modal
│   │   ├── OrderModal.jsx        # Order samples CTA modal
│   │   ├── RecentlyViewed.jsx    # Recently viewed products strip (localStorage)
│   │   ├── Lightbox.jsx          # Full-screen image zoom overlay
│   │   ├── FAQ.jsx               # Frequently asked questions accordion
│   │   ├── Contact.jsx           # Contact section with WhatsApp/email links
│   │   ├── About.jsx             # About Stellara section
│   │   ├── Footer.jsx            # Site footer with legal modal links
│   │   ├── WhatsAppButton.jsx    # Floating WhatsApp enquiry button
│   │   ├── WhatsAppButton.css    # Styles for the floating WhatsApp button
│   │   ├── ScrollToTop.jsx       # Floating scroll-to-top button
│   │   ├── ScrollToTop.css       # Styles for the scroll-to-top button
│   │   ├── PrivacyModal.jsx      # Privacy Policy modal
│   │   ├── TermsModal.jsx        # Terms of Service modal
│   │   ├── RefundModal.jsx       # Refund & Return Policy modal
│   │   ├── ProductModal.jsx      # Single product detail modal
│   │   ├── ProductModal.css      # Styles for the product detail modal
│   │   └── imageHelper.js        # Parses multi-image JSON, color-image mapping, color stock
│   ├── supabase.js               # Supabase client + in-memory prefetch cache
│   ├── admin.css                 # Admin portal stylesheet
│   └── index.css                 # Supplementary base styles
│
├── public/
│   ├── favicon.svg               # Site favicon
│   ├── logo.png                  # Stellara logo
│   ├── hero.png                  # Hero section background image
│   ├── earrings_grid.png         # Earrings collection grid image
│   ├── necklaces_grid.png        # Necklaces collection grid image
│   ├── zircon_pendant_set_cover.png # Zircon pendant set collection grid cover
│   ├── icons.svg                 # Icon sprites
│   ├── robots.txt                # Search engine crawler rules
│   └── sitemap.xml               # XML sitemap for Google Search Console
│
├── supabase/
│   └── migrations/
│       └── schema.sql            # Database schema migrations
│
├── scratch/                      # Dev utility scripts (not deployed)
├── .env.local                    # Environment secrets (not committed)
├── package.json                  # Dependencies and npm scripts
├── next.config.js                # Next.js configuration
└── vercel.json                   # Vercel deployment settings
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A [Supabase](https://supabase.com/) project with the schema from `supabase/migrations/schema.sql`

### 2. Environment Variables
Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000 — storefront.
Open http://localhost:3000/admin — admin portal.

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## 🔗 Deep Linking Reference

| URL | Result |
|---|---|
| `jewellerystellara.com/` | Homepage |
| `jewellerystellara.com/#collections` | Scrolls to collections section |
| `jewellerystellara.com/?collection=zircon-earrings` | Opens Zircon Earrings collection |
| `jewellerystellara.com/?collection=zircon-pendant-set&product=42` | Opens collection + product modal |

URLs are generated automatically when navigating. Works for all current and future collections and products — no code changes required when adding new items.

---

## 🗄️ Supabase Tables

| Table | Purpose |
|---|---|
| `collections` | Jewellery collections and categories |
| `products` | Admin product listings (full schema) |
| `client_products` | Client-facing product view (read-only) |
| `orders` | Customer orders, sample requests, walk-in bills |

---

## 📄 License
This project is proprietary and built exclusively for **STELLARA**. All rights reserved © 2026 STELLARA.
