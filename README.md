# AP Creative Studio

A responsive agency website for resume creation, portfolio websites, LinkedIn optimization and personal branding.

## Included
- React + TypeScript + Vite frontend with responsive layouts and mobile navigation
- Editable service and package pricing in `src/config.ts`
- Demo portfolio gallery with filters and preview modals; every example is labeled demo
- Validated order enquiry form with backend persistence and WhatsApp fallback
- Express API with Zod validation, Helmet, CORS allow-list and rate limiting
- SQLite order storage (local/server deployment only)
- Founder admin dashboard at `/admin.html` with login, order status and internal notes
- Razorpay server-side order creation, signature verification and webhook verification scaffolding
- Privacy policy and terms/delivery pages
- SEO metadata, accessible labels, reduced-motion support

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
```

Edit `.env` before starting:
- Set `ADMIN_PASSWORD` to a long, unique password.
- Set `SESSION_SECRET` to a random secret of at least 32 characters.
- Set `CLIENT_ORIGIN=http://localhost:5173`.
- Configure `VITE_WHATSAPP_NUMBER` and `VITE_CONTACT_EMAIL` in `.env` with real business details (the WhatsApp number should be country code + number, digits only).
- Change `VITE_API_BASE_URL=http://localhost:4000` for local use.

Run the API and frontend in separate terminals:

```bash
npm run server
npm run dev
```

Open `http://localhost:5173`. Admin dashboard: `http://localhost:5173/admin.html`.

Or run both in one terminal:

```bash
npm run dev:all
```

Production frontend build:

```bash
npm run build
npm run preview
```

## Central configuration
All visible starting prices and package prices are in `src/config.ts`. The backend has a separate trusted package-price map in `server/index.js`; keep these values aligned. Do not trust client-supplied amounts.

Brand, WhatsApp, contact email and API base URL are controlled by Vite environment variables. `VITE_*` values are public browser config, so never put secrets in them.

## Payment integration notes
Razorpay integration is scaffolded, not live until configured:
1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to server-only environment variables.
2. Configure the webhook URL `/api/payments/webhook` in Razorpay dashboard and subscribe to `payment.captured` and `payment.failed`.
3. Add a client-side checkout flow using Razorpay Checkout only after an enquiry has been created and a package is agreed. The server endpoint `/api/payments/create-order` creates the gateway order from server-side prices.
4. The backend verifies checkout signature and webhook signatures. Reconcile gateway payment state before fulfilling orders; do not accept a browser-only “success” callback as proof of payment.
5. Test with Razorpay test mode before switching to live keys.

The enquiry form can open Razorpay Checkout for a selected package after the enquiry is saved. The browser callback is not trusted by itself: the server verifies the signature before updating payment status. If Razorpay credentials are absent, checkout returns a clear configuration message and no payment is simulated.


## Deploy on Vercel (recommended for frontend)

This repo is ready for Vercel.

1. Import the GitHub repository in [Vercel](https://vercel.com/new).
2. Framework Preset: **Vite** (auto-detected).
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variables in Vercel dashboard:
   - `VITE_BRAND_NAME` = your brand name
   - `VITE_WHATSAPP_NUMBER` = country code + number (digits only, e.g. 9198XXXXXXXX)
   - `VITE_CONTACT_EMAIL` = your email
   - `VITE_API_BASE_URL` = leave empty for pure frontend (order form falls back to WhatsApp)  
     or set to your backend API URL if you host the Express server elsewhere.

After deploy the site is live. Order form works with WhatsApp fallback when no API is configured.

### Important notes for Vercel
- The Express + SQLite backend (`server/`) does **not** run on pure Vercel static hosting. SQLite is not durable on serverless.
- For full order storage, admin dashboard data, and Razorpay: host the `server/` on Railway, Render, Fly.io, or a VPS, then set `VITE_API_BASE_URL` to that API origin and `CLIENT_ORIGIN` to your Vercel domain.
- Admin page (`/admin.html`) is static; it needs the API to be useful.
- Privacy and Terms pages work out of the box.


## Production checklist — do not skip
- **Database:** SQLite is fine for local development or a persistent single-instance server. For serverless/multi-instance hosting, replace with managed PostgreSQL or another durable database. Do not rely on ephemeral filesystem storage.
- **Admin sessions:** current in-memory sessions expire after 8 hours and reset on server restart. For multi-instance production, use a shared session store, add login throttling, CSRF protections if cookie auth is introduced, and review session lifecycle.
- **Admin UI:** admin HTML is public, but all order data and mutations are protected by backend auth. Use HTTPS, strong secrets, access monitoring and backups.
- **Email:** not connected. Configure a transactional email provider and notification templates if needed.
- **WhatsApp:** uses a `wa.me` link; configure a real business number. No WhatsApp Business API is connected.
- **Privacy/legal:** review placeholder privacy policy, terms, revision, refund/cancellation and delivery language for actual business practices and applicable law.
- **Content:** founder bios and photos are intentionally placeholders; add verified biographies, skills and approved photos. The portfolio gallery is illustrative demo work, not customer work.
- **Brand name:** “AP Creative Studio” is temporary and can be changed via `VITE_BRAND_NAME` and the HTML/legal page titles.
- **No fake claims:** no testimonials, job guarantees, discounts or unverified founder achievements are included.
- **Hosting:** this is a full-stack Express + SQLite project. Static hosting alone will not run the API. Deploy frontend and API with an appropriate server runtime and persistent database, then set CORS and environment variables.
- **Security review:** add automated tests, dependency scanning, backups/restore testing, audit logging, request monitoring and a reviewed data retention process before launch.

## Routes
- `GET /api/health`
- `POST /api/orders`
- `POST /api/admin/login`
- `GET /api/admin/orders` (admin bearer token)
- `PATCH /api/admin/orders/:id` (admin bearer token)
- `POST /api/admin/logout`
- `POST /api/payments/create-order` (Razorpay config required)
- `POST /api/payments/verify` (Razorpay config required)
- `POST /api/payments/webhook` (Razorpay webhook config required)

## Deployment caution
Do not commit `.env`, SQLite database files, API secrets or real customer data. Configure secrets in the hosting provider's environment settings. Preview and test before any production deployment.
