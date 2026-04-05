/** BIR quarter from YYYY-MM-DD */
export function quarterAndYearFromIso(iso) {
  if (!iso || typeof iso !== "string" || iso.length < 7) {
    const y = String(new Date().getFullYear());
    return { quarter: "Q1", year: y };
  }
  const y = iso.slice(0, 4);
  const m = parseInt(iso.slice(5, 7), 10) || 1;
  const quarter = m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4";
  return { quarter, year: y };
}
