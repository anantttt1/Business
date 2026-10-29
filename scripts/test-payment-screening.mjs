import assert from 'assert';
import { parseOcrFields } from '../api/_lib/ocr.js';
import { decideFromEvidence, screeningUnlockEnabled } from '../api/_lib/verify.js';
import { getTemplatePrice, TEMPLATE_PRICES, UPI_ID } from '../api/_lib/pricing.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓', name); }
  catch (e) { failed++; console.error('  ✗', name, '—', e.message); }
}

console.log('Template prices');
for (const [id, row] of Object.entries(TEMPLATE_PRICES)) {
  test(id + ' ₹' + row.priceInr, () => assert.strictEqual(getTemplatePrice(id).priceInr, row.priceInr));
}

console.log('OCR parse');
test('success extract', () => {
  const r = parseOcrFields('PhonePe Payment Successful ₹29 princetyagi90588@axl UTR: 123456789012', {
    expectedAmountInr: 29, expectedUpiId: UPI_ID, submittedUtr: '123456789012'
  });
  assert.strictEqual(r.fields.status, 'SUCCESS');
  assert.strictEqual(r.fields.amountInr, 29);
  assert.strictEqual(r.conflicts.length, 0);
});

test('amount mismatch', () => {
  const r = parseOcrFields('Successful ₹19 princetyagi90588@axl UTR 999999999999', {
    expectedAmountInr: 29, expectedUpiId: UPI_ID, submittedUtr: '999999999999'
  });
  assert.ok(r.conflicts.some(c => c.startsWith('amount_mismatch')));
});

const base = { id: 'ord_t', amountInr: 29, templateId: 'ideas-impact', utr: '123456789012', expiresAt: Date.now() + 1e7, createdAt: Date.now() };
test('auto approve', () => {
  assert.ok(screeningUnlockEnabled());
  const d = decideFromEvidence(base, {
    riskLevel: 'LOW', riskScore: 5, findings: [],
    signals: { ocr: { engine: 'tesseract.js', evidenceConfidence: 0.72, conflicts: [], fields: { amountInr: 29, status: 'SUCCESS', recipientUpi: UPI_ID, primaryRef: '123456789012' }, found: ['amount','status'], missing: [] } }
  });
  assert.strictEqual(d.code, 'AUTO_APPROVED_SCREENING_PASSED');
});

test('dup utr', () => {
  const d = decideFromEvidence(base, { riskLevel: 'HIGH', riskScore: 70, findings: [], signals: { duplicateUtr: true } });
  assert.strictEqual(d.code, 'REJECTED_DUPLICATE_REFERENCE');
});

console.log('Passed', passed, 'Failed', failed);
if (failed) process.exit(1);
