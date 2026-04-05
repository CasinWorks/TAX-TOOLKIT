import { loadForm2307Entries } from "../data/form2307";
import { loadTaxSnapshot } from "../data/taxSnapshot";
import { quarterAndYearFromIso } from "./quarterFromDate";

const invoicesKey = (userId) => `ict_invoices_${userId}`;

function loadInvoices(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(invoicesKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const Q_ORDER = ["Q1", "Q2", "Q3", "Q4"];

function normClient(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const BRACKETS = [
  { min: 0, max: 250000, base: 0, rate: 0 },
  { min: 250000, max: 400000, base: 0, rate: 0.15 },
  { min: 400000, max: 800000, base: 22500, rate: 0.2 },
  { min: 800000, max: 2000000, base: 102500, rate: 0.25 },
  { min: 2000000, max: 8000000, base: 402500, rate: 0.3 },
  { min: 8000000, max: Infinity, base: 2202500, rate: 0.35 },
];

function graduatedIncomeTax(net) {
  if (net <= 0) return 0;
  for (const b of BRACKETS) {
    if (net <= b.max) return b.base + (net - b.min) * b.rate;
  }
  return 0;
}

/** Same tax math as TaxEstimator. */
function computeAnnualTax(annual) {
  if (!annual || annual <= 0) return null;
  const taxable8 = Math.max(0, annual - 250000);
  const flatTax = taxable8 * 0.08;
  const netTaxable = annual * 0.6;
  const gradIncomeTax = graduatedIncomeTax(netTaxable);
  const percentageTax = annual * 0.03;
  const gradTotal = gradIncomeTax + percentageTax;
  const winner = flatTax <= gradTotal ? "flat" : "grad";
  return {
    winner,
    flatAnnualTax: flatTax,
    gradAnnualTax: gradTotal,
    flatQuarterTax: flatTax / 4,
    gradQuarterTax: gradTotal / 4,
  };
}

function projectLabel(inv) {
  const lines = inv.lineItems || [];
  const descs = lines.map((l) => String(l.description || "").trim()).filter(Boolean);
  if (descs.length === 0) return "—";
  if (descs.length === 1) return descs[0].length > 56 ? `${descs[0].slice(0, 53)}…` : descs[0];
  const first = descs[0].length > 32 ? `${descs[0].slice(0, 29)}…` : descs[0];
  return `${first} (+${descs.length - 1} line)`;
}

function invoiceInYearQuarter(inv, yearStr, quarter) {
  const { quarter: q, year: y } = quarterAndYearFromIso(inv.issueDate || "");
  return y === yearStr && q === quarter;
}

function invoiceYtdThroughQuarter(inv, yearStr, throughQuarter) {
  const qi = Q_ORDER.indexOf(throughQuarter);
  if (qi < 0) return false;
  const { quarter: q, year: y } = quarterAndYearFromIso(inv.issueDate || "");
  if (y !== yearStr) return false;
  return Q_ORDER.indexOf(q) <= qi;
}

/**
 * @param {string} userId
 * @param {number} year
 * @param {string} quarter Q1-Q4
 */
export function buildIncomeDashboard(userId, year, quarter) {
  const yearStr = String(year);
  const invoices = loadInvoices(userId);
  const entries2307 = loadForm2307Entries(userId);
  const snapshot = loadTaxSnapshot(userId);

  const inQuarter = (inv) => invoiceInYearQuarter(inv, yearStr, quarter);
  const inYtd = (inv) => invoiceYtdThroughQuarter(inv, yearStr, quarter);

  let grossQuarter = 0;
  const byClientMap = new Map();

  for (const inv of invoices) {
    if (!inQuarter(inv)) continue;
    const t = Number(inv.total) || 0;
    grossQuarter += t;
    const key = normClient(inv.clientName);
    const display = String(inv.clientName || "Unknown").trim() || "Unknown";
    if (!byClientMap.has(key)) {
      byClientMap.set(key, { clientName: display, gross: 0, invoiceCount: 0, invoiceIds: [] });
    }
    const row = byClientMap.get(key);
    row.gross += t;
    row.invoiceCount += 1;
    row.invoiceIds.push(inv.id);
  }

  let withheldQuarter = 0;
  const byClientWithheld = new Map();

  for (const e of entries2307) {
    if (String(e.year || "").slice(0, 4) !== yearStr) continue;
    if (e.quarter !== quarter) continue;
    const w = Number(e.taxWithheld) || 0;
    withheldQuarter += w;
    const key = normClient(e.clientName);
    const display = String(e.clientName || "").trim() || "Unknown";
    if (!byClientWithheld.has(key)) {
      byClientWithheld.set(key, { clientName: display, withheld: 0 });
    }
    byClientWithheld.get(key).withheld += w;
  }

  const byClient = [];
  const keys = new Set([...byClientMap.keys(), ...byClientWithheld.keys()]);
  for (const key of keys) {
    const g = byClientMap.get(key);
    const w = byClientWithheld.get(key);
    byClient.push({
      key,
      clientName: g?.clientName || w?.clientName || "Unknown",
      gross: g?.gross || 0,
      withheld: w?.withheld || 0,
      invoiceCount: g?.invoiceCount || 0,
    });
  }
  byClient.sort((a, b) => b.gross - a.gross);

  const invoicesThisQuarter = invoices
    .filter(inQuarter)
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || "",
      clientName: String(inv.clientName || "").trim() || "—",
      total: Number(inv.total) || 0,
      issueDate: inv.issueDate || "",
      paid: !!inv.paid,
      projectLabel: projectLabel(inv),
    }))
    .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""));

  let ytdGross = 0;
  for (const inv of invoices) {
    if (!inYtd(inv)) continue;
    ytdGross += Number(inv.total) || 0;
  }

  const qi = Math.max(1, Q_ORDER.indexOf(quarter) + 1);
  const annualizedFromYtd = qi > 0 ? (ytdGross / qi) * 4 : 0;

  let estimatedTaxQuarter = 0;
  let taxMode = "projected";
  let recommended = null;

  if (
    snapshot &&
    Number(snapshot.taxYear) === year &&
    snapshot.flatAnnualTax != null &&
    snapshot.gradAnnualTax != null
  ) {
    recommended = snapshot.recommended || "flat";
    const annual = recommended === "flat" ? snapshot.flatAnnualTax : snapshot.gradAnnualTax;
    estimatedTaxQuarter = annual / 4;
    taxMode = "snapshot";
  } else {
    const t = computeAnnualTax(annualizedFromYtd);
    if (t) {
      recommended = t.winner;
      estimatedTaxQuarter = t.winner === "flat" ? t.flatQuarterTax : t.gradQuarterTax;
    }
  }

  const takeHomeQuarter = grossQuarter - withheldQuarter - estimatedTaxQuarter;

  return {
    year,
    quarter,
    grossQuarter,
    withheldQuarter,
    estimatedTaxQuarter,
    takeHomeQuarter,
    ytdGross,
    annualizedFromYtd,
    byClient,
    invoicesThisQuarter,
    taxMode,
    recommended,
    snapshotMatched: !!(snapshot && Number(snapshot.taxYear) === year),
  };
}
