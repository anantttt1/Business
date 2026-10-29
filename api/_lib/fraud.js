/**
 * Heuristic risk analysis on user-submitted payment evidence.
 * This is NOT bank confirmation. OCR is optional; without OCR we still score structure/duplicates.
 */

export function analyzeEvidence({
  expectedAmountInr,
  expectedUpiId,
  utr,
  screenshotBytes,
  screenshotMime,
  existingByUtr,
  existingByHash,
  currentOrderId
}) {
  const findings = [];
  let score = 0;

  const utrClean = String(utr || '').trim().toUpperCase();
  if (!utrClean) {
    findings.push('UTR/reference missing');
    score += 40;
  } else if (!/^[A-Z0-9]{8,22}$/.test(utrClean)) {
    findings.push('UTR format looks unusual');
    score += 15;
  }

  if (existingByUtr && existingByUtr.id !== currentOrderId) {
    findings.push('UTR already used on another order');
    score += 50;
  }
  if (existingByHash && existingByHash.id !== currentOrderId) {
    findings.push('Screenshot hash matches another submission');
    score += 45;
  }

  if (!screenshotBytes || !screenshotBytes.length) {
    findings.push('No screenshot provided');
    score += 35;
  } else {
    if (screenshotBytes.length > 4 * 1024 * 1024) {
      findings.push('Screenshot exceeds 4MB');
      score += 20;
    }
    const mime = String(screenshotMime || '');
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) {
      findings.push('Screenshot MIME not in allowed set');
      score += 25;
    }
    const b = screenshotBytes;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8;
    const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const isWebp = b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57;
    if (!isJpeg && !isPng && !isWebp) {
      findings.push('File signature does not match JPEG/PNG/WebP');
      score += 30;
    }
  }

  findings.push(
    'No OCR bank-text extraction configured — amount/recipient in image were not machine-read'
  );
  score += 5;
  findings.push('Expected amount ₹' + expectedAmountInr + ' to ' + expectedUpiId);

  let level = 'LOW';
  if (score >= 60) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';
  else if (!screenshotBytes || !utrClean) level = 'INSUFFICIENT';

  return {
    riskLevel: level,
    riskScore: score,
    findings,
    disclaimer:
      'Heuristic risk only. A valid-looking screenshot or UTR does not prove funds were received. Manual review required before approval.'
  };
}
