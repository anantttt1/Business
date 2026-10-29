import crypto from 'crypto';
import { applyTrustedCredit, hasWebhookSecret } from '../_lib/verify.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  if (!hasWebhookSecret()) {
    return json(res, 503, {
      error: 'PAYMENT_WEBHOOK_SECRET not configured — trusted auto-verification disabled'
    });
  }

  const ip = clientIp(req);
  if (!rateLimit('wh:' + ip, 60, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }

  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const hdr =
    req.headers['x-webhook-secret'] ||
    req.headers['x-payment-secret'] ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!timingSafeEqualStr(hdr, secret)) {
    return json(res, 401, { error: 'Invalid webhook secret' });
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const result = await applyTrustedCredit({
    orderId: body.orderId || body.order_id || null,
    utr: body.utr || body.txnId || body.transaction_id || null,
    amountInr: body.amountInr != null ? body.amountInr : body.amount,
    status: body.status || body.txnStatus || '',
    payeeVpa: body.payeeVpa || body.pa || body.vpa || null,
    providerTxnId: body.providerTxnId || body.rrn || null,
    raw: body
  });

  if (!result.ok) return json(res, 422, { error: result.error });
  return json(res, 200, {
    ok: true,
    already: !!result.already,
    orderId: result.order.id,
    status: result.order.status,
    templateId: result.order.templateId
  });
}
