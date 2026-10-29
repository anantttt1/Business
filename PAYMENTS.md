# UPI template payments (AP Creative Studio)

## Architecture reality

This site is primarily **static** (HTML on Vercel). Secure paid downloads require **server-side** checks. This implementation adds **Vercel Serverless** routes under `/api/*`.

### Enforced server-side
- Template price only from `api/_lib/pricing.js` (client price ignored).
- States: `CREATED` → `PENDING_REVIEW` → `APPROVED` | `REJECTED` | `EXPIRED`.
- ZIP download requires a **signed download token** after **admin approval**.
- UTR + screenshot-hash duplicate checks (when store is durable).
- Rate limits on create / evidence / admin / download.

### Customer UI (no tokens)
Buyers **never** see or paste order tokens.
1. Select template → pay exact amount via UPI QR.
2. Upload screenshot + UTR → Submit.
3. Modal polls `/api/orders/status` every **2 seconds**.
4. When admin approves, modal receives `downloadToken` and unlocks ZIP automatically.

Order auth tokens stay in memory inside the modal JS only (not displayed).

### NOT bank verification
- Screenshot / heuristic risk scores are advisory only.
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
| `ADMIN_SECRET` | **Yes** (min 12 chars) | Protects `/api/admin/*` |
| `PAYMENT_HMAC_SECRET` | Recommended (min 16) | Order / download token HMAC |
| `KV_REST_API_URL` | **Required for auto-unlock** | Upstash Redis URL |
| `KV_REST_API_TOKEN` | **Required for auto-unlock** | Upstash token |

Without Upstash, orders live only in **ephemeral memory** per serverless instance. Admin approve and buyer poll may hit different instances → approval will not sync. **Configure Upstash KV for production.**

## Admin

1. Open `/admin-payments/`
2. Enter `ADMIN_SECRET`
3. Review pending orders (UTR, risk, order id)
4. Approve or Reject (rejection requires a reason)

## Buyer flow

1. Gallery → Download ZIP
2. Pay via UPI QR / Open UPI app
3. Upload screenshot + UTR
4. Wait — status updates in the modal
5. On approval → ZIP unlocks automatically

## Limitations

1. Template preview HTML may still be public unless moved to private storage.
2. No bank/UPI settlement API (by design).
3. Screenshots stored as hash only (not full image) by default.
4. Auto-unlock requires shared durable store (Upstash).
