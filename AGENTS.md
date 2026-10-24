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
4. **JSX template literals must be closed.** `className={`a ${b ? 'x' : ''}`}` needs both `}`.
   A missing one broke every deploy once.
5. **Commit `package-lock.json`** together with any dependency change. Do not delete it.
6. **One source of truth.** Prices, services, WhatsApp number, Google Form and email live in
   `src/config.ts`. Prices are hidden while `showPrices` is `false` (services are free for now); set it to `true` to bring them back. `public/terms.html` is static text, so update it by hand if policies change.
7. **Do not undo other people's changes.** `git fetch` and rebase/merge before pushing.
