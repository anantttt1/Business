# UPI template payments (AP Creative Studio)

## Critical constraint

Merchant UPI `princetyagi90588@axl` does **not** expose a public API to list incoming credits.

- **A screenshot + UTR is never bank confirmation.**
- **Automated unlock after screening** is labelled `AUTO_APPROVED_SCREENING_PASSED` / `screeningOnly: true`.
- **Trusted bank-class confirmation** still uses the signed webhook when configured.

## Customer flow (no admin, no tokens to copy/paste)

1. Select template → pay exact amount via UPI QR.
2. Submit UTR + screenshot.
3. Server runs local OCR (tesseract.js) + image/fraud heuristics.
4. Decision engine returns documented codes.
5. If screening passes → `APPROVED` + download token (automatic ZIP unlock).
6. Optional signed webhook can still confirm independently.

## Screening auto-approve rules (all required)

- Valid UTR (8–22 alphanumeric)
- Valid JPEG/PNG/WebP under 4MB
- No duplicate UTR or exact screenshot hash
- OCR amount matches server template price; status SUCCESS
- No critical OCR conflicts; evidence confidence ≥ 0.45; risk LOW
- Order not expired

## Environment

| Name | Required | Purpose |
|------|----------|--------|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Yes for multi-instance | Upstash Redis |
| `PAYMENT_HMAC_SECRET` | Recommended | Token signing |
| `PAYMENT_WEBHOOK_SECRET` | Optional | Trusted webhook |
| `AUTO_SCREENING_UNLOCK` | Optional | Default on; `0` disables screenshot auto-unlock |

## Prices

color-pop 19 · ideas-impact 29 · paper-atelier 29 · ember-editorial 39 · signature-orange 39 · modern-dark-3d 29
