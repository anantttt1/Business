/** Server-trusted template pricing. Never trust client-sent amounts. */
export const UPI_ID = 'princetyagi90588@axl';
export const UPI_PAYEE_NAME = 'AP Creative Studio';

export const TEMPLATE_PRICES = {
  'color-pop': { name: 'Color Pop', priceInr: 19, order: 1 },
  'ideas-impact': { name: 'Ideas Impact', priceInr: 29, order: 2 },
  'paper-atelier': { name: 'Paper Atelier', priceInr: 29, order: 3 },
  'ember-editorial': { name: 'Ember Editorial', priceInr: 39, order: 4 },
  'signature-orange': { name: 'Signature Orange', priceInr: 39, order: 5 },
  'modern-dark-3d': { name: 'Modern Dark 3D', priceInr: 29, order: 6 }
};

export function getTemplatePrice(templateId) {
  const id = String(templateId || '').trim();
  const row = TEMPLATE_PRICES[id];
  if (!row) return null;
  return { id, name: row.name, priceInr: row.priceInr, order: row.order };
}

export function buildUpiUri({ amountInr, orderId, templateName }) {
  const pa = encodeURIComponent(UPI_ID);
  const pn = encodeURIComponent(UPI_PAYEE_NAME);
  const am = encodeURIComponent(Number(amountInr).toFixed(2));
  const cu = 'INR';
  const tn = encodeURIComponent(
    String(templateName || 'Template').slice(0, 40) + ' #' + String(orderId || '').slice(0, 12)
  );
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}`;
}
