/** Shared Form 2307 / withholding entry storage (same key as Form2307Tracker). */

export function form2307StorageKey(userId) {
  return `ict_2307_${userId}`;
}

export function loadForm2307Entries(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(form2307StorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveForm2307Entries(userId, entries) {
  if (!userId) return;
  localStorage.setItem(form2307StorageKey(userId), JSON.stringify(entries));
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

/**
 * Sum taxWithheld per quarter for a calendar year (year string e.g. "2026").
 */
export function sumWithheldByQuarterForYear(entries, year) {
  const y = String(year).slice(0, 4);
  const out = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const e of entries) {
    if (String(e.year || "").slice(0, 4) !== y) continue;
    const q = e.quarter;
    if (!QUARTERS.includes(q)) continue;
    out[q] += Number(e.taxWithheld) || 0;
  }
  return out;
}

export function totalWithheldForYear(entries, year) {
  const y = String(year).slice(0, 4);
  let t = 0;
  for (const e of entries) {
    if (String(e.year || "").slice(0, 4) !== y) continue;
    t += Number(e.taxWithheld) || 0;
  }
  return t;
}
