import { getOrder, saveOrder, findByUtr, findByHash } from '../_lib/store.js';
import { sha256Hex } from '../_lib/crypto.js';
import { analyzeEvidence } from '../_lib/fraud.js';
import { UPI_ID } from '../_lib/pricing.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ip = clientIp(req);
  if (!rateLimit('evidence:' + ip, 10, 60_000)) {
    return json(res, 429, { error: 'Too many submissions. Slow down.' });
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const orderId = String(body.orderId || '').trim();
  const utr = String(body.utr || '').trim().toUpperCase();
  const dataUrl = String(body.screenshotDataUrl || '');

  const order = await getOrder(orderId);
  if (!order) return json(res, 404, { error: 'Order not found' });
  if (order.status === 'APPROVED') return json(res, 400, { error: 'Order already approved' });
  if (order.status === 'REJECTED') return json(res, 400, { error: 'Order was rejected' });
  if (order.expiresAt && Date.now() > order.expiresAt && order.status === 'CREATED') {
    order.status = 'EXPIRED';
    await saveOrder(order);
    return json(res, 400, { error: 'Order expired. Create a new payment.' });
  }

  if (!utr) return json(res, 400, { error: 'UTR / transaction reference is required' });
  if (!/^[A-Z0-9]{8,22}$/.test(utr)) {
    return json(res, 400, { error: 'UTR format looks invalid (use 8–22 letters/digits)' });
  }

  const m = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!m) return json(res, 400, { error: 'Screenshot must be a JPEG, PNG, or WebP data URL' });
  const mime = m[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  let bytes;
  try {
    bytes = Buffer.from(m[2].replace(/\s/g, ''), 'base64');
  } catch {
    return json(res, 400, { error: 'Could not decode screenshot' });
  }
  if (!bytes.length || bytes.length > MAX_BYTES) {
    return json(res, 400, { error: 'Screenshot must be under 4 MB' });
  }

  const hash = sha256Hex(bytes);
  const byUtr = await findByUtr(utr);
  const byHash = await findByHash(hash);

  const risk = analyzeEvidence({
    expectedAmountInr: order.amountInr,
    expectedUpiId: UPI_ID,
    utr,
    screenshotBytes: bytes,
    screenshotMime: mime,
    existingByUtr: byUtr,
    existingByHash: byHash,
    currentOrderId: order.id
  });

  order.utr = utr;
  order.screenshotHash = hash;
  order.screenshotMime = mime;
  order.screenshotName = String(body.filename || 'screenshot').slice(0, 80);
  order.screenshotSize = bytes.length;
  order.evidenceSubmittedAt = Date.now();
  order.risk = risk;
  order.status = 'PENDING_REVIEW';

  await saveOrder(order);

  return json(res, 200, {
    orderId: order.id,
    status: order.status,
    riskLevel: risk.riskLevel,
    findings: risk.findings,
    disclaimer: risk.disclaimer,
    message:
      'Evidence received. Status is PENDING_REVIEW. An administrator must confirm payment before ZIP unlock. This is not automatic bank verification.'
  });
}
