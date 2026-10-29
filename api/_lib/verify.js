/**
 * Server-side payment decision engine.
 *
 * Trusted confirmation: signed webhook / configured provider → APPROVED (bank-class).
 * Screenshot screening: local OCR + fraud heuristics → AUTO_APPROVED_SCREENING_PASSED
 * only when all required checks pass. Never claims bank receipt from a screenshot alone.
 */
import { getOrder, saveOrder, findByUtr } from './store.js';
import { UPI_ID } from './pricing.js';
import { signDownloadToken } from './crypto.js';

export function hasWebhookSecret() {
  return Boolean(
    process.env.PAYMENT_WEBHOOK_SECRET && process.env.PAYMENT_WEBHOOK_SECRET.length >= 12
  );
}

export function screeningUnlockEnabled() {
  const v = process.env.AUTO_SCREENING_UNLOCK;
  if (v === '0' || v === 'false' || v === 'off') return false;
  return true;
}

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

  const utrClean = String(utr || order.utr || '')
    .trim()
    .toUpperCase();
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
  order.trustedConfirmation = {
    at: Date.now(),
    source: 'trusted_webhook',
    providerTxnId: providerTxnId || null,
    amountInr: got,
    payeeVpa: payeeVpa || null,
    raw: raw ? JSON.stringify(raw).slice(0, 2000) : null
  };
  order.decision = {
    status: 'APPROVED',
    code: 'TRUSTED_WEBHOOK_CONFIRMED',
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

export function decideFromEvidence(order, risk) {
  const ocr = risk?.signals?.ocr;
  const conflicts = ocr?.conflicts || [];

  if (order.expiresAt && Date.now() > order.expiresAt) {
    return {
      code: 'REJECTED_EXPIRED_ORDER',
      status: 'EXPIRED',
      message: 'This order has expired. Create a new payment and submit a fresh screenshot.'
    };
  }

  if (risk?.signals?.duplicateUtr) {
    return {
      code: 'REJECTED_DUPLICATE_REFERENCE',
      status: 'REJECTED',
      message:
        'This UTR / transaction reference was already used on another order. Use the unique reference from your new payment.'
    };
  }

  if (risk?.signals?.duplicateHash) {
    return {
      code: 'REJECTED_INVALID_EVIDENCE',
      status: 'REJECTED',
      message:
        'This screenshot was already submitted for another order. Upload the original screenshot from your new payment.'
    };
  }

  if (risk?.signals?.invalidFormat || !order.utr) {
    return {
      code: 'REJECTED_INVALID_EVIDENCE',
      status: 'REJECTED',
      message:
        'UTR / transaction reference is missing or invalid. Use 8–22 letters or digits from your UPI app (often a 12-digit RRN).'
    };
  }

  for (const c of conflicts) {
    if (c.startsWith('amount_mismatch')) {
      return {
        code: 'REJECTED_AMOUNT_MISMATCH',
        status: 'REJECTED',
        message:
          'The amount visible in the screenshot does not match the order (₹' +
          order.amountInr +
          '). Pay the exact amount and upload a new screenshot.'
      };
    }
    if (c.startsWith('recipient_mismatch')) {
      return {
        code: 'REJECTED_RECIPIENT_MISMATCH',
        status: 'REJECTED',
        message:
          'The recipient UPI in the screenshot does not match ' +
          UPI_ID +
          '. Pay to the correct merchant UPI and resubmit.'
      };
    }
    if (c.startsWith('utr_mismatch')) {
      return {
        code: 'REJECTED_INCONSISTENT_DETAILS',
        status: 'REJECTED',
        message:
          'The transaction reference in the screenshot does not match the UTR you entered. Correct the UTR or upload the matching screenshot.'
      };
    }
    if (c.startsWith('transaction_status')) {
      return {
        code: 'REJECTED_TRANSACTION_FAILURE',
        status: 'REJECTED',
        message:
          'The screenshot does not show a successful payment status. Complete the payment successfully and upload a new confirmation screenshot.'
      };
    }
  }

  if (risk?.riskLevel === 'HIGH' || (risk?.riskScore ?? 0) >= 60) {
    return {
      code: 'REJECTED_INVALID_EVIDENCE',
      status: 'REJECTED',
      message:
        'Automated screening found high-risk or inconsistent evidence. Upload a clear, original success screenshot from your UPI app with the correct amount and UTR.'
    };
  }

  const requiredOk =
    ocr &&
    ocr.engine === 'tesseract.js' &&
    ocr.fields &&
    ocr.fields.amountInr != null &&
    Math.abs(Number(ocr.fields.amountInr) - Number(order.amountInr)) < 0.009 &&
    ocr.fields.status === 'SUCCESS' &&
    (ocr.evidenceConfidence ?? 0) >= 0.45 &&
    !(ocr.conflicts && ocr.conflicts.length);

  const recipientOk =
    !ocr?.fields?.recipientUpi ||
    String(ocr.fields.recipientUpi).toLowerCase().replace(/\s/g, '') ===
      String(UPI_ID).toLowerCase().replace(/\s/g, '');

  if (screeningUnlockEnabled() && requiredOk && recipientOk && risk?.riskLevel === 'LOW') {
    return {
      code: 'AUTO_APPROVED_SCREENING_PASSED',
      status: 'APPROVED',
      message:
        'Automated screenshot screening passed (amount, success status, and reference checks). This is not a bank API confirmation — funds are assumed based on evidence quality. ZIP unlocked.',
      screeningOnly: true
    };
  }

  if (!ocr || ocr.engine !== 'tesseract.js' || (ocr.evidenceConfidence ?? 0) < 0.45) {
    return {
      code: 'INSUFFICIENT_EVIDENCE',
      status: 'VERIFYING',
      message:
        'Evidence received but OCR could not confidently read amount/status from the screenshot. Upload a sharper, full-frame success screenshot showing amount ₹' +
        order.amountInr +
        ', recipient, and UTR. ZIP stays locked until screening passes' +
        (hasWebhookSecret() ? ' or a trusted payment confirmation arrives.' : '.')
    };
  }

  if (ocr.missing?.includes('amount') || ocr.missing?.includes('status')) {
    return {
      code: 'INSUFFICIENT_EVIDENCE',
      status: 'VERIFYING',
      message:
        'Screenshot is missing a readable amount or success status. Ensure the full payment confirmation is visible and try again.'
    };
  }

  if (risk?.riskLevel === 'MEDIUM') {
    return {
      code: 'INSUFFICIENT_EVIDENCE',
      status: 'VERIFYING',
      message:
        'Screening is inconclusive (medium risk). Provide a clearer original screenshot. ZIP remains locked until checks pass' +
        (hasWebhookSecret() ? ' or trusted confirmation arrives.' : '.')
    };
  }

  return {
    code: 'INSUFFICIENT_EVIDENCE',
    status: 'VERIFYING',
    message:
      'Evidence recorded. Automated screening did not fully pass required checks yet. ZIP unlocks only after successful screening or trusted confirmation.'
  };
}

export async function applyScreeningDecision(order, risk) {
  const outcome = decideFromEvidence(order, risk);
  order.risk = risk;
  order.decision = {
    status: outcome.status,
    code: outcome.code,
    at: Date.now(),
    source: outcome.screeningOnly ? 'screenshot_screening' : 'evidence_pipeline',
    reason: outcome.message,
    by: 'system',
    screeningOnly: !!outcome.screeningOnly
  };

  if (outcome.status === 'APPROVED') {
    const exp = Date.now() + 1000 * 60 * 60 * 48;
    order.status = 'APPROVED';
    order.downloadToken = signDownloadToken({
      orderId: order.id,
      templateId: order.templateId,
      exp
    });
    order.downloadExpiresAt = exp;
  } else if (outcome.status === 'REJECTED' || outcome.status === 'EXPIRED') {
    order.status = outcome.status;
    order.downloadToken = null;
  } else {
    order.status = 'VERIFYING';
  }

  await saveOrder(order);
  return { order, outcome };
}

export function evidenceOnlyOutcome(risk) {
  const fakeOrder = { amountInr: 0, expiresAt: Date.now() + 999999, utr: 'X' };
  const d = decideFromEvidence(fakeOrder, risk);
  return { status: d.status === 'APPROVED' ? 'VERIFYING' : d.status, message: d.message };
}
