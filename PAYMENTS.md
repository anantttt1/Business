# UPI template payments (AP Creative Studio)

## Architecture reality

This site is primarily **static** (HTML on Vercel). Secure paid downloads require **server-side** checks. This implementation adds **Vercel Serverless** routes under `/api/*`.

### Enforced server-side
- Template price only from `api/_lib/pricing.js` (client price ignored).
- States: `CREATED` → `PENDING_REVIEW` → `APPROVED` | `REJECTED` | `EXPIRED`.
- ZIP download requires a **signed download token** after **admin approval**.
- UTR + screenshot-hash duplicate checks (when store is durable).
- Rate limits on create / evidence / admin / download.

### NOT bank verification
- Screenshot OCR is not enabled by default.
- Risk scores are heuristic and advisory.
- Admin approval is manual review, not proof funds settled.

## Prices

| templateId | Price |
|------------|------|
| color-pop | ₹19 |
| ideas-impact | ₹29 |
| paper-atelier | ₹29 |
| ember-editorial | ₹39 |
| signature-orange | ₹39 |
| modern-dark-3d | ₹29 |

UPI ID: `princetyagi90588@axl`

## Environment variables

| Name | Required | Purpose |
|------|----------|---------|
| `ADMIN_SECRET` | Yes (min 12 chars) | Protects `/api/admin/*` |
| `PAYMENT_HMAC_SECRET` | Recommended (min 16) | Download token HMAC |
| `KV_REST_API_URL` | Strongly recommended | Upstash Redis URL |
| `KV_REST_API_TOKEN` | Strongly recommended | Upstash token |

Without Upstash, orders are **in-memory** and lost on cold starts.

## Admin

1. Open `/admin-payments/`
2. Enter `ADMIN_SECRET`
3. Approve or reject pending orders

## Buyer flow

1. Gallery → Download ZIP
2. Pay via UPI QR / link
3. Upload screenshot + UTR
4. Wait for admin approval
5. Download unlocks via signed token

## Limitations

1. Template preview HTML is still public unless moved to private storage.
2. No bank/UPI settlement API (by design).
3. Screenshots stored as hash only (not full image) by default.
