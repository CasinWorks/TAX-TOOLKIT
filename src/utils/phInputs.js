/** Philippine TIN: 12 digits, displayed as XXX-XXX-XXX-XXX */

export const TIN_MAX_DIGITS = 12;

export function digitsOnly(s) {
  return String(s ?? "").replace(/\D/g, "");
}

/** Formats raw input to dashed TIN; caps at 12 digits. */
export function formatTinInput(raw) {
  const d = digitsOnly(raw).slice(0, TIN_MAX_DIGITS);
  const parts = [];
  for (let i = 0; i < d.length; i += 3) {
    parts.push(d.slice(i, i + 3));
  }
  return parts.join("-");
}

export function isTinComplete(formattedOrRaw) {
  return digitsOnly(formattedOrRaw).length === TIN_MAX_DIGITS;
}

/** RDO: digits only, max 4 (BIR uses 3-digit codes; allow 4 for edge cases). */
export function sanitizeRdo(raw) {
  return digitsOnly(raw).slice(0, 4);
}

/** PH mobile / landline digits only, max 11 (e.g. 09xxxxxxxxx). */
export function sanitizePhPhone(raw) {
  return digitsOnly(raw).slice(0, 11);
}

/** OR / SI series: numbers from BIR-authorized booklet; allow digits and common separators. */
export function sanitizeOrSeries(raw) {
  return String(raw ?? "")
    .replace(/[^\dA-Za-z\-]/g, "")
    .slice(0, 24);
}
