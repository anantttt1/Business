/**
 * Heuristic + structured screening of payment evidence.
 * This is NOT bank confirmation and does not prove funds were received.
 * OCR is not available in the current serverless footprint.
 * Auto-approval is screening-only and must be labelled as such.
 */

const UTR_RE = /^[A-Z0-9]{8,22}$/;

function utrLooksPlausible(utr) {
  if (!UTR_RE.test(utr)) return false;
  if (/^\d{12}$/.test(utr)) return true;
  if (/^[A-Z0-9]{10,22}$/.test(utr)) return true;
  return false;
}

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

function isHardFailFinding(f) {
  return /UTR already associated|screenshot hash matches|Order has expired|UTR format invalid|UTR\/transaction reference missing|No screenshot provided|Screenshot exceeds 4 MB|MIME not in allowed|File signature does not match/i.test(
    String(f || '')
  );
}

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

  const img = inspectImageBytes(screenshotBytes, screenshotMime);
  findings.push(...img.findings);
  score += img.score;

  if (orderExpiresAt && now > orderExpiresAt) {
    findings.push('Order has expired');
    score += 40;
  }
  if (orderCreatedAt && now < orderCreatedAt - 5 * 60 * 1000) {
    findings.push('Server clock skew: evidence time before order creation');
    score += 15;
  }

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
    missing: ['amount', 'recipient', 'status', 'transactionId', 'date', 'time'],
    conflicts: []
  };
  findings.push(
    'OCR not configured — image text (amount/recipient/status) was not machine-read (soft signal only)'
  );
  score += 5;

  findings.push(
    'Expected amount ₹' + expectedAmountInr + ' to ' + (expectedUpiId || 'merchant UPI')
  );

  let level = 'LOW';
  if (score >= 70) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else if (!screenshotBytes || !utrClean) level = 'INSUFFICIENT';

  const critical = findings.some(isHardFailFinding) || level === 'HIGH' || level === 'INSUFFICIENT';

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

export function screeningDecisionCode(risk) {
  if (!risk) return 'VERIFICATION_UNAVAILABLE';
  if (risk.riskLevel === 'INSUFFICIENT') return 'INSUFFICIENT_EVIDENCE';
  if (risk.findings.some((f) => /UTR already associated/i.test(f))) return 'REJECTED_DUPLICATE_REFERENCE';
  if (risk.findings.some((f) => /screenshot hash matches/i.test(f)))
    return 'REJECTED_DUPLICATE_REFERENCE';
  if (risk.findings.some((f) => /Order has expired/i.test(f))) return 'REJECTED_EXPIRED_ORDER';
  if (risk.findings.some((f) => /UTR format invalid|UTR\/transaction reference missing/i.test(f)))
    return 'REJECTED_INVALID_EVIDENCE';
  if (risk.findings.some((f) => /File signature does not match|MIME not in allowed|No screenshot provided/i.test(f)))
    return 'REJECTED_INVALID_EVIDENCE';
  if (risk.critical || risk.riskLevel === 'HIGH') return 'REJECTED_INCONSISTENT_DETAILS';
  // LOW or MEDIUM without hard fails → auto-approve candidate
  return 'AUTO_APPROVED_SCREENING_PASSED';
}
