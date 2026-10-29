/**
 * Local OCR + structured field extraction for UPI payment screenshots.
 * Uses tesseract.js when available; never sends images to third-party AI APIs.
 * OCR text alone is evidence for screening — not bank confirmation of funds.
 */

import { createWorker } from 'tesseract.js';

const AMOUNT_RE =
  /(?:₹|rs\.?|inr|rupees?)\s*[:\s]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
const AMOUNT_BARE_RE =
  /(?:paid|amount|total|debited|sent)\s*[:\s]*(?:₹|rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/gi;
const UTR_RE =
  /(?:utr|rrn|txn\s*id|transaction\s*(?:id|ref(?:erence)?)|ref(?:erence)?(?:\s*no\.?)?|upi\s*ref)\s*[:.#\-\s]*([A-Z0-9]{8,22})/gi;
const UTR_STANDALONE_RE = /\b([0-9]{12})\b/g;
const UPI_RE = /([a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64})/g;
const STATUS_SUCCESS_RE =
  /\b(success(?:ful)?|completed|paid|credited|payment\s+successful|transaction\s+successful|money\s+sent)\b/i;
const STATUS_FAIL_RE =
  /\b(failed|failure|declined|rejected|cancelled|canceled|pending|processing|awaiting)\b/i;
const DATE_RE =
  /\b(\d{1,2}[\/\-.\s]\d{1,2}[\/\-.\s]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/gi;
const TIME_RE = /\b([01]?\d|2[0-3])[:.]([0-5]\d)(?::([0-5]\d))?\s*(am|pm)?\b/gi;
const APP_RE =
  /\b(phonepe|google\s*pay|gpay|paytm|bhim|amazon\s*pay|whatsapp|cred|mobikwik|freecharge|navi)\b/i;

function normalizeText(t) {
  return String(t || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, 'I')
    .replace(/[€]/g, 'E')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAmount(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function collectAmounts(text) {
  const found = [];
  for (const re of [AMOUNT_RE, AMOUNT_BARE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const n = parseAmount(m[1]);
      if (n != null && n > 0 && n < 100000) found.push(n);
    }
  }
  return [...new Set(found)];
}

function collectUtrs(text, submittedUtr) {
  const set = new Set();
  UTR_RE.lastIndex = 0;
  let m;
  while ((m = UTR_RE.exec(text)) !== null) {
    set.add(m[1].toUpperCase());
  }
  UTR_STANDALONE_RE.lastIndex = 0;
  while ((m = UTR_STANDALONE_RE.exec(text)) !== null) {
    set.add(m[1].toUpperCase());
  }
  if (submittedUtr && text.toUpperCase().includes(String(submittedUtr).toUpperCase())) {
    set.add(String(submittedUtr).toUpperCase());
  }
  return [...set];
}

function collectUpis(text) {
  const set = new Set();
  UPI_RE.lastIndex = 0;
  let m;
  while ((m = UPI_RE.exec(text)) !== null) {
    set.add(m[1].toLowerCase());
  }
  return [...set];
}

function parseDateCandidates(text) {
  const out = [];
  DATE_RE.lastIndex = 0;
  let m;
  while ((m = DATE_RE.exec(text)) !== null) out.push(m[1]);
  return out;
}

function parseTimeCandidates(text) {
  const out = [];
  TIME_RE.lastIndex = 0;
  let m;
  while ((m = TIME_RE.exec(text)) !== null) out.push(m[0]);
  return out;
}

export function parseOcrFields(rawText, { expectedAmountInr, expectedUpiId, submittedUtr } = {}) {
  const text = normalizeText(rawText);
  const amounts = collectAmounts(text);
  const utrs = collectUtrs(text, submittedUtr);
  const upis = collectUpis(text);
  const dates = parseDateCandidates(text);
  const times = parseTimeCandidates(text);
  const appMatch = text.match(APP_RE);

  let status = null;
  if (STATUS_SUCCESS_RE.test(text)) status = 'SUCCESS';
  else if (STATUS_FAIL_RE.test(text)) {
    const fail = text.match(STATUS_FAIL_RE);
    status = fail ? fail[1].toUpperCase() : 'FAILED';
  }

  const amountMatch =
    amounts.find((a) => Math.abs(a - Number(expectedAmountInr)) < 0.009) ??
    (amounts.length === 1 ? amounts[0] : null);

  const upiNorm = (s) => String(s || '').toLowerCase().replace(/\s/g, '');
  const expectedUpi = upiNorm(expectedUpiId);
  const recipientUpi =
    upis.find((u) => upiNorm(u) === expectedUpi) || (upis.length === 1 ? upis[0] : null);

  const fields = {
    rawTextSample: text.slice(0, 800),
    paymentApp: appMatch ? appMatch[1].replace(/\s+/g, ' ') : null,
    status,
    amountInr: amountMatch,
    amountsFound: amounts,
    recipientUpi,
    upisFound: upis,
    transactionRefs: utrs,
    primaryRef:
      (submittedUtr && utrs.includes(String(submittedUtr).toUpperCase())
        ? String(submittedUtr).toUpperCase()
        : null) ||
      utrs[0] ||
      null,
    dates,
    times,
    confirmationText: STATUS_SUCCESS_RE.test(text)
      ? text.match(STATUS_SUCCESS_RE)?.[0] || null
      : null
  };

  const found = [];
  const missing = [];
  const conflicts = [];

  if (fields.status) found.push('status');
  else missing.push('status');
  if (fields.amountInr != null) found.push('amount');
  else missing.push('amount');
  if (fields.recipientUpi) found.push('recipientUpi');
  else missing.push('recipientUpi');
  if (fields.primaryRef) found.push('transactionRef');
  else missing.push('transactionRef');
  if (dates.length) found.push('date');
  else missing.push('date');
  if (times.length) found.push('time');
  else missing.push('time');

  if (
    fields.amountInr != null &&
    expectedAmountInr != null &&
    Math.abs(fields.amountInr - Number(expectedAmountInr)) > 0.009
  ) {
    conflicts.push(
      `amount_mismatch: ocr ₹${fields.amountInr} vs expected ₹${expectedAmountInr}`
    );
  }
  if (amounts.length > 1 && !amounts.some((a) => Math.abs(a - Number(expectedAmountInr)) < 0.009)) {
    conflicts.push('multiple_amounts_none_match_expected');
  }
  if (
    fields.recipientUpi &&
    expectedUpi &&
    upiNorm(fields.recipientUpi) !== expectedUpi
  ) {
    conflicts.push(`recipient_mismatch: ${fields.recipientUpi} vs ${expectedUpiId}`);
  }
  if (
    submittedUtr &&
    fields.primaryRef &&
    fields.primaryRef !== String(submittedUtr).toUpperCase() &&
    !utrs.includes(String(submittedUtr).toUpperCase())
  ) {
    conflicts.push(`utr_mismatch: ocr ${fields.primaryRef} vs submitted ${submittedUtr}`);
  }
  if (fields.status && !['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID', 'CREDITED'].includes(fields.status)) {
    conflicts.push(`transaction_status_not_success: ${fields.status}`);
  }

  return { fields, found, missing, conflicts, textLength: text.length };
}

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        logger: () => {}
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function runLocalOcr(imageBytes, mime, opts = {}) {
  const timeoutMs = opts.timeoutMs || 12000;
  const started = Date.now();
  let ocrText = '';
  let confidence = null;
  let ocrError = null;
  let engine = 'none';

  try {
    const worker = await Promise.race([
      getWorker(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('OCR worker init timeout')), timeoutMs))
    ]);
    const remaining = Math.max(2000, timeoutMs - (Date.now() - started));
    const result = await Promise.race([
      worker.recognize(Buffer.from(imageBytes)),
      new Promise((_, rej) => setTimeout(() => rej(new Error('OCR recognize timeout')), remaining))
    ]);
    ocrText = result?.data?.text || '';
    confidence =
      typeof result?.data?.confidence === 'number' ? result.data.confidence : null;
    engine = 'tesseract.js';
  } catch (e) {
    ocrError = e?.message || String(e);
    engine = 'failed';
  }

  const parsed = parseOcrFields(ocrText, opts);
  const evidenceConfidence = computeEvidenceConfidence(parsed, confidence);

  return {
    engine,
    ocrError,
    ocrConfidence: confidence,
    evidenceConfidence,
    durationMs: Date.now() - started,
    ...parsed
  };
}

function computeEvidenceConfidence(parsed, ocrConf) {
  let c = 0.2;
  if (parsed.textLength > 40) c += 0.15;
  if (parsed.found.includes('amount')) c += 0.2;
  if (parsed.found.includes('status')) c += 0.15;
  if (parsed.found.includes('transactionRef')) c += 0.15;
  if (parsed.found.includes('recipientUpi')) c += 0.1;
  if (ocrConf != null) c = c * 0.5 + (ocrConf / 100) * 0.5;
  if (parsed.conflicts.length) c = Math.min(c, 0.35);
  return Math.round(Math.max(0, Math.min(1, c)) * 100) / 100;
}

export async function terminateOcrWorker() {
  if (workerPromise) {
    try {
      const w = await workerPromise;
      await w.terminate();
    } catch (_) {}
    workerPromise = null;
  }
}
