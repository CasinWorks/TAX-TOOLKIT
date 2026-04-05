/** PH VAT default (12%). Line amounts are VAT-exclusive when VAT is on. */

export const DEFAULT_VAT_RATE = 0.12;

export function lineAmount(item) {
  const q = Number(item.qty) || 0;
  const u = Number(item.unitPrice) || 0;
  return q * u;
}

export function subtotalFromLines(lineItems) {
  return (lineItems || []).reduce((s, it) => s + lineAmount(it), 0);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {object} draft - { lineItems, vatEnabled, vatRate? }
 */
export function computeInvoiceTotals(draft) {
  const raw = subtotalFromLines(draft.lineItems);
  const subtotal = round2(raw);
  const rate = typeof draft.vatRate === "number" && draft.vatRate >= 0 ? draft.vatRate : DEFAULT_VAT_RATE;
  const vatEnabled = !!draft.vatEnabled;
  const vatAmount = vatEnabled ? round2(subtotal * rate) : 0;
  const grandTotal = round2(subtotal + vatAmount);
  return { subtotal, vatAmount, grandTotal, vatRate: rate, vatEnabled };
}
