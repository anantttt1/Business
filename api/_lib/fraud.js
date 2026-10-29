/**
 * Multi-signal local image-risk + evidence analysis for UPI screenshots.
 * Heuristic only — not bank confirmation, not 100% AI-image detection.
 */

import crypto from 'crypto';
import { runLocalOcr } from './ocr.js';

function averageHashFromBytes(bytes, mime) {
  const sample = [];
  const start = mime && /png/i.test(mime) ? 32 : 16;
  const step = Math.max(1, Math.floor((bytes.length - start) / 64));
  for (let i = start; i < bytes.length && sample.length < 64; i += step) {
    sample.push(bytes[i]);
  }
  if (sample.length < 8) return null;
  const avg = sample.reduce((a, b) => a + b, 0) / sample.length;
  let bits = '';
  for (const v of sample) bits += v >= avg ? '1' : '0';
  return crypto.createHash('sha256').update(bits).digest('hex').slice(0, 32);
}

function hammingHex(a, b) {
  if (!a || !b || a.length !== b.length) return 256;
  let dist = 0;
  for (let i = 0; i < a.length; i += 2) {
    const x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    dist += x.toString(2).replace(/0/g, '').length;
  }
  return dist;
}

function inspectImageStructure(bytes, mime) {
  const findings = [];
  let risk = 0;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45;

  if (!isJpeg && !isPng && !isWebp) {
    findings.push('File signature does not match JPEG/PNG/WebP');
    risk += 30;
  }

  const declared = String(mime || '').toLowerCase();
  if (isJpeg && !/jpe?g/.test(declared)) {
    findings.push('MIME/extension mismatch vs JPEG signature');
    risk += 10;
  }
  if (isPng && !/png/.test(declared)) {
    findings.push('MIME mismatch vs PNG signature');
    risk += 10;
  }

  let hasExif = false;
  if (isJpeg) {
    for (let i = 2; i < Math.min(bytes.length - 4, 65536); i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xe1) {
        hasExif = true;
        break;
      }
    }
  }
  if (!hasExif) {
    findings.push('No EXIF APP1 segment (common for screenshots; not fraud by itself)');
  }

  if (bytes.length < 800) {
    findings.push('Image payload unusually small');
    risk += 15;
  }
  if (bytes.length > 4 * 1024 * 1024) {
    findings.push('Screenshot exceeds 4MB');
    risk += 20;
  }

  if (bytes.length > 2000) {
    const chunk = bytes.subarray(200, 264).toString('hex');
    let repeats = 0;
    for (let i = 300; i < Math.min(bytes.length - 64, 8000); i += 64) {
      if (bytes.subarray(i, i + 64).toString('hex') === chunk) repeats++;
    }
    if (repeats >= 8) {
      findings.push('Repeated byte regions (possible clone/overlay artifact)');
      risk += 12;
    }
  }

  return { findings, risk, hasExif, isJpeg, isPng, isWebp };
}

export async function analyzeEvidence({
  expectedAmountInr,
  expectedUpiId,
  utr,
  screenshotBytes,
  screenshotMime,
  existingByUtr,
  existingByHash,
  currentOrderId,
  orderCreatedAt,
  orderExpiresAt,
  skipOcr = false
}) {
  const findings = [];
  let score = 0;
  const signals = {
    duplicateUtr: false,
    duplicateHash: false,
    invalidFormat: false,
    imageStructure: null,
    ocr: null,
    perceptualHash: null
  };

  const utrClean = String(utr || '')
    .trim()
    .toUpperCase();
  if (!utrClean) {
    findings.push('UTR/reference missing');
    score += 40;
    signals.invalidFormat = true;
  } else if (!/^[A-Z0-9]{8,22}$/.test(utrClean)) {
    findings.push('UTR format looks unusual (expected 8–22 alphanumeric)');
    score += 20;
    signals.invalidFormat = true;
  } else if (/^\d{12}$/.test(utrClean)) {
    findings.push('UTR matches common 12-digit RRN pattern');
  }

  if (existingByUtr && existingByUtr.id !== currentOrderId) {
    findings.push('UTR already used on another order');
    score += 50;
    signals.duplicateUtr = true;
  }
  if (existingByHash && existingByHash.id !== currentOrderId) {
    findings.push('Screenshot SHA-256 matches another submission');
    score += 45;
    signals.duplicateHash = true;
  }

  if (!screenshotBytes || !screenshotBytes.length) {
    findings.push('No screenshot provided');
    score += 35;
  } else {
    const mime = String(screenshotMime || '');
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) {
      findings.push('Screenshot MIME not in allowed set');
      score += 25;
    }
    const struct = inspectImageStructure(screenshotBytes, mime);
    findings.push(...struct.findings);
    score += struct.risk;
    signals.imageStructure = struct;
    signals.perceptualHash = averageHashFromBytes(screenshotBytes, mime);

    if (!skipOcr) {
      try {
        const ocr = await runLocalOcr(screenshotBytes, mime, {
          expectedAmountInr,
          expectedUpiId,
          submittedUtr: utrClean,
          timeoutMs: 12000
        });
        signals.ocr = ocr;
        findings.push(
          'OCR engine=' +
            ocr.engine +
            ' conf=' +
            (ocr.ocrConfidence ?? 'n/a') +
            ' evidence=' +
            ocr.evidenceConfidence
        );
        if (ocr.ocrError) {
          findings.push('OCR unavailable or timed out: ' + ocr.ocrError);
          score += 8;
        }
        if (ocr.conflicts?.length) {
          for (const c of ocr.conflicts) {
            findings.push('OCR conflict: ' + c);
            if (c.startsWith('amount_mismatch')) score += 40;
            else if (c.startsWith('recipient_mismatch')) score += 35;
            else if (c.startsWith('utr_mismatch')) score += 35;
            else if (c.startsWith('transaction_status')) score += 40;
            else score += 15;
          }
        }
        if (ocr.found?.includes('amount') && ocr.fields?.amountInr != null) {
          if (Math.abs(ocr.fields.amountInr - Number(expectedAmountInr)) < 0.009) {
            findings.push('OCR amount matches expected ₹' + expectedAmountInr);
            score = Math.max(0, score - 8);
          }
        } else {
          findings.push('OCR did not reliably extract amount');
          score += 10;
        }
        if (ocr.found?.includes('status') && ocr.fields?.status === 'SUCCESS') {
          findings.push('OCR status indicates success');
          score = Math.max(0, score - 5);
        } else if (!ocr.found?.includes('status')) {
          findings.push('OCR status not found (insufficient alone is not auto-reject)');
          score += 5;
        }
        if (ocr.found?.includes('transactionRef')) {
          if (ocr.fields.primaryRef && utrClean && ocr.fields.primaryRef === utrClean) {
            findings.push('OCR transaction reference matches submitted UTR');
            score = Math.max(0, score - 5);
          }
        }
        if (ocr.fields?.dates?.length && orderCreatedAt) {
          const now = Date.now();
          for (const d of ocr.fields.dates) {
            const yMatch = d.match(/(20\d{2})/);
            if (yMatch) {
              const y = Number(yMatch[1]);
              const cy = new Date().getFullYear();
              if (y > cy) {
                findings.push('OCR date year in the future: ' + d);
                score += 25;
              }
            }
          }
          if (orderExpiresAt && now > orderExpiresAt) {
            findings.push('Order already past expiration at analysis time');
            score += 30;
          }
        }
        if (ocr.evidenceConfidence != null && ocr.evidenceConfidence < 0.35) {
          findings.push('Low overall OCR evidence confidence');
          score += 12;
        }
      } catch (e) {
        findings.push('OCR pipeline error: ' + (e?.message || String(e)));
        score += 10;
      }
    } else {
      findings.push('OCR skipped for this analysis run');
    }
  }

  findings.push('Expected amount ₹' + expectedAmountInr + ' to ' + expectedUpiId);

  let level = 'LOW';
  if (score >= 60) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';
  else if (!screenshotBytes || !utrClean) level = 'INSUFFICIENT';

  return {
    riskLevel: level,
    riskScore: score,
    findings,
    signals: {
      duplicateUtr: signals.duplicateUtr,
      duplicateHash: signals.duplicateHash,
      invalidFormat: signals.invalidFormat,
      perceptualHash: signals.perceptualHash,
      hasExif: signals.imageStructure?.hasExif ?? null,
      ocr: signals.ocr
        ? {
            engine: signals.ocr.engine,
            ocrConfidence: signals.ocr.ocrConfidence,
            evidenceConfidence: signals.ocr.evidenceConfidence,
            found: signals.ocr.found,
            missing: signals.ocr.missing,
            conflicts: signals.ocr.conflicts,
            fields: {
              status: signals.ocr.fields?.status,
              amountInr: signals.ocr.fields?.amountInr,
              recipientUpi: signals.ocr.fields?.recipientUpi,
              primaryRef: signals.ocr.fields?.primaryRef,
              paymentApp: signals.ocr.fields?.paymentApp,
              dates: signals.ocr.fields?.dates,
              times: signals.ocr.fields?.times
            }
          }
        : null
    },
    disclaimer:
      'Screenshot screening is heuristic. A valid-looking screenshot or UTR does not prove funds were received by the merchant. Bank-confirmed receipt requires a trusted webhook or official payment provider.'
  };
}

export function perceptualDistance(hashA, hashB) {
  return hammingHex(hashA, hashB);
}
