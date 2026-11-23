// POST /api/enquiry — receives the popup's JSON, validates it, forwards it to the existing Google Form's
// `formResponse` endpoint and answers { ok: true } ONLY when Google's reply proves the response was recorded.
//
// Why a server hop instead of posting from the browser: a cross-origin POST to docs.google.com can only be sent
// "no-cors", which returns an opaque response, so the page can never know whether Google accepted it.
// Here the server can read Google's reply, so success is confirmed instead of assumed.
import { json, readBody, rateLimit, clientIp } from './_lib/http.js';
import {
  FORM_ID,
  FIELDS,
  EXTRA_PARAMS,
  PHONE_FORMAT,
  CONFIRMATION_MARKERS,
  isConfigured,
} from './_lib/enquiry-form.js';

const MAX_BODY_BYTES = 16 * 1024;
const GOOGLE_TIMEOUT_MS = 8000;
const FORMS_BASE = 'https://docs.google.com/forms/d/e/';

// ---- validation (mirrors public/enquiry.js; the server never trusts the browser) -------------------------------
const EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;

function clean(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g, '')
    .trim()
    .slice(0, max);
}

// Stops spreadsheet formula injection (a cell that starts with = + - @ is run as a formula by Sheets/Excel).
function defuse(text) {
  return /^[=+\-@\t]/.test(text) ? "'" + text : text;
}

export function normalisePhone(raw, format = PHONE_FORMAT) {
  const hadPlus = /^\s*\+/.test(raw);
  let d = String(raw).replace(/\D/g, '');
  if (!hadPlus && d.startsWith('00')) d = d.slice(2);
  let national = null;
  if (d.length === 10 && /^[6-9]/.test(d)) national = d; // Indian mobile typed without country code
  else if (d.length === 12 && d.startsWith('91') && /^[6-9]/.test(d.slice(2))) national = d.slice(2);
  else if (d.length === 11 && d.startsWith('0') && /^[6-9]/.test(d.slice(1))) national = d.slice(1);
  if (national) {
    if (format === 'local') return national;
    return format === 'digits' ? '91' + national : '+91' + national;
  }
  // Any other country: the number must carry its country code, 8-15 digits (E.164)
  if ((hadPlus && d.length >= 8 && d.length <= 15) || (!hadPlus && d.length >= 11 && d.length <= 15)) {
    return format === 'digits' ? d : '+' + d;
  }
  return null;
}

export function normaliseLinkedIn(raw) {
  let text = String(raw).trim();
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) text = 'https://' + text;
  let u;
  try {
    u = new URL(text);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (!(host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'lnkd.in')) return null;
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  return u.toString();
}

export function validate(input) {
  const errors = {};
  const out = {};
  const get = (k) => clean(input?.[k], FIELDS[k].max + 50); // keep a little extra so "too long" can be reported

  for (const key of Object.keys(FIELDS)) {
    const f = FIELDS[key];
    let v = get(key);
    if (!v) {
      if (f.required) errors[key] = 'This field is required.';
      continue;
    }
    if (v.length > f.max) {
      errors[key] = `Please keep this under ${f.max} characters.`;
      continue;
    }
    if (key === 'email' && !EMAIL_RE.test(v)) errors[key] = 'Enter a valid email address.';
    else if (key === 'whatsapp') {
      const p = normalisePhone(v);
      if (!p) errors[key] = 'Enter a valid WhatsApp number (include the country code if it is not an Indian number).';
      else v = p;
    } else if (key === 'linkedin') {
      const l = normaliseLinkedIn(v);
      if (l === null) errors[key] = 'Enter a valid LinkedIn profile link (linkedin.com/in/…).';
      else v = l;
    } else if (key === 'requirements' && v.length < 10) {
      errors[key] = 'Please add a few more details (at least 10 characters).';
    } else if (key === 'fullName' && v.length < 2) {
      errors[key] = 'Enter your full name.';
    }
    if (!errors[key]) out[key] = key === 'whatsapp' || key === 'email' ? v : defuse(v);
  }
  return { errors, values: out };
}

// ---- Google's answer -> our verdict ---------------------------------------------------------------------------
// Pure function so it can be tested with recorded responses.
export function classifyGoogleResponse({ status, location = '', body = '' }) {
  if (status >= 300 && status < 400) {
    return /accounts\.google\.com|ServiceLogin/i.test(location) ? 'login_required' : 'unconfirmed';
  }
  if (status === 401 || status === 403) return 'login_required';
  if (status === 404) return 'not_found';
  if (status === 400) return 'rejected';
  if (status === 429 || status >= 500) return 'upstream';
  if (status === 200) {
    return CONFIRMATION_MARKERS.some((re) => re.test(body)) ? 'ok' : 'unconfirmed';
  }
  return 'unconfirmed';
}

// Content hashes of enquiries Google already confirmed: a double-click or a retry after a timeout must not add a
// second row. Best effort (memory of one serverless instance), the browser also disables the button while sending.
const recent = globalThis.__AP_ENQ_RECENT__ || (globalThis.__AP_ENQ_RECENT__ = new Map());
function fingerprint(values) {
  return JSON.stringify(Object.keys(FIELDS).map((k) => values[k] || ''));
}

const STATUS = {
  invalid: 422,
  not_configured: 503,
  rate_limited: 429,
  bad_origin: 403,
  too_large: 413,
  login_required: 502,
  not_found: 502,
  rejected: 502,
  unconfirmed: 502,
  upstream: 504,
};

function fail(res, code, extra = {}) {
  return json(res, STATUS[code] || 500, { ok: false, code, ...extra });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, code: 'method' });
  }

  // Same-origin only: a browser always sends Origin on a cross-site POST.
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === String(req.headers.host || '');
    } catch {}
    if (!ok) return fail(res, 'bad_origin');
  }

  if (!rateLimit('enquiry:' + clientIp(req), 6, 10 * 60_000)) return fail(res, 'rate_limited');

  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) return fail(res, 'too_large');
  let input;
  try {
    const raw = await readBody(req);
    if (raw.length > MAX_BODY_BYTES) return fail(res, 'too_large');
    input = JSON.parse(raw.toString('utf8') || '{}');
  } catch {
    return fail(res, 'invalid', { fields: {} });
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail(res, 'invalid', { fields: {} });

  // Honeypot: real visitors never see or fill this field.
  if (clean(input.hp_note, 50)) return fail(res, 'invalid', { fields: {} });

  const { errors, values } = validate(input);
  if (Object.keys(errors).length) return fail(res, 'invalid', { fields: errors });

  if (!isConfigured()) {
    console.error('[enquiry] not configured: Google Form entry ids are not verified yet (api/_lib/enquiry-form.js)');
    return fail(res, 'not_configured');
  }

  const print = fingerprint(values);
  const seen = recent.get(print);
  if (seen && Date.now() - seen < 10 * 60_000) return json(res, 200, { ok: true, duplicate: true });

  const params = new URLSearchParams();
  for (const [key, f] of Object.entries(FIELDS)) {
    if (f.entry && values[key]) params.append('entry.' + f.entry, values[key]);
  }
  for (const [k, v] of Object.entries(EXTRA_PARAMS)) params.append(k, String(v));

  const base = process.env.VERCEL ? FORMS_BASE : process.env.ENQUIRY_TEST_BASE || FORMS_BASE; // test override never applies on Vercel
  let verdict = 'upstream';
  let status = 0;
  try {
    const r = await fetch(`${base}${FORM_ID}/formResponse?hl=en`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; APCreativeStudio-Enquiry/1.0)',
      },
      body: params.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });
    status = r.status;
    const text = (await r.text()).slice(0, 400_000);
    verdict = classifyGoogleResponse({ status, location: r.headers.get('location') || '', body: text });
  } catch (e) {
    verdict = 'upstream';
  }

  if (verdict !== 'ok') {
    // Never log answers (personal data); the verdict and Google's HTTP status are enough to debug.
    console.error('[enquiry] not confirmed:', verdict, 'google status', status);
    return fail(res, verdict);
  }

  recent.set(print, Date.now());
  if (recent.size > 500) for (const [k, t] of recent) if (Date.now() - t > 10 * 60_000) recent.delete(k);
  return json(res, 200, { ok: true });
}
