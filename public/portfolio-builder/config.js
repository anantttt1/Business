/* Portfolio Builder settings (one place to change).

   paymentRequired: false  -> 1-month FREE TRIAL. "Download ZIP" gives the ZIP straight away,
                              no payment step. Cards show "Free for 1 month, then \u20b9<price>".
   paymentRequired: true   -> turns the UPI payment step (payment.js + /api) back on, and the
                              old "Pay the Amount" wording. Nothing else needs to change.

   The prices themselves live in templates-data.js (priceInr) and are untouched. */
window.PB_CONFIG = { paymentRequired: false };
