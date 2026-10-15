# AP Creative Studio

Static React + TypeScript + Vite website for resume and portfolio services. Customers contact the studio through WhatsApp or a Google Form; the site itself stores no data and has no backend.

## Run locally
```bash
npm install
npm run dev
```
Production build: `npm run build` (output in `dist/`).

## Configuration
Services and prices live in `src/config.ts`. Optional environment variables (public, never put secrets here): `VITE_BRAND_NAME`, `VITE_WHATSAPP_NUMBER` (country code + number, digits only), `VITE_CONTACT_EMAIL`, `VITE_GOOGLE_FORM_URL`. See `.env.example`.

## Deploy (Vercel)
Framework preset Vite, build `npm run build`, output `dist`. Security headers (CSP, frame blocking, nosniff, HSTS, referrer and permissions policies) are set in `vercel.json`.

## Security notes
- No secrets, database or admin panel in this repo. Do not commit `.env`.
- Commit `package-lock.json` and keep Dependabot enabled (`.github/dependabot.yml`).
- The Terms checkbox is a consent prompt, not access control: the WhatsApp number and Form link are public.
- Enable 2FA on GitHub, Vercel and the Google account that owns the form.
- Security contact: `public/.well-known/security.txt`.
