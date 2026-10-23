# AP Creative Studio

Static React + TypeScript + Vite website for resume and portfolio services. Customers contact the studio through WhatsApp or a Google Form; the site itself stores no data and has no backend.

## Run locally
```bash
npm install
npm run dev
```
Production build: `npm run build` (output in `dist/`).

## Configuration
Services and prices live in `src/config.ts`. Optional environment variables (public, never put secrets here): `VITE_BRAND_NAME`, `VITE_WHATSAPP_NUMBER` (country code + number, digits only), `VITE_CONTACT_EMAIL`, `VITE_GOOGLE_FORM_URL`. Values are validated in `src/config.ts` (https-only Form URL, digits-only phone, well-formed email) and fall back to the defaults there if invalid.

## Deploy (Vercel)
Framework preset Vite, build `npm run build`, output `dist`. Security headers (strict CSP with no inline scripts or styles, frame blocking, nosniff, HSTS, referrer, permissions and cross-origin policies) are set in `vercel.json`.

## Deploys, CI and what to do if one fails
- Every push and pull request runs `.github/workflows/ci.yml` (repo checks, `npm run build` on Node 22 and 24). A red cross on a commit means the build is broken; fix it before expecting Vercel to publish.
- A failed Vercel build does **not** take the site down: the last good deployment stays live. Open the failed deployment in Vercel, read the first error line in the build log, and fix that.
- `package.json` keeps `"engines": { "node": ">=22" }` so Vercel always uses a Node version it still supports. Do not pin a single major (see `AGENTS.md`).
- `package-lock.json` pins exact dependency versions. If it is missing, CI generates and commits it once.
- Dependabot opens grouped update pull requests; CI tests them before you merge.

## Look & feel
Palette: navy `#111827`, white, electric blue `#3B82F6`, light gray `#F3F4F6` (CSS variables at the top of `src/styles.css`). On load a black "Welcome to AP Creative Studio" splash (markup in `index.html`, timing in `src/main.tsx`) shows for about 2 seconds and then fades into the site. If JavaScript fails, a CSS fail-safe hides it anyway. Background artwork is local SVG in `public/bg/` (no external images, so the CSP stays `img-src 'self'`).

## Icons
The favicon set (`favicon.ico`, `icon-192.png`, `apple-touch-icon.png`) lives in `public/` and is generated from the AP logo.

## Security notes
- No secrets, database or admin panel in this repo. Do not commit `.env`.
- Keep `package-lock.json` committed and Dependabot enabled (`.github/dependabot.yml`).
- The Terms checkbox is a consent prompt, not access control: the WhatsApp number and Form link are public.
- Enable 2FA on GitHub, Vercel and the Google account that owns the form.
- Security contact: `public/.well-known/security.txt`.
