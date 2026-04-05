/** Per-user monthly gross income log by calendar year (for YTD + annualization). */

function storageKey(userId) {
  return `ict_income_ytd_${userId}`;
}

export function emptyMonths() {
  return Array.from({ length: 12 }, () => 0);
}

/**
 * @returns {number[]} 12 numbers (Jan–Dec)
 */
export function loadIncomeMonthsForYear(userId, year) {
  if (!userId) return emptyMonths();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyMonths();
    const data = JSON.parse(raw);
    const rec = data[String(year)];
    if (!rec || !Array.isArray(rec.months)) return emptyMonths();
    const m = rec.months.map((x) => Number(x) || 0);
    while (m.length < 12) m.push(0);
    return m.slice(0, 12);
  } catch {
    return emptyMonths();
  }
}

/** Raw object `{ "2026": { months: [...] }, ... }` for exports. */
export function loadAllIncomeYtdByYear(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveIncomeMonthsForYear(userId, year, months) {
  if (!userId) return;
  const arr = (months || []).map((x) => Number(x) || 0);
  while (arr.length < 12) arr.push(0);
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const data = raw ? JSON.parse(raw) : {};
    data[String(year)] = { months: arr.slice(0, 12) };
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export { MONTH_LABELS };

/**
 * YTD through "today" for the selected tax year, and annualized projection.
 * @param {number[]} months — 12 values Jan–Dec
 * @param {number} year — calendar year being edited
 * @param {Date} [now]
 */
export function ytdMetrics(months, year, now = new Date()) {
  const y = Number(year);
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;

  let elapsedMonths;
  if (y < cy) elapsedMonths = 12;
  else if (y > cy) elapsedMonths = 12;
  else elapsedMonths = cm;

  let ytdSum = 0;
  for (let i = 0; i < elapsedMonths && i < 12; i++) {
    ytdSum += Number(months[i]) || 0;
  }

  const annualized = elapsedMonths > 0 ? (ytdSum / elapsedMonths) * 12 : 0;

  return { ytdSum, annualized, elapsedMonths };
}
