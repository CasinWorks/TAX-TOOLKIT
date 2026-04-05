import JSZip from "jszip";
import { loadBusinesses } from "../data/businesses";
import { loadClients } from "../data/clients";
import { generateBirDeadlines, loadDeadlinePrefs } from "../data/birDeadlines";
import { loadForm2307Entries } from "../data/form2307";
import { loadAllIncomeYtdByYear, MONTH_LABELS } from "../data/incomeYtd";
import { PRE_CPA_ITEMS, loadPreCpaChecks, preCpaCompletion } from "../data/preCpaReadiness";
import { loadTaxSnapshot } from "../data/taxSnapshot";
import { buildIncomeDashboard } from "./incomeDashboard";
import { loadExpenses } from "../data/expenses";
import { buildCombinedBooksCsv, buildExpenseJournalCsv, buildRevenueJournalCsv } from "./booksJournal";

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

function csvEscape(val) {
  const s = val == null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvLine(cells) {
  return cells.map(csvEscape).join(",");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([text], { type: mime }));
}

const LEGAL_BLOCK = `LEGAL / LIMITATIONS
IC Toolkit is a personal organizer and calculator. It does NOT constitute tax, legal, or accounting advice.
Figures here are NOT filed with the BIR. A licensed CPA must validate your records, apply current Revenue Regulations,
and prepare or review official returns (e.g. 1701Q, 1701, 2551Q, VAT returns) before filing.
The end user remains responsible for compliance.
`;

const CPA_CHECKLIST = `CPA VALIDATION CHECKLIST (suggested)
□ Taxpayer identity & registered business name / trade name match BIR records
□ Correct tax regime for the year (8% vs graduated / OSD vs itemized) and eligibility rules
□ Gross receipts / sales reconcile with books, bank, and invoices in this export
□ Form 2307 entries match physical/electronic certificates; quarters and amounts
□ Withholding (2307) applied correctly against income tax due per RMO / forms in effect
□ Percentage tax (2551Q) and income tax (1701Q / 1701) coordination if on graduated path
□ VAT registration status: if VAT-registered, this export does NOT replace VAT returns / SLSP
□ Deductions, exclusions, and special cases reviewed (mixed income, foreign clients, etc.)
□ 1701Q: actual quarterly computation vs any simplified annual÷4 model in this pack
□ Final numbers signed off before eFPS or authorized filing channel
`;

/**
 * Gathers local data and builds summary text + CSV + optional JSON snapshot.
 */
function buildIncomeQuarterlyExport(userId, year) {
  const Q = ["Q1", "Q2", "Q3", "Q4"];
  const csvRows = [
    csvLine([
      "year",
      "quarter",
      "gross_invoices",
      "withheld_2307",
      "est_income_tax_quarter",
      "take_home_est",
      "ytd_gross_through_quarter",
      "tax_mode",
    ]),
  ];
  const textLines = [`Income dashboard — year ${year} (matches IC Toolkit Income tab)`];
  for (const q of Q) {
    const d = buildIncomeDashboard(userId, year, q);
    csvRows.push(
      csvLine([
        year,
        q,
        d.grossQuarter,
        d.withheldQuarter,
        d.estimatedTaxQuarter,
        d.takeHomeQuarter,
        d.ytdGross,
        d.taxMode,
      ])
    );
    textLines.push(
      `${q}: gross ₱${Math.round(d.grossQuarter).toLocaleString("en-PH")} | 2307 ₱${Math.round(d.withheldQuarter).toLocaleString("en-PH")} | est IT Q ₱${Math.round(d.estimatedTaxQuarter).toLocaleString("en-PH")} | take-home est ₱${Math.round(d.takeHomeQuarter).toLocaleString("en-PH")} | YTD gross ₱${Math.round(d.ytdGross).toLocaleString("en-PH")} (${d.taxMode})`
    );
  }
  return { csv: "\uFEFF" + csvRows.join("\r\n"), text: textLines.join("\n") };
}

function buildDeadlinesExport(userId, year) {
  const prefs = loadDeadlinePrefs(userId);
  const list = generateBirDeadlines(year, prefs);
  const lines = [
    `BIR deadline list — calendar ${year}`,
    `Saved prefs: income_tax_option=${prefs.regime}, vat_registered=${prefs.vat}`,
    "Verify all dates/forms against COR and current BIR issuances.",
    "",
    ...list.map((d) => `${d.date} | ${d.form} | ${d.title}`),
    "",
    "Compute:",
    ...list.map((d) => `  [${d.date}] ${d.form}: ${d.compute}`),
  ];
  return lines.join("\n");
}

export function buildCpaPack(userId, userInfo = {}) {
  const when = new Date().toISOString();
  const dateSlug = when.slice(0, 10);
  const reportYear = new Date().getFullYear();

  const businesses = loadBusinesses(userId);
  const clients = loadClients(userId);
  const invoices = loadInvoices(userId);
  const entries2307 = loadForm2307Entries(userId);
  const incomeByYear = loadAllIncomeYtdByYear(userId);
  const taxSnapshot = loadTaxSnapshot(userId);
  const preCpaChecks = loadPreCpaChecks(userId);
  const { done, total, pct } = preCpaCompletion(preCpaChecks);

  const incomeQuarterly = buildIncomeQuarterlyExport(userId, reportYear);
  const deadlinesText = buildDeadlinesExport(userId, reportYear);
  const expensesLogged = loadExpenses(userId);
  const revenueBooksCsv = buildRevenueJournalCsv(userId, reportYear);
  const expenseBooksCsv = buildExpenseJournalCsv(userId, reportYear);
  const combinedBooksCsv = buildCombinedBooksCsv(userId, reportYear);

  const preCpaLines = PRE_CPA_ITEMS.map((item) => {
    const mark = preCpaChecks[item.id] ? "[x]" : "[ ]";
    return `${mark} ${item.label}`;
  });

  const headerLines = [
    "IC TOOLKIT — CPA HANDOFF SUMMARY",
    `Generated (UTC): ${when}`,
    `Account name: ${userInfo.name || "—"}`,
    `Account email: ${userInfo.email || "—"}`,
    `User ID (reference): ${userId || "—"}`,
    "",
    LEGAL_BLOCK,
    "",
    `--- PRE-CPA READINESS (${done}/${total} = ${pct}%) ---`,
    ...preCpaLines,
    "",
    CPA_CHECKLIST,
    "",
    "--- COUNTS ---",
    `Businesses: ${businesses.length}`,
    `Clients (saved): ${clients.length}`,
    `Invoices saved: ${invoices.length}`,
    `Expense rows logged (books): ${expensesLogged.length}`,
    `Form 2307 entries: ${entries2307.length}`,
    `Income YTD years logged: ${Object.keys(incomeByYear || {}).length}`,
    "",
    "--- TAX ESTIMATOR SNAPSHOT (last auto-saved; requires login + estimator view) ---",
    taxSnapshot
      ? JSON.stringify(taxSnapshot, null, 2)
      : "(Walang snapshot — buksan ang Tax estimator at mag-load ng result para ma-save.)",
    "",
    `--- INCOME BY QUARTER (year ${reportYear}; see income-by-quarter.csv in ZIP) ---`,
    incomeQuarterly.text,
    "",
    `--- BIR DEADLINES (year ${reportYear}; see bir-deadlines.txt in ZIP) ---`,
    deadlinesText.split("\n").slice(0, 25).join("\n") + (deadlinesText.split("\n").length > 25 ? "\n… (full list in ZIP file)" : ""),
    "",
    "--- FILES IN THIS PACK ---",
    "• summary .txt — full text (this content + pointers)",
    "• data .csv — businesses, clients, invoices, 2307, income YTD, pre-CPA flags, tax snapshot fields",
    "• income-by-quarter.csv — gross / 2307 / est. tax / take-home per quarter (same as Income tab)",
    `• bir-deadlines-${reportYear}.txt — deadline prefs + dated list`,
    `• books-revenue-${reportYear}.csv, books-expenses-${reportYear}.csv, books-combined-${reportYear}.csv — simplified journals (year ${reportYear})`,
    taxSnapshot ? "• tax-snapshot.json — same snapshot as JSON for CPA tools" : "",
    "",
    "End of summary.",
  ].filter(Boolean);

  const summaryText = headerLines.join("\n");

  const csvSections = [];

  csvSections.push(csvLine(["META", "key", "value"]));
  csvSections.push(csvLine(["META", "generated_utc", when]));
  csvSections.push(csvLine(["META", "account_name", userInfo.name || ""]));
  csvSections.push(csvLine(["META", "account_email", userInfo.email || ""]));
  csvSections.push(csvLine(["META", "user_id", userId || ""]));
  csvSections.push(csvLine(["META", "pre_cpa_done", String(done)]));
  csvSections.push(csvLine(["META", "pre_cpa_total", String(total)]));
  csvSections.push(csvLine(["META", "pre_cpa_pct", String(pct)]));

  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["PRE_CPA", "id", "checked", "label"]));
  for (const item of PRE_CPA_ITEMS) {
    csvSections.push(csvLine(["PRE_CPA", item.id, preCpaChecks[item.id] ? "yes" : "no", item.label]));
  }

  if (taxSnapshot) {
    csvSections.push(csvLine([]));
    csvSections.push(csvLine(["TAX_SNAPSHOT", "field", "value"]));
    for (const [k, v] of Object.entries(taxSnapshot)) {
      if (k === "withheldByQ" && v && typeof v === "object") {
        for (const [q, amt] of Object.entries(v)) {
          csvSections.push(csvLine(["TAX_SNAPSHOT", `withheldByQ_${q}`, amt]));
        }
      } else if (k !== "withheldByQ") {
        const val =
          v !== null && typeof v === "object" ? JSON.stringify(v) : v === undefined ? "" : v;
        csvSections.push(csvLine(["TAX_SNAPSHOT", k, val]));
      }
    }
  }

  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["BUSINESSES", "id", "businessName", "tin", "rdo", "address", "phone", "email"]));
  for (const b of businesses) {
    csvSections.push(
      csvLine([
        "BUSINESSES",
        b.id,
        b.businessName,
        b.tin,
        b.rdo,
        b.address,
        b.phone,
        b.email,
      ])
    );
  }

  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["CLIENTS", "id", "name", "tin", "address"]));
  for (const c of clients) {
    csvSections.push(csvLine(["CLIENTS", c.id, c.name, c.tin || "", c.address || ""]));
  }

  csvSections.push(csvLine([]));
  csvSections.push(
    csvLine([
      "INVOICES",
      "id",
      "invoiceNumber",
      "orNumber",
      "issueDate",
      "clientName",
      "clientTin",
      "total",
      "subtotal",
      "vatAmount",
      "paid",
      "withheldAmount",
      "businessId",
      "updatedAt",
    ])
  );
  for (const inv of invoices) {
    csvSections.push(
      csvLine([
        "INVOICES",
        inv.id,
        inv.invoiceNumber,
        inv.orNumber,
        inv.issueDate,
        inv.clientName,
        inv.clientTin,
        inv.total,
        inv.subtotal,
        inv.vatAmount,
        inv.paid ? "yes" : "no",
        inv.withheldAmount,
        inv.businessId,
        inv.updatedAt,
      ])
    );
  }

  csvSections.push(csvLine([]));
  csvSections.push(
    csvLine([
      "FORM_2307",
      "id",
      "clientName",
      "quarter",
      "year",
      "grossAmount",
      "taxWithheld",
      "invoiceNumber",
      "notes",
      "createdAt",
    ])
  );
  for (const e of entries2307) {
    csvSections.push(
      csvLine([
        "FORM_2307",
        e.id,
        e.clientName,
        e.quarter,
        e.year,
        e.grossAmount,
        e.taxWithheld,
        e.invoiceNumber || "",
        (e.notes || "").replace(/\r?\n/g, " "),
        e.createdAt,
      ])
    );
  }

  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["INCOME_YTD", "year", ...MONTH_LABELS]));
  for (const year of Object.keys(incomeByYear || {}).sort()) {
    const rec = incomeByYear[year];
    const m = Array.isArray(rec?.months) ? rec.months.map((x) => Number(x) || 0) : [];
    while (m.length < 12) m.push(0);
    csvSections.push(csvLine(["INCOME_YTD", year, ...m.slice(0, 12)]));
  }

  csvSections.push(csvLine([]));
  csvSections.push(
    csvLine([
      "INCOME_DASHBOARD_Q",
      "year",
      "quarter",
      "gross_invoices",
      "withheld_2307",
      "est_income_tax_quarter",
      "take_home_est",
      "ytd_gross",
      "tax_mode",
    ])
  );
  for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
    const d = buildIncomeDashboard(userId, reportYear, q);
    csvSections.push(
      csvLine([
        "INCOME_DASHBOARD_Q",
        reportYear,
        q,
        d.grossQuarter,
        d.withheldQuarter,
        d.estimatedTaxQuarter,
        d.takeHomeQuarter,
        d.ytdGross,
        d.taxMode,
      ])
    );
  }

  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["DEADLINE_PREFS", "field", "value"]));
  const dp = loadDeadlinePrefs(userId);
  csvSections.push(csvLine(["DEADLINE_PREFS", "income_tax_option", dp.regime]));
  csvSections.push(csvLine(["DEADLINE_PREFS", "vat_registered", dp.vat ? "yes" : "no"]));
  csvSections.push(csvLine([]));
  csvSections.push(csvLine(["BIR_DEADLINE", "date", "form", "title", "compute"]));
  for (const bd of generateBirDeadlines(reportYear, dp)) {
    csvSections.push(csvLine(["BIR_DEADLINE", bd.date, bd.form, bd.title, bd.compute.replace(/\r?\n/g, " ")]));
  }

  const csvText = "\uFEFF" + csvSections.join("\r\n");

  return {
    summaryText,
    csvText,
    dateSlug,
    taxSnapshot,
    incomeQuarterlyCsv: incomeQuarterly.csv,
    deadlinesTxt: deadlinesText,
    reportYear,
    revenueBooksCsv,
    expenseBooksCsv,
    combinedBooksCsv,
  };
}

/** One .zip: summary, CSV, optional tax-snapshot.json — avoids blocked multi-downloads. */
export async function downloadCpaPackZip(userId, userInfo) {
  if (!userId) return;
  const {
    summaryText,
    csvText,
    dateSlug,
    taxSnapshot,
    incomeQuarterlyCsv,
    deadlinesTxt,
    reportYear,
    revenueBooksCsv,
    expenseBooksCsv,
    combinedBooksCsv,
  } = buildCpaPack(userId, userInfo);
  const zip = new JSZip();
  zip.file(`IC-Toolkit-CPA-summary-${dateSlug}.txt`, summaryText);
  zip.file(`IC-Toolkit-CPA-data-${dateSlug}.csv`, csvText);
  zip.file(`IC-Toolkit-income-by-quarter-${reportYear}-${dateSlug}.csv`, incomeQuarterlyCsv);
  zip.file(`IC-Toolkit-bir-deadlines-${reportYear}-${dateSlug}.txt`, deadlinesTxt);
  zip.file(`IC-Toolkit-books-revenue-${reportYear}-${dateSlug}.csv`, revenueBooksCsv);
  zip.file(`IC-Toolkit-books-expenses-${reportYear}-${dateSlug}.csv`, expenseBooksCsv);
  zip.file(`IC-Toolkit-books-combined-${reportYear}-${dateSlug}.csv`, combinedBooksCsv);
  if (taxSnapshot) {
    zip.file(`IC-Toolkit-tax-snapshot-${dateSlug}.json`, JSON.stringify(taxSnapshot, null, 2));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(`IC-Toolkit-CPA-pack-${dateSlug}.zip`, blob);
}

export function downloadCpaPackSeparate(userId, userInfo) {
  if (!userId) return;
  const {
    summaryText,
    csvText,
    dateSlug,
    incomeQuarterlyCsv,
    deadlinesTxt,
    reportYear,
    revenueBooksCsv,
    expenseBooksCsv,
    combinedBooksCsv,
  } = buildCpaPack(userId, userInfo);
  downloadText(`IC-Toolkit-CPA-summary-${dateSlug}.txt`, summaryText);
  setTimeout(() => {
    downloadText(`IC-Toolkit-CPA-data-${dateSlug}.csv`, csvText, "text/csv;charset=utf-8");
  }, 300);
  setTimeout(() => {
    downloadText(`IC-Toolkit-income-by-quarter-${reportYear}-${dateSlug}.csv`, incomeQuarterlyCsv, "text/csv;charset=utf-8");
  }, 600);
  setTimeout(() => {
    downloadText(`IC-Toolkit-bir-deadlines-${reportYear}-${dateSlug}.txt`, deadlinesTxt);
  }, 900);
  setTimeout(() => {
    downloadText(`IC-Toolkit-books-revenue-${reportYear}-${dateSlug}.csv`, revenueBooksCsv, "text/csv;charset=utf-8");
  }, 1200);
  setTimeout(() => {
    downloadText(`IC-Toolkit-books-expenses-${reportYear}-${dateSlug}.csv`, expenseBooksCsv, "text/csv;charset=utf-8");
  }, 1500);
  setTimeout(() => {
    downloadText(`IC-Toolkit-books-combined-${reportYear}-${dateSlug}.csv`, combinedBooksCsv, "text/csv;charset=utf-8");
  }, 1800);
}
