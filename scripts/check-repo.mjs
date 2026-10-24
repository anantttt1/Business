// Fast guard-rails run by CI before the build. Catches the config mistakes that
// previously broke production deploys or weakened security. No dependencies.
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const problems = []
const read = (f) => JSON.parse(readFileSync(f, 'utf8'))

// 1. Node: never pin a single (soon end-of-life) major. Vercel disables old majors
//    (Node 20 was disabled on 2026-10-01) and then every deploy fails.
const pkg = read('package.json')
const node = pkg.engines?.node
const min = /^\s*>=\s*v?(\d+)/.exec(node ?? '')
if (!min || Number(min[1]) < 22) {
  problems.push(`package.json engines.node is "${node ?? 'missing'}". Use ">=22" (a range), never a single major like "20.x".`)
}

// 2. Security headers must keep a strict CSP.
const headers = Object.fromEntries(read('vercel.json').headers.flatMap((h) => h.headers).map((h) => [h.key, h.value]))
const csp = headers['Content-Security-Policy'] ?? ''
const directive = (name) => (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? '')
if (!csp) problems.push('vercel.json: Content-Security-Policy header is missing.')
if (!directive('default-src').includes("'self'")) problems.push("vercel.json: CSP default-src must include 'self'.")
if (/unsafe-(inline|eval)/.test(directive('script-src'))) problems.push("vercel.json: CSP script-src must not allow 'unsafe-inline' or 'unsafe-eval'.")
if (!directive('frame-ancestors')) problems.push('vercel.json: CSP frame-ancestors is missing (clickjacking protection).')
if (/(^|\s)data:|https?:/.test(directive('img-src'))) problems.push("vercel.json: CSP img-src must stay 'self' only (no data: or external image hosts). Put images in public/.")
if (/unsafe-(inline|eval)/.test(csp)) problems.push("vercel.json: CSP must not contain 'unsafe-inline' or 'unsafe-eval' anywhere.")
if (/https?:|\*/.test(csp)) problems.push('vercel.json: CSP must not allow any external host or wildcard. Self-host the file in public/ instead.')
if (!/object-src 'none'/.test(csp) || !/base-uri ('none'|'self')/.test(csp) || !/form-action 'none'/.test(csp)) problems.push("vercel.json: CSP needs object-src 'none', base-uri and form-action 'none'.")
const hsts = /max-age=(\d+)/.exec(headers['Strict-Transport-Security'] ?? '')
if (!hsts || Number(hsts[1]) < 31536000) problems.push('vercel.json: Strict-Transport-Security max-age must be at least 31536000.')
if (!headers['Referrer-Policy'] || !headers['Permissions-Policy']) problems.push('vercel.json: Referrer-Policy and Permissions-Policy headers are required.')
if (!headers['X-Content-Type-Options']) problems.push('vercel.json: X-Content-Type-Options header is missing.')

// 3. The CSP blocks inline code, so anything inline silently breaks on the live site (it still builds green!).
//    Seen in production: style="" attributes, onerror="" handlers and an inline <script> were all ignored.
const pages = ['index.html', ...readdirSync('public').filter((f) => f.endsWith('.html')).map((f) => 'public/' + f)]
for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  if (/<script(?![^>]*\ssrc=)[^>]*>/i.test(html)) problems.push(`${file}: inline <script> is blocked by the CSP. Move it to a file in public/ and use <script src>.`)
  if (/<style[\s>]/i.test(html)) problems.push(`${file}: inline <style> is blocked by the CSP. Put the CSS in public/ap-styles.css.`)
  if (/\sstyle\s*=/i.test(html)) problems.push(`${file}: style="" attributes are blocked by the CSP. Use a CSS class in public/ap-styles.css.`)
  if (/<img[^>]*\ssrc\s*=\s*["']?(https?:)?\/\//i.test(html)) problems.push(`${file}: <img> points to an external host. The CSP only allows images from this site, and temporary hosts (e.g. litter.catbox.moe) expire. Save the image in public/ and use src="/name.jpg".`)
  if (/<(?:script|img|iframe|source|embed|object|video|audio)\b[^>]*\s(?:src|data)\s*=\s*["']?(?:https?:)?\/\//i.test(html) || /<link\b[^>]*\shref\s*=\s*["']?(?:https?:)?\/\//i.test(html)) problems.push(`${file}: loads a script, style, font or image from another website. The CSP blocks it and it leaks visitors to a third party. Host it in public/.`)
  for (const a of html.match(/<a\b[^>]*target\s*=\s*["']?_blank[^>]*>/gi) ?? []) if (!/rel\s*=\s*["'][^"']*noopener/i.test(a)) problems.push(`${file}: a target="_blank" link is missing rel="noopener noreferrer": ${a.slice(0, 80)}`)
  if (/\son[a-z]+\s*=/i.test(html)) problems.push(`${file}: inline event handlers (onclick=, onerror=, ...) are blocked by the CSP. Use addEventListener in public/ap-app.js.`)
}

for (const f of readdirSync('public').filter((n) => n.endsWith('.css'))) {
  const css = readFileSync('public/' + f, 'utf8')
  if (/@import|url\(\s*["']?(?:https?:)?\/\//i.test(css)) problems.push(`public/${f}: @import / remote url() is not allowed. Host the file in public/.`)
}

// 4. Supply chain: GitHub Actions must be pinned to a full commit SHA (tags can be moved by their owner).
if (existsSync('.github/workflows')) {
  for (const f of readdirSync('.github/workflows')) {
    for (const m of readFileSync('.github/workflows/' + f, 'utf8').matchAll(/uses:\s*([^\s#]+)/g)) {
      if (!m[1].startsWith('./') && !/@[0-9a-f]{40}$/.test(m[1])) problems.push(`.github/workflows/${f}: "${m[1]}" must be pinned to a full commit SHA, not a tag.`)
    }
  }
}

if (problems.length) {
  console.error('\nRepo checks failed:\n' + problems.map((p) => ' - ' + p).join('\n') + '\n\nSee AGENTS.md.')
  process.exit(1)
}
console.log('Repo checks passed.')
