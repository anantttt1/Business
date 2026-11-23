# Rules for anyone (or any AI tool) editing this repo

This site deploys to Vercel from `main`. A failed build never replaces the live site,
but nothing new gets published either. These rules keep builds green.

1. **Build before you push.** `npm install && npm run build` must pass. CI runs the same
   thing on every push and pull request.
2. **Never pin Node to one major** in `package.json`. Keep `"engines": { "node": ">=22" }`.
   Vercel disables old majors (Node 20 was disabled on 2026-10-01) and then every deploy fails.
   `scripts/check-repo.mjs` enforces this.
3. **Keep the security headers in `vercel.json` strict**: no `unsafe-inline` / `unsafe-eval`
   in `script-src`, keep `frame-ancestors`, `img-src 'self'`, `form-action 'none'`. Put images in
   `public/` and reference them as `/path`; do not add external image hosts or inline scripts/styles.
   The site is static now (`index.html` + `public/ap-app.js` + `public/ap-styles.css`). The CSP silently ignores
   inline `<script>`, `<style>`, `style=""` and `onclick=`/`onerror=`, so the page still builds but looks broken
   live. Use CSS classes and `addEventListener` in the files above; `scripts/check-repo.mjs` fails the build on any inline code.
4. **No third-party requests.** Fonts live in `public/fonts/`, images in `public/`. Do not add Google
   Fonts, CDNs, analytics or externally hosted images (temporary hosts like catbox expire and the CSP blocks
   them). Every `target="_blank"` link needs `rel="noopener noreferrer"`. GitHub Actions in `.github/workflows`
   must be pinned to a full commit SHA. `scripts/check-repo.mjs` enforces all of this.
5. **Commit `package-lock.json`** together with any dependency change. Do not delete it.
6. **Contact details live in two places.** The WhatsApp number (919286034026), Google Form link and email
   appear in `index.html` and in the `WA` constant of `public/ap-app.js`. Change both together. The `src/`
   folder and `vite.config.ts` are the old React version and are not deployed. `public/terms.html` and
   `public/privacy.html` are static text, so update them by hand when policies change.
7. **Do not undo other people's changes.** `git fetch` and rebase/merge before pushing.
8. **Enquiry popup.** The popup lives in `public/enquiry.js` + `public/enquiry.css`; any element with `data-enquiry`
   opens it (its `href` stays as the fallback). It only takes the buttons over after `GET /api/enquiry` answers
   `{ready:true}`; until a backend is configured the buttons behave as before. Answers go to `POST /api/enquiry`
   (`api/enquiry.js`), which answers `ok:true` only after the backend confirms the save. Backends
   (`api/_lib/enquiry-form.js`): **sheet** (active when the Vercel env vars `ENQUIRY_SCRIPT_URL` and
   `ENQUIRY_SCRIPT_SECRET` are set; Google Apps Script in the Google Sheet, `integrations/google-sheet/`, setup in its
   README) and **form** (dormant: posts to the existing Google Form's `formResponse`; the form currently requires Google
   sign-in, so no website can submit to it). Never guess Google Form entry ids and never put the secret in the repo.
