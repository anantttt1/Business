import { getTemplatePrice, buildUpiUri, UPI_ID, UPI_PAYEE_NAME } from '../_lib/pricing.js';
import { randomId, signOrderToken } from '../_lib/crypto.js';
import { saveOrder, storeMode } from '../_lib/store.js';
import { json, readBody, cors, clientIp, rateLimit } from '../_lib/http.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const ip = clientIp(req);
  if (!rateLimit('create:' + ip, 20, 60_000)) {
    return json(res, 429, { error: 'Too many requests. Try again in a minute.' });
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const templateId = String(body.templateId || '').trim();
  const tpl = getTemplatePrice(templateId);
  if (!tpl) return json(res, 400, { error: 'Unknown templateId' });

  const order = {
    id: randomId('ord'),
    templateId: tpl.id,
    templateName: tpl.name,
    amountInr: tpl.priceInr,
    status: 'CREATED',
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    clientIp: ip,
    utr: null,
    screenshotHash: null,
    screenshotMime: null,
    screenshotName: null,
    evidenceSubmittedAt: null,
    risk: null,
    decision: null,
    buyerNote: String(body.buyerNote || '').slice(0, 200),
    claimSecret: randomId('claim')
  };

  order.upiUri = buildUpiUri({
    amountInr: order.amountInr,
    orderId: order.id,
    templateName: order.templateName
  });
  order.upiId = UPI_ID;
  order.payeeName = UPI_PAYEE_NAME;

  try {
    await saveOrder(order);
  } catch (e) {
    // Store is best-effort; signed orderToken is source of truth
  }

  const orderToken = signOrderToken(order);

  return json(res, 201, {
    orderId: order.id,
    claimSecret: order.claimSecret,
    orderToken,
    templateId: order.templateId,
    templateName: order.templateName,
    amountInr: order.amountInr,
    upiId: order.upiId,
    payeeName: order.payeeName,
    upiUri: order.upiUri,
    status: order.status,
    expiresAt: order.expiresAt,
    storeMode: storeMode(),
    notice:
      'Pay the exact amount to the UPI ID shown. Then upload a genuine payment screenshot and UTR. Approval is manual; screenshots are not bank verification.'
  });
}
