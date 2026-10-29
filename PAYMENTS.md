# UPI template payments (AP Creative Studio)

## Critical constraint

Merchant UPI `princetyagi90588@axl` does **not** expose a public API to list incoming credits.

Therefore:

- **A screenshot + UTR alone never prove that the merchant received money.**
- **Bank-confirmed unlock** still requires a trusted signed webhook (or official merchant API).
- **Screenshot screening** can optionally auto-unlock when `SCREENING_AUTO_APPROVE=true` and risk is LOW. That path is labelled `AUTO_APPROVED_SCREENING_PASSED` and is **not** bank confirmation.

This codebase does **not** fabricate bank confirmation or call paid OCR/AI services.

## Customer flow (no admin, no tokens)

1. Select template → pay exact amount via UPI QR.
2. Submit UTR + screenshot.
3. Server runs local heuristics (UTR format, duplicates, image validity, order window).
4. OCR is **not** configured in the current serverless footprint (no Tesseract / large models). Amount, recipient and status inside the image are therefore unknown.
5. Decision:
   - `SCREENING_AUTO_APPROVE=true` + LOW risk → `APPROVED` with code `AUTO_APPROVED_SCREENING_PASSED` + download token.
   - Otherwise → `VERIFYING` until trusted webhook, or `REJECTED` on critical failures.
6. Modal polls every 2s and unlocks ZIP when status is `APPROVED`.

No customer-facing order-token copy/paste or “waiting for admin” step.

## Trusted webhook (real confirmation)

```http
POST /api/webhooks/upi-credit
X-Webhook-Secret: <PAYMENT_WEBHOOK_SECRET>
Content-Type: application/json

{
  "orderId": "ord_...",
  "utr": "XXXXXXXX",
  "amountInr": 19,
  "status": "success",
  "payeeVpa": "princetyagi90588@axl"
}
```

Success statuses: `success`, `successful`, `completed`, `credited`, `captured`, `paid`.

### Minimum infrastructure for bank-level confirmation

1. Bank SMS/email relay that POSTs this webhook, or
2. Official merchant aggregator webhooks (Razorpay / PhonePe Business / etc.)

Without either, only the optional screening path (or manual admin) can unlock.

## Prices (server-trusted)

| templateId       | ₹  |
|------------------|----|
| color-pop        | 19 |
| ideas-impact     | 29 |
| paper-atelier    | 29 |
| ember-editorial  | 39 |
| signature-orange | 39 |
| modern-dark-3d   | 29 |

## Environment

| Name                     | Required                         | Purpose                                      |
|--------------------------|----------------------------------|----------------------------------------------|
| `KV_REST_API_URL`        | **Yes for production**           | Upstash Redis                                |
| `KV_REST_API_TOKEN`      | **Yes for production**           | Upstash token                                |
| `PAYMENT_HMAC_SECRET`    | Recommended                      | Token signing                                |
| `PAYMENT_WEBHOOK_SECRET` | For trusted unlock (min 12)      | Auth for `/api/webhooks/upi-credit`          |
| `SCREENING_AUTO_APPROVE` | Optional (`true`/`1`)            | Allow LOW-risk screenshot screening unlock   |
| `ADMIN_SECRET`           | Optional                         | Legacy emergency admin UI only               |

## States

`CREATED` → `VERIFYING` → `APPROVED` | `REJECTED` | `EXPIRED` | `REFUNDED`

Decision codes include: `AUTO_APPROVED_SCREENING_PASSED`, `TRUSTED_WEBHOOK`, `REJECTED_DUPLICATE_REFERENCE`, `REJECTED_INVALID_EVIDENCE`, `REJECTED_EXPIRED_ORDER`, `INSUFFICIENT_EVIDENCE`, etc.

## Limitations

- No local OCR: amount/recipient/status in the image are not extracted.
- No AI-generated image model: only lightweight signature / size / density heuristics.
- Missing EXIF is normal for screenshots and is never treated as fraud by itself.
- In-memory store is ephemeral; configure Upstash KV for production.
