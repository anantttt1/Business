import crypto from 'crypto';

const WEAK_DEFAULTS = new Set([
  'dev-only-insecure-secret-change-me',
  'secret',
  'changeme',
  'password',
  'admin',
  ''
]);

export function softSecret() {
  const s =
    process.env.PAYMENT_HMAC_SECRET ||
    process.env.ADMIN_SECRET ||
    '';
  if (!s || s.length < 16 || WEAK_DEFAULTS.has(s.toLowerCase())) {
    // Deterministic but host-specific fallback so tokens work in single-instance
    // dev without env; still warn via length check in production monitors.
    const host = process.env.VERCEL_URL || process.env.HOSTNAME || 'local';
    return crypto.createHash('sha256').update('ap-pay-fallback:' + host).digest('hex');
  }
  return s;
}

export function randomId(prefix) {
  return (prefix || 'ord') + '_' + crypto.randomBytes(12).toString('hex');
}

export function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function hmacSign(payload) {
  const secret = softSecret();
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Signed, client-held order blob — survives serverless cold starts without Redis. */
export function signOrderToken(order) {
  const body = {
    id: order.id,
    templateId: order.templateId,
    templateName: order.templateName,
    amountInr: order.amountInr,
    status: order.status,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    claimSecret: order.claimSecret,
    utr: order.utr || null,
    screenshotHash: order.screenshotHash || null,
    screenshotMime: order.screenshotMime || null,
    screenshotSize: order.screenshotSize || null,
    evidenceSubmittedAt: order.evidenceSubmittedAt || null,
    // Keep decision status only — drop bulky risk findings from client token
    decision: order.decision
      ? {
          status: order.decision.status,
          code: order.decision.code || null,
          at: order.decision.at || null,
          source: order.decision.source || null
        }
      : null,
    downloadToken: order.downloadToken || null,
    downloadExpiresAt: order.downloadExpiresAt || null
  };
  const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = hmacSign(payload);
  return payload + '.' + sig;
}

export function verifyOrderToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    if (!payload || !sig || payload.length > 20000) return null;
    const expected = hmacSign(payload);
    if (!timingSafeEqualStr(sig, expected)) return null;
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!body || !body.id || !body.templateId || body.amountInr == null) return null;
    if (typeof body.id !== 'string' || body.id.length > 80) return null;
    if (body.expiresAt && Date.now() > Number(body.expiresAt) + 1000 * 60 * 60 * 24 * 7) {
      // Token far past order expiry window
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

export function signDownloadToken({ orderId, templateId, exp }) {
  const payload = `${orderId}.${templateId}.${exp}`;
  const sig = hmacSign(payload);
  return Buffer.from(JSON.stringify({ orderId, templateId, exp, sig })).toString('base64url');
}

export function verifyDownloadToken(token) {
  try {
    if (!token || String(token).length > 2000) return null;
    const raw = JSON.parse(Buffer.from(String(token), 'base64url').toString('utf8'));
    const { orderId, templateId, exp, sig } = raw || {};
    if (!orderId || !templateId || !exp || !sig) return null;
    if (typeof orderId !== 'string' || typeof templateId !== 'string') return null;
    if (Date.now() > Number(exp)) return null;
    const expected = hmacSign(`${orderId}.${templateId}.${exp}`);
    const a = Buffer.from(String(sig));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return { orderId, templateId, exp: Number(exp) };
  } catch {
    return null;
  }
}
