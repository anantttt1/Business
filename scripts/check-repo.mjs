// Fast guard-rails run by CI before the build. Catches the config mistakes that
// previously broke production deploys or weakened security. No dependencies.
import { readFileSync } from 'node:fs'

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
if (!headers['X-Content-Type-Options']) problems.push('vercel.json: X-Content-Type-Options header is missing.')

if (problems.length) {
  console.error('\nRepo checks failed:\n' + problems.map((p) => ' - ' + p).join('\n') + '\n\nSee AGENTS.md.')
  process.exit(1)
}
console.log('Repo checks passed.')
