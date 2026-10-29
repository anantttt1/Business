/**
 * Server-side payment decision engine.
 *
 * Two paths:
 * 1. Trusted webhook / provider confirmation → real APPROVED (funds confirmed).
 * 2. Screenshot screening → AUTO_APPROVED_SCREENING_PASSED when risk is LOW
 *    (on by default; set SCREENING_AUTO_APPROVE=false to disable).
 *    This is NOT bank confirmation.
 *
 * Screenshots alone never prove receipt of money.
 */
import { getOrder, saveOrder, findByUtr } from './store.js';
import { UPI_ID } from './pricing.js';
import { signDownloadToken } from './crypto.js';
import { screeningDecisionCode } from './fraud.js';

export function hasWebhookSecret() {
  return Boolean(
    process.env.PAYMENT_WEBHOOK_SECRET && process.env.PAYMENT_WEBHOOK_SECRET.length >= 12
  );
}

/** On by default. Only off if explicitly set to false/0/no. */
export function screeningAutoApproveEnabled() {
  const v = String(process.env.SCREENING_AUTO_APPROVE ?? 'true').toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return true;
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
    if (
      other &&
      other.id !== order.id &&
      (other.status === 'APPROVED' || other.status === 'PAYMENT_CONFIRMED')
    ) {
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
    code: 'TRUSTED_WEBHOOK',
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

/**
 * Decide from screenshot screening only.
 * Returns structured outcome; may mutate order to APPROVED when auto-approve is on.
 */
export function decideFromScreening(order, risk) {
  const code = screeningDecisionCode(risk);
  const auto = screeningAutoApproveEnabled();

  if (code === 'AUTO_APPROVED_SCREENING_PASSED' && auto) {
    const exp = Date.now() + 1000 * 60 * 60 * 48;
    order.status = 'APPROVED';
    order.decision = {
      status: 'APPROVED',
      code: 'AUTO_APPROVED_SCREENING_PASSED',
      at: Date.now(),
      source: 'screenshot_screening',
      reason:
        'Automated screenshot screening passed (LOW risk, valid UTR + image, no duplicates). This is NOT bank-confirmed receipt of funds.',
      by: 'system',
      disclaimer: risk.disclaimer
    };
    order.downloadToken = signDownloadToken({
      orderId: order.id,
      templateId: order.templateId,
      exp
    });
    order.downloadExpiresAt = exp;
    return {
      status: 'APPROVED',
      code,
      message:
        'Screening passed — ZIP unlocked. Note: this is automated screenshot screening only, not bank confirmation of payment.',
      autoUnlockReady: true
    };
  }

  // Reject / insufficient paths
  if (
    [
      'REJECTED_DUPLICATE_REFERENCE',
      'REJECTED_INVALID_EVIDENCE',
      'REJECTED_EXPIRED_ORDER',
      'REJECTED_INCONSISTENT_DETAILS',
      'REJECTED_AMOUNT_MISMATCH',
      'REJECTED_RECIPIENT_MISMATCH',
      'REJECTED_TRANSACTION_FAILURE'
    ].includes(code)
  ) {
    order.status = 'REJECTED';
    order.decision = {
      status: 'REJECTED',
      code,
      at: Date.now(),
      source: 'screenshot_screening',
      reason: (risk.findings && risk.findings[0]) || code,
      by: 'system'
    };
    return {
      status: 'REJECTED',
      code,
      message: 'Evidence rejected: ' + ((risk.findings && risk.findings[0]) || code),
      autoUnlockReady: false
    };
  }

  // Default: stay in VERIFYING until trusted confirmation or better evidence
  order.status = 'VERIFYING';
  order.decision = {
    status: 'VERIFYING',
    code: code || 'INSUFFICIENT_EVIDENCE',
    at: Date.now(),
    source: 'screenshot_screening',
    reason:
      'Evidence recorded. ZIP unlocks after trusted payment confirmation or when screening risk is LOW.',
    by: 'system'
  };
  return {
    status: 'VERIFYING',
    code: code || 'INSUFFICIENT_EVIDENCE',
    message: hasWebhookSecret()
      ? 'Evidence received. Waiting for trusted transaction confirmation. Screenshot alone is not bank proof.'
      : 'Evidence received. Risk too high for auto-unlock, or checks incomplete. Submit a clearer screenshot/UTR or wait for confirmation.',
    autoUnlockReady: false,
    webhookConfigured: hasWebhookSecret()
  };
}

/** Legacy helper kept for compatibility. */
export function evidenceOnlyOutcome(risk) {
  const code = screeningDecisionCode(risk);
  if (code === 'AUTO_APPROVED_SCREENING_PASSED' && screeningAutoApproveEnabled()) {
    return {
      status: 'APPROVED',
      message:
        'Screening passed — ZIP unlocked (screenshot screening only, not bank confirmation).'
    };
  }
  if (risk && (risk.riskLevel === 'HIGH' || risk.riskLevel === 'INSUFFICIENT')) {
    return {
      status: 'VERIFYING',
      message:
        'Evidence received but risk checks are incomplete or high-risk. ZIP stays locked until a trusted transaction confirmation arrives or corrected evidence is submitted.'
    };
  }
  return {
    status: 'VERIFYING',
    message:
      'Evidence received. Automatic unlock needs LOW-risk screening or trusted confirmation. Screenshot alone cannot prove payment.'
  };
}
