/**
 * Heuristic + structured screening of payment evidence.
 * This is NOT bank confirmation and does not prove funds were received.
 * OCR is not available in the current serverless footprint (no local Tesseract /
 * heavy models). Amount / recipient / status in the image are therefore unknown.
 * Auto-approval, when enabled, is screening-only and must be labelled as such.
 */

const UTR_RE = /^[A-Z0-9]{8,22}$/;

/** Common UPI / RRN style patterns (informational only). */
function utrLooksPlausible(utr) {
  if (!UTR_RE.test(utr)) return false;
  // 12-digit RRN is common; also allow longer alphanumeric UPI refs
  if (/^\d{12}$/.test(utr)) return true;
  if (/^[A-Z0-9]{10,22}$/.test(utr)) return true;
  return false;
}

/**
 * Minimal image forensics without external models.
 * Missing EXIF is normal for screenshots — never treat as fraud by itself.
 */
function inspectImageBytes(bytes, mime) {
  const findings = [];
  let score = 0;
  const signals = {
    validSignature: false,
    mimeMatches: false,
    sizeBytes: bytes ? bytes.length : 0,
    possibleRecompress: false
  };

  if (!bytes || !bytes.length) {
    findings.push('No screenshot provided');
    score += 40;
    return { findings, score, signals };
  }

  if (bytes.length > 4 * 1024 * 1024) {
    findings.push('Screenshot exceeds 4 MB');
    score += 20;
  }
  if (bytes.length < 800) {
    findings.push('Screenshot file is unusually small');
    score += 15;
  }

  const m = String(mime || '').toLowerCase();
  signals.mimeMatches = /^image\/(jpeg|jpg|png|webp)$/.test(m);

  const b = bytes;
  const isJpeg = b[0] === 0xff && b[1] === 0xd8;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const isWebp =
    b.length > 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57;
  signals.validSignature = isJpeg || isPng || isWebp;

  if (!signals.mimeMatches) {
    findings.push('Screenshot MIME not in allowed set (jpeg/png/webp)');
    score += 25;
  }
  if (!signals.validSignature) {
    findings.push('File signature does not match JPEG/PNG/WebP');
    score += 30;
  }

  // Very crude recompression / uniformity heuristic (not proof of AI)
  if (isJpeg && bytes.length > 2000) {
    let zeroRuns = 0;
    for (let i = 2; i < Math.min(bytes.length, 4000); i++) {
      if (bytes[i] === 0) zeroRuns++;
    }
    if (zeroRuns > 800) {
      signals.possibleRecompress = true;
      findings.push('Unusual zero-byte density in JPEG (weak recompression signal)');
      score += 5;
    }
  }

  return { findings, score, signals };
}

/**
 * Structured analysis result. OCR fields stay empty until a local engine is added.
 */
export function analyzeEvidence({
  expectedAmountInr,
  expectedUpiId,
  utr,
  screenshotBytes,
  screenshotMime,
  existingByUtr,
  existingByHash,
  currentOrderId,
  orderCreatedAt,
  orderExpiresAt
}) {
  const findings = [];
  let score = 0;
  const now = Date.now();

  const utrClean = String(utr || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  // --- UTR checks ---
  if (!utrClean) {
    findings.push('UTR/transaction reference missing');
    score += 45;
  } else if (!UTR_RE.test(utrClean)) {
    findings.push('UTR format invalid (expected 8–22 letters/digits, no spaces)');
    score += 25;
  } else if (!utrLooksPlausible(utrClean)) {
    findings.push('UTR format unusual for typical UPI/RRN references');
    score += 10;
  }

  if (existingByUtr && existingByUtr.id !== currentOrderId) {
    findings.push('UTR already associated with another order');
    score += 55;
  }
  if (existingByHash && existingByHash.id !== currentOrderId) {
    findings.push('Exact screenshot hash matches a previous submission');
    score += 50;
  }

  // --- Image checks ---
  const img = inspectImageBytes(screenshotBytes, screenshotMime);
  findings.push(...img.findings);
  score += img.score;

  // --- Order window ---
  if (orderExpiresAt && now > orderExpiresAt) {
    findings.push('Order has expired');
    score += 40;
  }
  if (orderCreatedAt && now < orderCreatedAt - 5 * 60 * 1000) {
    findings.push('Server clock skew: evidence time before order creation');
    score += 15;
  }

  // --- OCR stub (explicit) ---
  const ocr = {
    available: false,
    engine: null,
    confidence: 0,
    fields: {
      appName: null,
      status: null,
      amountInr: null,
      recipientName: null,
      recipientUpi: null,
      transactionId: null,
      date: null,
      time: null,
      confirmationText: null
    },
    found: [],
    missing: [
      'amount',
      'recipient',
      'status',
      'transactionId',
      'date',
      'time'
    ],
    conflicts: []
  };
  findings.push(
    'OCR not configured in this deployment — amount, recipient, status and timestamp inside the image were not machine-read'
  );
  score += 8;

  findings.push(
    'Expected amount ₹' + expectedAmountInr + ' to ' + (expectedUpiId || 'merchant UPI')
  );

  // --- Level ---
  let level = 'LOW';
  if (score >= 70) level = 'HIGH';
  else if (score >= 35) level = 'MEDIUM';
  else if (!screenshotBytes || !utrClean) level = 'INSUFFICIENT';

  // Critical flags that must never auto-approve
  const critical =
    findings.some((f) =>
      /missing|invalid|already|expired|does not match|exceeds/i.test(f)
    ) || level === 'HIGH' || level === 'INSUFFICIENT';

  return {
    riskLevel: level,
    riskScore: score,
    findings,
    critical,
    ocr,
    imageSignals: img.signals,
    disclaimer:
      'Screenshot screening only. A valid-looking image or UTR does not prove the merchant received money. Bank-confirmed receipt requires a trusted webhook or official payment provider.'
  };
}

/** Map risk + rules to a decision code for the engine. */
export function screeningDecisionCode(risk) {
  if (!risk) return 'VERIFICATION_UNAVAILABLE';
  if (risk.riskLevel === 'INSUFFICIENT') return 'INSUFFICIENT_EVIDENCE';
  if (risk.findings.some((f) => /UTR already/i.test(f))) return 'REJECTED_DUPLICATE_REFERENCE';
  if (risk.findings.some((f) => /screenshot hash matches/i.test(f)))
    return 'REJECTED_DUPLICATE_REFERENCE';
  if (risk.findings.some((f) => /expired/i.test(f))) return 'REJECTED_EXPIRED_ORDER';
  if (risk.findings.some((f) => /UTR format invalid|UTR\/transaction reference missing/i.test(f)))
    return 'REJECTED_INVALID_EVIDENCE';
  if (risk.findings.some((f) => /File signature|MIME not in allowed/i.test(f)))
    return 'REJECTED_INVALID_EVIDENCE';
  if (risk.critical || risk.riskLevel === 'HIGH') return 'REJECTED_INCONSISTENT_DETAILS';
  if (risk.riskLevel === 'MEDIUM') return 'INSUFFICIENT_EVIDENCE';
  // LOW and no critical → candidate for screening approval
  return 'AUTO_APPROVED_SCREENING_PASSED';
}
