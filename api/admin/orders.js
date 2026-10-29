import { listOrders } from '../_lib/store.js';
import { timingSafeEqualStr } from '../_lib/crypto.js';
import { json, cors, clientIp, rateLimit } from '../_lib/http.js';

function adminOk(req) {
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret || secret.length < 12) return false;
  const h = req.headers['x-admin-secret'] || '';
  return timingSafeEqualStr(h, secret);
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit('admin:' + clientIp(req), 30, 60_000)) {
    return json(res, 429, { error: 'Too many requests' });
  }
  if (!adminOk(req)) return json(res, 401, { error: 'Unauthorized' });

  const orders = await listOrders(200);
  return json(res, 200, {
    orders: orders.map((o) => ({
      id: o.id,
      templateId: o.templateId,
      templateName: o.templateName,
      amountInr: o.amountInr,
      status: o.status,
      utr: o.utr,
      screenshotHash: o.screenshotHash,
      screenshotMime: o.screenshotMime,
      screenshotSize: o.screenshotSize,
      risk: o.risk,
      createdAt: o.createdAt,
      evidenceSubmittedAt: o.evidenceSubmittedAt,
      decision: o.decision,
      clientIp: o.clientIp
    }))
  });
}
