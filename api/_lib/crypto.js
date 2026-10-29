import crypto from 'crypto';

export function softSecret() {
  return process.env.PAYMENT_HMAC_SECRET || process.env.ADMIN_SECRET || 'dev-only-insecure-secret-change-me';
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
    risk: order.risk || null,
    decision: order.decision || null,
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
    const expected = hmacSign(payload);
    if (!timingSafeEqualStr(sig, expected)) return null;
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!body || !body.id || !body.templateId || body.amountInr == null) return null;
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
    const raw = JSON.parse(Buffer.from(String(token), 'base64url').toString('utf8'));
    const { orderId, templateId, exp, sig } = raw || {};
    if (!orderId || !templateId || !exp || !sig) return null;
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
