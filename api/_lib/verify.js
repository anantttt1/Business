/**
 * Server-side payment decision engine.
 * Trusted confirmation only via signed webhook / configured provider.
 * Screenshots + UTR alone never grant APPROVED.
 */
import { getOrder, saveOrder, findByUtr } from './store.js';
import { UPI_ID } from './pricing.js';
import { signDownloadToken } from './crypto.js';

export function hasWebhookSecret() {
  return Boolean(process.env.PAYMENT_WEBHOOK_SECRET && process.env.PAYMENT_WEBHOOK_SECRET.length >= 12);
}

/**
 * Apply trusted credit notification to an order.
 */
export async function applyTrustedCredit({
  orderId,
  utr,
  amountInr,
  status,
  payeeVpa,
  providerTxnId,
  raw
}) {
  const st = String(status || '').toLowerCase();
  if (['failed', 'failure', 'cancelled', 'canceled', 'reversed', 'refunded', 'pending'].includes(st)) {
    return { ok: false, error: 'Transaction status is not successful: ' + st };
  }
  if (!['success', 'successful', 'completed', 'credited', 'captured', 'paid'].includes(st)) {
    return { ok: false, error: 'Transaction status must be an explicit success value' };
  }

  if (payeeVpa) {
    const norm = (s) => String(s).toLowerCase().replace(/\s/g, '');
    if (norm(payeeVpa) !== norm(UPI_ID)) {
      return { ok: false, error: 'Recipient VPA does not match merchant UPI' };
    }
  }

  let order = null;
  if (orderId) order = await getOrder(orderId);
  if (!order && utr) order = await findByUtr(String(utr).toUpperCase());
  if (!order) return { ok: false, error: 'No matching order for this transaction' };

  if (order.status === 'APPROVED' || order.status === 'PAYMENT_CONFIRMED') {
    return { ok: true, order, already: true };
  }
  if (['REJECTED', 'REFUNDED', 'EXPIRED'].includes(order.status)) {
    return { ok: false, error: 'Order is in terminal state ' + order.status };
  }

  const expected = Number(order.amountInr);
  const got = Number(amountInr);
  if (!Number.isFinite(got) || Math.abs(got - expected) > 0.009) {
    return { ok: false, error: 'Amount mismatch: expected ₹' + expected + ', got ₹' + got };
  }

  const utrClean = String(utr || order.utr || '').trim().toUpperCase();
  if (utrClean) {
    const other = await findByUtr(utrClean);
    if (other && other.id !== order.id && (other.status === 'APPROVED' || other.status === 'PAYMENT_CONFIRMED')) {
      return { ok: false, error: 'UTR already entitled another order' };
    }
  }

  const exp = Date.now() + 1000 * 60 * 60 * 48;
  order.status = 'APPROVED';
  order.utr = utrClean || order.utr;
  order.trusted = {
    confirmedAt: Date.now(),
    source: 'webhook',
    status: st,
    amountInr: got,
    payeeVpa: payeeVpa || UPI_ID,
    providerTxnId: providerTxnId || null,
    rawSummary: raw ? String(JSON.stringify(raw)).slice(0, 500) : null
  };
  order.decision = {
    status: 'APPROVED',
    at: Date.now(),
    source: 'trusted_webhook',
    reason: 'Trusted transaction confirmation matched order amount and recipient',
    by: 'system'
  };
  order.downloadToken = signDownloadToken({
    orderId: order.id,
    templateId: order.templateId,
    exp
  });
  order.downloadExpiresAt = exp;

  await saveOrder(order);
  return { ok: true, order };
}

/** After evidence submit: never auto-approve from screenshot alone. */
export function evidenceOnlyOutcome(risk) {
  if (risk && (risk.riskLevel === 'HIGH' || risk.riskLevel === 'INSUFFICIENT')) {
    return {
      status: 'VERIFYING',
      message:
        'Evidence received but risk checks are incomplete or high-risk. ZIP stays locked until a trusted transaction confirmation arrives.'
    };
  }
  return {
    status: 'VERIFYING',
    message:
      'Evidence received. Automatic unlock requires a trusted confirmation of this UTR and amount. Screenshot alone cannot unlock the ZIP.'
  };
}
