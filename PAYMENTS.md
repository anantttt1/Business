# UPI template payments (AP Creative Studio)

## Critical constraint

Merchant UPI `princetyagi90588@axl` does **not** expose a public API to list incoming credits.

Therefore:

- **Screenshots + UTR alone never unlock a ZIP.**
- **Automatic unlock requires a trusted confirmation** via signed webhook (or a future official merchant payment API).
- This codebase does **not** fabricate bank confirmation.

## Customer flow (no admin, no tokens)

1. Select template → pay exact amount via UPI QR.
2. Submit UTR + screenshot (matching / fraud heuristics only).
3. Order enters `VERIFYING`.
4. Signed webhook confirms success + amount (+ UTR/orderId) → `APPROVED` + download token.
5. Modal polls every 2s and unlocks ZIP automatically.

## Trusted webhook

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

Server checks: secret, amount vs template price, optional VPA, UTR uniqueness, order state.

### Minimum infrastructure

1. Bank SMS/email relay that POSTs this webhook, or
2. Official merchant aggregator webhooks (Razorpay / PhonePe Business / etc.)

Without either, orders stay `VERIFYING` and ZIP stays locked (correct).

## Prices

| templateId | ₹ |
|------------|---|
| color-pop | 19 |
| ideas-impact | 29 |
| paper-atelier | 29 |
| ember-editorial | 39 |
| signature-orange | 39 |
| modern-dark-3d | 29 |

## Environment

| Name | Required | Purpose |
|------|----------|---------|
| `PAYMENT_WEBHOOK_SECRET` | **Yes for auto-unlock** (min 12) | Auth for `/api/webhooks/upi-credit` |
| `KV_REST_API_URL` | **Yes** | Upstash Redis |
| `KV_REST_API_TOKEN` | **Yes** | Upstash token |
| `PAYMENT_HMAC_SECRET` | Recommended | Token signing |
| `ADMIN_SECRET` | Optional | Legacy emergency admin UI only |

## States

`CREATED` → `VERIFYING` → `APPROVED` | `REJECTED` | `EXPIRED` | `REFUNDED`
