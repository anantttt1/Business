import { getOrder, saveOrder, findByUtr, findByHash } from '../_lib/store.js';
import { UPI_ID } from '../_lib/pricing.js';
import { sha256Hex, signOrderToken, verifyOrderToken } from '../_lib/crypto.js';
import { analyzeEvidence } from '../_lib/fraud.js';
import { applyScreeningDecision, hasWebhookSecret } from '../_lib/verify.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

const MAX_BYTES = 4 * 1024 * 1024;

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ip = clientIp(req);
  if (!rateLimit('evidence:' + ip, 15, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const orderId = String(body.orderId || '').trim();
  const orderToken = String(body.orderToken || '').trim();
  const utr = String(body.utr || '').trim().toUpperCase();
  const dataUrl = String(body.screenshotDataUrl || '');

  let order = orderToken ? verifyOrderToken(orderToken) : null;
  if (!order && orderId) order = await getOrder(orderId);
  if (!order) {
    return json(res, 404, {
      error:
        'Order not found. Keep this browser tab open after creating the order, or set Upstash KV for durable storage.'
    });
  }

  if (order.id) {
    try {
      const stored = await getOrder(order.id);
      if (stored) order = stored;
    } catch (e) {}
  }

  if (orderId && order.id !== orderId) {
    return json(res, 400, { error: 'orderId does not match orderToken' });
  }

  if (order.status === 'APPROVED' || order.status === 'PAYMENT_CONFIRMED') {
    return json(res, 200, {
      orderId: order.id,
      orderToken: signOrderToken(order),
      status: order.status,
      message: 'Payment already confirmed',
      downloadToken: order.downloadToken || null
    });
  }
  if (order.status === 'REJECTED') return json(res, 400, { error: 'Order was rejected' });
  if (order.status === 'REFUNDED') return json(res, 400, { error: 'Order was refunded' });
  if (order.expiresAt && Date.now() > order.expiresAt) {
    order.status = 'EXPIRED';
    try {
      await saveOrder(order);
    } catch (e) {}
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
  let byUtr = null;
  let byHash = null;
  try {
    byUtr = await findByUtr(utr);
    byHash = await findByHash(hash);
  } catch (e) {}

  if (
    byUtr &&
    byUtr.id !== order.id &&
    (byUtr.status === 'APPROVED' || byUtr.status === 'PAYMENT_CONFIRMED')
  ) {
    return json(res, 409, { error: 'This UTR was already used for another purchase' });
  }

  const risk = await analyzeEvidence({
    expectedAmountInr: order.amountInr,
    expectedUpiId: UPI_ID,
    utr,
    screenshotBytes: bytes,
    screenshotMime: mime,
    existingByUtr: byUtr,
    existingByHash: byHash,
    currentOrderId: order.id,
    orderCreatedAt: order.createdAt,
    orderExpiresAt: order.expiresAt
  });

  order.utr = utr;
  order.screenshotHash = hash;
  order.screenshotMime = mime;
  order.screenshotName = String(body.filename || 'screenshot').slice(0, 80);
  order.screenshotSize = bytes.length;
  order.evidenceSubmittedAt = Date.now();
  order.risk = risk;
  if (risk.signals?.perceptualHash) {
    order.perceptualHash = risk.signals.perceptualHash;
  }

  let result;
  try {
    result = await applyScreeningDecision(order, risk);
  } catch (e) {
    return json(res, 503, {
      error: 'Could not persist verification decision. Configure durable storage (Upstash KV).',
      storeError: true
    });
  }

  order = result.order;
  const outcome = result.outcome;

  const payload = {
    orderId: order.id,
    orderToken: signOrderToken(order),
    status: order.status,
    decisionCode: outcome.code,
    riskLevel: risk.riskLevel,
    riskScore: risk.riskScore,
    findings: risk.findings,
    ocr: risk.signals?.ocr
      ? {
          engine: risk.signals.ocr.engine,
          evidenceConfidence: risk.signals.ocr.evidenceConfidence,
          found: risk.signals.ocr.found,
          missing: risk.signals.ocr.missing,
          conflicts: risk.signals.ocr.conflicts,
          fields: risk.signals.ocr.fields
        }
      : null,
    disclaimer: risk.disclaimer,
    autoUnlockReady: order.status === 'APPROVED',
    screeningOnly: !!outcome.screeningOnly,
    webhookConfigured: hasWebhookSecret(),
    message: outcome.message
  };

  if (order.status === 'APPROVED' && order.downloadToken) {
    payload.downloadToken = order.downloadToken;
    payload.downloadExpiresAt = order.downloadExpiresAt;
  }

  return json(res, 200, payload);
}
