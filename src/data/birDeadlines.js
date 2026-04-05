/** Generate BIR-oriented deadline rows + ICS (simplified for freelancers / professionals). */

const prefsKey = (userId) => `ict_deadline_prefs_${userId}`;

export const DEFAULT_DEADLINE_PREFS = {
  regime: "graduated", // "flat8" | "graduated"
  vat: false,
};

export function loadDeadlinePrefs(userId) {
  if (!userId) return { ...DEFAULT_DEADLINE_PREFS };
  try {
    const raw = localStorage.getItem(prefsKey(userId));
    if (!raw) return { ...DEFAULT_DEADLINE_PREFS };
    const p = JSON.parse(raw);
    return {
      regime: p.regime === "flat8" ? "flat8" : "graduated",
      vat: !!p.vat,
    };
  } catch {
    return { ...DEFAULT_DEADLINE_PREFS };
  }
}

export function saveDeadlinePrefs(userId, prefs) {
  if (!userId) return;
  try {
    localStorage.setItem(prefsKey(userId), JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/**
 * @typedef {{ id: string, date: string, form: string, title: string, compute: string, bring: string, category: string }} BirDeadline
 */

/**
 * @param {number} year - Calendar year the return relates to (1701 annual for year ends Apr next year)
 * @param {{ regime: 'flat8'|'graduated', vat: boolean }} prefs
 * @returns {BirDeadline[]}
 */
export function generateBirDeadlines(year, prefs) {
  const y = year;
  const regime = prefs.regime || "graduated";
  const vat = !!prefs.vat;
  const out = [];

  const add = (id, date, form, title, compute, bring, category) => {
    out.push({ id, date, form, title, compute, bring, category });
  };

  // 1701Q — quarterly income tax (professionals / mixed)
  add(
    `1701q-q1-${y}`,
    `${y}-05-15`,
    "1701Q",
    `Income tax — Q1 (Jan–Mar ${y})`,
    "Quarterly taxable income vs payments; apply 8% or graduated per COR; creditable 2307.",
    "Books/records, 2307 certificates, proof of payment, prior quarters if any.",
    "income_tax"
  );
  add(
    `1701q-q2-${y}`,
    `${y}-08-15`,
    "1701Q",
    `Income tax — Q2 (Apr–Jun ${y})`,
    "Cumulative position for the year to date; withholding credits.",
    "Same as Q1 pack + updated AR/sales summary.",
    "income_tax"
  );
  add(
    `1701q-q3-${y}`,
    `${y}-11-15`,
    "1701Q",
    `Income tax — Q3 (Jul–Sep ${y})`,
    "Continue cumulative computation; reconcile vs books.",
    "2307, invoices, expense/OSD or itemized support as applicable.",
    "income_tax"
  );

  // Annual ITR for calendar year y — due Apr 15 of y+1
  add(
    `1701-annual-${y}`,
    `${y + 1}-04-15`,
    "1701",
    `Annual Income Tax — year ${y}`,
    "Full-year reconciliation; final 8% vs graduated; annual 2307 credits.",
    "Annual financial statements if required, 2307, BIR/audit trail, payment proof.",
    "income_tax"
  );

  // Percentage tax (2551Q) — typically for graduated / non-VAT percentage tax filers; 8% often exempt
  if (regime === "graduated") {
    add(
      `2551q-q1-${y}`,
      `${y}-04-25`,
      "2551Q",
      `Percentage tax — Q1 (${y})`,
      "3% on gross receipts (non-VAT) for the quarter — verify ATC/COR.",
      "Sales book / summary, OR series, prior filings.",
      "percentage_tax"
    );
    add(
      `2551q-q2-${y}`,
      `${y}-07-25`,
      "2551Q",
      `Percentage tax — Q2 (${y})`,
      "Same as Q1 for Apr–Jun receipts.",
      "Quarterly sales summary, OR references.",
      "percentage_tax"
    );
    add(
      `2551q-q3-${y}`,
      `${y}-10-25`,
      "2551Q",
      `Percentage tax — Q3 (${y})`,
      "Jul–Sep receipts.",
      "Records + payment references.",
      "percentage_tax"
    );
    add(
      `2551q-q4-${y}`,
      `${y + 1}-01-25`,
      "2551Q",
      `Percentage tax — Q4 (${y})`,
      "Oct–Dec receipts; due Jan 25 of next year.",
      "Full quarter sales proof.",
      "percentage_tax"
    );
  }
  // 8% (OTR): no 2551Q rows — explain in UI (often exempt from percentage tax; still file 1701Q/1701).

  if (vat) {
    add(
      `vat-q1-${y}`,
      `${y}-04-25`,
      "2550Q",
      `VAT quarterly (Q1 Jan–Mar ${y}) — typical due pattern`,
      "Output VAT − input VAT for the quarter (simplified). Actual cycle depends on registration.",
      "Sales/purchase invoices, VAT returns, SLSP if applicable.",
      "vat"
    );
    add(
      `vat-q2-${y}`,
      `${y}-07-25`,
      "2550Q",
      `VAT quarterly (Q2) — ${y}`,
      "Same pattern — confirm monthly vs quarterly on COR.",
      "Complete VAT invoices + books.",
      "vat"
    );
    add(
      `vat-q3-${y}`,
      `${y}-10-25`,
      "2550Q",
      `VAT quarterly (Q3) — ${y}`,
      "Reconcile SLSP; watch creditable VAT.",
      "OR/sales file, purchase journal.",
      "vat"
    );
    add(
      `vat-q4-${y}`,
      `${y + 1}-01-25`,
      "2550Q",
      `VAT quarterly (Q4) — ${y}`,
      "Due following January (typical quarterly pattern).",
      "Year-end cut-off invoices.",
      "vat"
    );
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * @param {BirDeadline[]} deadlines
 * @param {{ prodId?: string }} [opts]
 */
function nextCalendarDayYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  t.setDate(t.getDate() + 1);
  const yy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function buildIcsCalendar(deadlines, opts = {}) {
  const prodId = opts.prodId || "-//IC Toolkit//BIR Deadlines//EN";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `PRODID:${prodId}`,
    "METHOD:PUBLISH",
    "X-WR-CALNAME:IC Toolkit — BIR deadlines",
  ];

  for (const d of deadlines) {
    if (!d.date || d.form === "—") continue;
    const desc = [`Form: ${d.form}`, `Compute: ${d.compute}`, `Bring / prep: ${d.bring}`].join("\\n");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${d.id}@ict-toolkit.local`);
    lines.push(`DTSTART;VALUE=DATE:${d.date.replace(/-/g, "")}`);
    lines.push(`DTEND;VALUE=DATE:${nextCalendarDayYmd(d.date)}`);
    lines.push(`SUMMARY:${icsEscape(`${d.form} ${d.title}`)}`);
    lines.push(`DESCRIPTION:${icsEscape(desc)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
