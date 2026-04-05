import { loadExpenses } from "../data/expenses";

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

function inYear(isoDate, year) {
  if (!isoDate || String(isoDate).length < 4) return false;
  return String(isoDate).slice(0, 4) === String(year);
}

function firstLineDescription(inv) {
  const lines = inv.lineItems || [];
  const d = lines.map((l) => String(l.description || "").trim()).filter(Boolean);
  return d.length ? d[0] : "Professional services";
}

/**
 * Revenue rows from saved invoices (gross receipts / sales).
 */
export function buildRevenueRows(userId, year) {
  const invoices = loadInvoices(userId).filter((inv) => inYear(inv.issueDate, year));
  return invoices
    .map((inv) => ({
      date: inv.issueDate || "",
      reference: inv.invoiceNumber || inv.id?.slice(0, 8) || "—",
      customer: String(inv.clientName || "").trim() || "—",
      description: firstLineDescription(inv),
      amount: Number(inv.total) || 0,
      orNumber: inv.orNumber || "",
      paid: !!inv.paid,
    }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

/**
 * Expense rows for the year.
 */
export function buildExpenseRows(userId, year) {
  return loadExpenses(userId)
    .filter((e) => inYear(e.date, year))
    .map((e) => ({
      date: e.date || "",
      payee: String(e.payee || "").trim() || "—",
      description: String(e.description || "").trim() || "—",
      category: e.category || "other",
      amount: Number(e.amount) || 0,
    }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

/** Raw expense entries for the year (includes `id` for edit/delete in UI). */
export function listExpensesForYear(userId, year) {
  return loadExpenses(userId)
    .filter((e) => inYear(e.date, year))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

function csvEscape(val) {
  const s = val == null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return cells.map(csvEscape).join(",");
}

export function buildRevenueJournalCsv(userId, year) {
  const rows = buildRevenueRows(userId, year);
  const lines = [
    csvLine(["date", "invoice_ref", "or_number", "customer", "description", "amount_php", "paid"]),
  ];
  for (const r of rows) {
    lines.push(
      csvLine([
        r.date,
        r.reference,
        r.orNumber,
        r.customer,
        r.description,
        r.amount,
        r.paid ? "yes" : "no",
      ])
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

export function buildExpenseJournalCsv(userId, year) {
  const lines = [csvLine(["date", "payee", "description", "category", "amount_php"])];
  for (const e of loadExpenses(userId).filter((x) => inYear(x.date, year))) {
    lines.push(
      csvLine([
        e.date,
        e.payee,
        e.description,
        e.category || "other",
        Number(e.amount) || 0,
      ])
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

export function buildCombinedBooksCsv(userId, year) {
  const lines = [
    csvLine(["entry_type", "date", "reference", "counterparty", "description", "amount_php", "extra"]),
  ];
  for (const inv of loadInvoices(userId).filter((i) => inYear(i.issueDate, year))) {
    lines.push(
      csvLine([
        "REVENUE",
        inv.issueDate,
        inv.invoiceNumber || "",
        inv.clientName || "",
        firstLineDescription(inv),
        Number(inv.total) || 0,
        inv.paid ? "paid" : "unpaid",
      ])
    );
  }
  for (const e of loadExpenses(userId).filter((x) => inYear(x.date, year))) {
    lines.push(
      csvLine([
        "EXPENSE",
        e.date,
        "—",
        e.payee,
        e.description,
        Number(e.amount) || 0,
        e.category || "other",
      ])
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

export function totalsForYear(userId, year) {
  const rev = buildRevenueRows(userId, year);
  const exp = buildExpenseRows(userId, year);
  const gross = rev.reduce((s, r) => s + r.amount, 0);
  const expTotal = exp.reduce((s, r) => s + r.amount, 0);
  return { gross, expenses: expTotal, net: gross - expTotal, countRev: rev.length, countExp: exp.length };
}
