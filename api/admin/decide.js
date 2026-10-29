import { getOrder, saveOrder } from '../_lib/store.js';
import { timingSafeEqualStr, signDownloadToken, verifyOrderToken, signOrderToken } from '../_lib/crypto.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

function adminOk(req) {
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret || secret.length < 16) return false;
  const h = req.headers['x-admin-secret'] || '';
  return timingSafeEqualStr(h, secret);
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('admin-decide:' + clientIp(req), 20, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }
  if (!adminOk(req)) return json(res, 401, { error: 'Unauthorized' });

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const orderId = String(body.orderId || '').trim();
  const orderToken = String(body.orderToken || '').trim();
  const action = String(body.action || '').toLowerCase();
  const reason = String(body.reason || '').slice(0, 300);

  let order = orderToken ? verifyOrderToken(orderToken) : null;
  if (!order && orderId) {
    order = await getOrder(orderId);
  }
  if (!order) {
    return json(res, 404, {
      error: 'Order not found — paste the buyer orderToken if store is ephemeral'
    });
  }

  if (order.id) {
    try {
      const stored = await getOrder(order.id);
      if (stored) order = { ...order, ...stored };
    } catch (e) {}
  }

  if (action === 'approve') {
    if (order.status === 'APPROVED' && order.downloadToken) {
      return json(res, 200, {
        ok: true,
        status: 'APPROVED',
        message: 'Already approved',
        downloadToken: order.downloadToken,
        orderToken: signOrderToken(order)
      });
    }
    const allowed = ['PENDING_REVIEW', 'EVIDENCE_SUBMITTED', 'VERIFYING'];
    if (!allowed.includes(order.status)) {
      return json(res, 400, {
        error: 'Cannot approve from status ' + order.status + ' (need evidence submitted first)'
      });
    }
    if (!order.utr) {
      return json(res, 400, { error: 'Cannot approve without a submitted UTR' });
    }
    order.status = 'APPROVED';
    order.decision = {
      status: 'APPROVED',
      code: 'ADMIN_MANUAL',
      at: Date.now(),
      source: 'admin_manual',
      reason: reason || 'Manual approval after evidence review',
      by: 'admin'
    };
    const exp = Date.now() + 1000 * 60 * 60 * 48;
    order.downloadToken = signDownloadToken({
      orderId: order.id,
      templateId: order.templateId,
      exp
    });
    order.downloadExpiresAt = exp;
    try {
      await saveOrder(order);
    } catch (e) {}
    const token = signOrderToken(order);
    return json(res, 200, {
      ok: true,
      status: 'APPROVED',
      orderId: order.id,
      templateId: order.templateId,
      downloadToken: order.downloadToken,
      downloadExpiresAt: exp,
      orderToken: token,
      notice:
        'Manual admin approval — not an automatic bank confirmation. Buyer needs updated orderToken or must poll while store holds the order.'
    });
  }

  if (action === 'reject') {
    order.status = 'REJECTED';
    order.decision = {
      status: 'REJECTED',
      code: 'ADMIN_REJECT',
      at: Date.now(),
      source: 'admin_manual',
      reason: reason || 'Rejected',
      by: 'admin'
    };
    order.downloadToken = null;
    try {
      await saveOrder(order);
    } catch (e) {}
    return json(res, 200, {
      ok: true,
      status: 'REJECTED',
      orderId: order.id,
      orderToken: signOrderToken(order)
    });
  }

  return json(res, 400, { error: 'action must be approve or reject' });
}
