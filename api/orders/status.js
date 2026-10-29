import { getOrder } from '../_lib/store.js';
import { timingSafeEqualStr, verifyOrderToken, signOrderToken } from '../_lib/crypto.js';
import { json, cors, rateLimit, clientIp } from '../_lib/http.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('status:' + clientIp(req), 60, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }

  const url = new URL(req.url, 'http://localhost');
  const orderId = url.searchParams.get('orderId') || '';
  const claim = url.searchParams.get('claim') || '';
  const orderToken = url.searchParams.get('orderToken') || '';

  let fromToken = orderToken ? verifyOrderToken(orderToken) : null;
  let order = fromToken;
  if (!order && orderId) {
    order = await getOrder(orderId);
  }
  if (!order) return json(res, 404, { error: 'Order not found' });

  // Merge store copy without losing downloadToken / claimSecret from the signed token
  if (order.id) {
    try {
      const stored = await getOrder(order.id);
      if (stored) {
        order = {
          ...fromToken,
          ...stored,
          downloadToken: stored.downloadToken || (fromToken && fromToken.downloadToken) || order.downloadToken || null,
          downloadExpiresAt:
            stored.downloadExpiresAt ||
            (fromToken && fromToken.downloadExpiresAt) ||
            order.downloadExpiresAt ||
            null,
          claimSecret: stored.claimSecret || (fromToken && fromToken.claimSecret) || order.claimSecret || null,
          decision: stored.decision || (fromToken && fromToken.decision) || order.decision || null,
          status: stored.status || order.status
        };
      }
    } catch (e) {}
  }

  const out = {
    orderId: order.id,
    templateId: order.templateId,
    templateName: order.templateName,
    amountInr: order.amountInr,
    status: order.status,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    riskLevel: order.risk?.riskLevel || null,
    decision: order.decision
      ? { status: order.decision.status, at: order.decision.at, reason: order.decision.reason || null }
      : null,
    orderToken: signOrderToken(order)
  };

  const claimOk =
    claim &&
    order.claimSecret &&
    timingSafeEqualStr(claim, order.claimSecret);

  if (
    claimOk &&
    (order.status === 'APPROVED' || order.status === 'PAYMENT_CONFIRMED') &&
    order.downloadToken
  ) {
    out.downloadToken = order.downloadToken;
    out.downloadExpiresAt = order.downloadExpiresAt || null;
    out.autoUnlockReady = true;
  }

  return json(res, 200, out);
}
