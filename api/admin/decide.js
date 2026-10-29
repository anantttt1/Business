import { getOrder, saveOrder } from '../_lib/store.js';
import { timingSafeEqualStr, signDownloadToken } from '../_lib/crypto.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

function adminOk(req) {
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret || secret.length < 12) return false;
  const h = req.headers['x-admin-secret'] || '';
  return timingSafeEqualStr(h, secret);
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('admin-decide:' + clientIp(req), 30, 60_000)) {
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
  const action = String(body.action || '').toLowerCase();
  const reason = String(body.reason || '').slice(0, 300);

  const order = await getOrder(orderId);
  if (!order) return json(res, 404, { error: 'Order not found' });

  if (action === 'approve') {
    if (order.status === 'APPROVED') {
      return json(res, 200, { ok: true, status: 'APPROVED', message: 'Already approved' });
    }
    if (!['PENDING_REVIEW', 'EVIDENCE_SUBMITTED', 'CREATED'].includes(order.status)) {
      return json(res, 400, { error: 'Cannot approve from status ' + order.status });
    }
    order.status = 'APPROVED';
    order.decision = {
      status: 'APPROVED',
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
    await saveOrder(order);
    return json(res, 200, {
      ok: true,
      status: 'APPROVED',
      orderId: order.id,
      templateId: order.templateId,
      downloadToken: order.downloadToken,
      downloadExpiresAt: exp,
      notice: 'Manual admin approval — not an automatic bank confirmation.'
    });
  }

  if (action === 'reject') {
    order.status = 'REJECTED';
    order.decision = {
      status: 'REJECTED',
      at: Date.now(),
      source: 'admin_manual',
      reason: reason || 'Rejected',
      by: 'admin'
    };
    order.downloadToken = null;
    await saveOrder(order);
    return json(res, 200, { ok: true, status: 'REJECTED', orderId: order.id });
  }

  return json(res, 400, { error: 'action must be approve or reject' });
}
