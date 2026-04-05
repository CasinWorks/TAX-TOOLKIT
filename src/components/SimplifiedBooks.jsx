import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { EXPENSE_CATEGORIES, emptyExpenseForm, loadExpenses, saveExpenses } from "../data/expenses";
import {
  buildCombinedBooksCsv,
  buildExpenseJournalCsv,
  buildRevenueJournalCsv,
  buildRevenueRows,
  listExpensesForYear,
  totalsForYear,
} from "../utils/booksJournal";
import { downloadElementAsPdf } from "../utils/pdfExport";
import { peso, theme } from "../theme";

function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function categoryLabel(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function SimplifiedBooks({ userId }) {
  const y0 = new Date().getFullYear();
  const [year, setYear] = useState(y0);
  const [form, setForm] = useState(emptyExpenseForm);
  const [tick, setTick] = useState(0);
  const pdfRef = useRef(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const revenueRows = useMemo(() => (userId ? buildRevenueRows(userId, year) : []), [userId, year, tick]);
  const expenseRows = useMemo(() => (userId ? listExpensesForYear(userId, year) : []), [userId, year, tick]);
  const totals = useMemo(() => (userId ? totalsForYear(userId, year) : null), [userId, year, tick]);

  const persistExpenses = (next) => {
    if (!userId) return;
    saveExpenses(userId, next);
    refresh();
  };

  const addExpense = (e) => {
    e.preventDefault();
    if (!userId) return;
    const amt = parseFloat(String(form.amount).replace(/,/g, ""), 10);
    if (!form.date || !form.payee.trim() || !Number.isFinite(amt) || amt <= 0) return;
    const row = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}`,
      date: form.date,
      payee: form.payee.trim(),
      description: form.description.trim(),
      amount: amt,
      category: form.category || "other",
      createdAt: Date.now(),
    };
    persistExpenses([...(loadExpenses(userId) || []), row]);
    setForm(emptyExpenseForm());
  };

  const removeExpense = (id) => {
    if (!userId || !window.confirm("Delete this expense row?")) return;
    persistExpenses(loadExpenses(userId).filter((x) => x.id !== id));
  };

  const onDownloadPdf = async () => {
    if (!pdfRef.current) return;
    await downloadElementAsPdf(pdfRef.current, `IC-Toolkit-books-${year}.pdf`);
  };

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  if (!userId) {
    return (
      <div style={S.card}>
        <p style={{ fontSize: 14, color: "#9B9991", margin: 0 }}>Mag-login para mag-log ng expenses at i-export ang books.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...S.card, padding: "1.25rem", marginBottom: 14 }}>
        <p style={{ fontSize: 14, color: "#6B6B66", margin: "0 0 12px", lineHeight: 1.6 }}>
          <strong style={{ color: "#1A1A18" }}>Simplified books</strong> — revenue ay galing sa mga na-save mong invoice; magdagdag ng expense rows para sa basic cash picture. I-export bilang CSV o PDF para sa CPA. Hindi ito substitute sa full ledger o BIR books.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 13 }}>
          <Link to="/app?tab=invoices" style={{ color: "#1A3A6E", fontWeight: 500 }}>
            Mga invoice
          </Link>
          <span style={{ color: "#C5C2BA" }}>·</span>
          <Link to="/app?tab=cpa" style={{ color: "#1A3A6E", fontWeight: 500 }}>
            CPA pack (kasama ang books CSV sa ZIP)
          </Link>
        </div>
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 6 }}>Year</label>
            <input
              type="text"
              inputMode="numeric"
              value={String(year)}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (!n) return;
                setYear(Math.min(2100, Math.max(2000, parseInt(n, 10))));
              }}
              style={{
                width: 88,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Fira Code', monospace",
                fontSize: 16,
                background: "#FAFAF8",
              }}
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #E5E2D9",
              background: "#FFFFFF",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Refresh
          </button>
        </div>

        {totals && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#FAFAF8",
              border: "1px solid #EDE9E2",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#9B9991" }}>Gross (invoices)</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, color: "#0B3D2C" }}>{peso(totals.gross)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9B9991" }}>Expenses (logged)</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, color: "#8B4513" }}>{peso(totals.expenses)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9B9991" }}>Simple net</div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, color: "#1A1A18" }}>{peso(totals.net)}</div>
            </div>
          </div>
        )}

        <div style={S.sectionLabel}>Export</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => downloadCsv(`IC-Toolkit-revenue-journal-${year}.csv`, buildRevenueJournalCsv(userId, year))}
            style={btnSecondary}
          >
            CSV revenue
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(`IC-Toolkit-expense-journal-${year}.csv`, buildExpenseJournalCsv(userId, year))}
            style={btnSecondary}
          >
            CSV expenses
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(`IC-Toolkit-books-combined-${year}.csv`, buildCombinedBooksCsv(userId, year))}
            style={btnSecondary}
          >
            CSV combined
          </button>
          <button type="button" onClick={onDownloadPdf} style={btnPrimary}>
            PDF preview
          </button>
        </div>

        <div style={S.sectionLabel}>Revenue journal ({revenueRows.length} rows)</div>
        <p style={{ fontSize: 12, color: "#9B9991", margin: "0 0 10px" }}>Isang row bawat na-save na invoice para sa taong ito.</p>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EDE9E2", textAlign: "left", color: "#9B9991", fontSize: 11 }}>
                <th style={{ padding: "8px 6px" }}>Date</th>
                <th style={{ padding: "8px 6px" }}>Ref</th>
                <th style={{ padding: "8px 6px" }}>Customer</th>
                <th style={{ padding: "8px 6px" }}>Description</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "8px 6px" }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {revenueRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "14px 6px", color: "#9B9991" }}>
                    Walang invoice para sa {year}. Mag-save muna sa tab na Invoices & OR.
                  </td>
                </tr>
              ) : (
                revenueRows.map((r, i) => (
                  <tr key={`${r.date}-${r.reference}-${i}`} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td style={{ padding: "8px 6px", fontFamily: "'Fira Code', monospace", fontSize: 12 }}>{r.date}</td>
                    <td style={{ padding: "8px 6px" }}>{r.reference}</td>
                    <td style={{ padding: "8px 6px" }}>{r.customer}</td>
                    <td style={{ padding: "8px 6px", color: "#6B6B66" }}>{r.description}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{peso(r.amount)}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12 }}>{r.paid ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={S.sectionLabel}>Expense journal ({expenseRows.length} rows)</div>
        <form onSubmit={addExpense} style={{ marginBottom: 16, padding: "14px", borderRadius: 10, border: "1px solid #EDE9E2", background: "#FFFCF7" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>Payee / vendor</label>
              <input
                type="text"
                value={form.payee}
                onChange={(e) => setForm((f) => ({ ...f, payee: e.target.value }))}
                placeholder="e.g. Canva, coworking"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>Amount (₱)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What was this for?"
              style={{ ...inputStyle, width: "100%", maxWidth: 480 }}
            />
          </div>
          <button type="submit" style={{ ...btnPrimary, padding: "10px 18px" }}>
            Add expense
          </button>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EDE9E2", textAlign: "left", color: "#9B9991", fontSize: 11 }}>
                <th style={{ padding: "8px 6px" }}>Date</th>
                <th style={{ padding: "8px 6px" }}>Payee</th>
                <th style={{ padding: "8px 6px" }}>Description</th>
                <th style={{ padding: "8px 6px" }}>Category</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "8px 6px" }} />
              </tr>
            </thead>
            <tbody>
              {expenseRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "14px 6px", color: "#9B9991" }}>
                    Walang expense rows para sa {year}. Mag-add sa form sa taas.
                  </td>
                </tr>
              ) : (
                expenseRows.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #F5F3EE" }}>
                    <td style={{ padding: "8px 6px", fontFamily: "'Fira Code', monospace", fontSize: 12 }}>{e.date}</td>
                    <td style={{ padding: "8px 6px" }}>{e.payee}</td>
                    <td style={{ padding: "8px 6px", color: "#6B6B66" }}>{e.description || "—"}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12 }}>{categoryLabel(e.category)}</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>
                      {peso(Number(e.amount) || 0)}
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      <button
                        type="button"
                        onClick={() => removeExpense(e.id)}
                        style={{
                          fontSize: 11,
                          color: "#A67C52",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Off-screen PDF capture */}
      <div
        ref={pdfRef}
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 720,
          padding: 24,
          background: "#FFFFFF",
          fontFamily: "'Outfit', sans-serif",
          color: "#1A1A18",
        }}
      >
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, margin: "0 0 8px", color: "#0B3D2C" }}>
          IC Toolkit — simplified books ({year})
        </h1>
        <p style={{ fontSize: 11, color: "#6B6B66", margin: "0 0 20px" }}>
          Revenue from saved invoices; expenses from rows you logged in this app. Not tax advice — CPA must validate.
        </p>
        <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "#0B3D2C" }}>Revenue</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 18 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: 4 }}>Date</th>
              <th style={{ textAlign: "left", padding: 4 }}>Ref</th>
              <th style={{ textAlign: "left", padding: 4 }}>Customer</th>
              <th style={{ textAlign: "right", padding: 4 }}>₱</th>
            </tr>
          </thead>
          <tbody>
            {revenueRows.map((r, i) => (
              <tr key={`p-${i}`} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 4 }}>{r.date}</td>
                <td style={{ padding: 4 }}>{r.reference}</td>
                <td style={{ padding: 4 }}>{r.customer}</td>
                <td style={{ padding: 4, textAlign: "right" }}>{Math.round(r.amount).toLocaleString("en-PH")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "#0B3D2C" }}>Expenses</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: 4 }}>Date</th>
              <th style={{ textAlign: "left", padding: 4 }}>Payee</th>
              <th style={{ textAlign: "left", padding: 4 }}>Category</th>
              <th style={{ textAlign: "right", padding: 4 }}>₱</th>
            </tr>
          </thead>
          <tbody>
            {expenseRows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 4 }}>{r.date}</td>
                <td style={{ padding: 4 }}>{r.payee}</td>
                <td style={{ padding: 4 }}>{categoryLabel(r.category)}</td>
                <td style={{ padding: 4, textAlign: "right" }}>{Math.round(Number(r.amount) || 0).toLocaleString("en-PH")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totals && (
          <p style={{ fontSize: 12, margin: 0 }}>
            Gross {peso(totals.gross)} · Expenses {peso(totals.expenses)} · Simple net {peso(totals.net)}
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  borderRadius: 8,
  border: "1.5px solid #E5E2D9",
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  background: "#FFFFFF",
  boxSizing: "border-box",
};

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#0B3D2C",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Outfit', sans-serif",
};

const btnSecondary = {
  ...btnPrimary,
  background: "#FFFFFF",
  color: "#0B3D2C",
  border: "1px solid #E5E2D9",
  fontWeight: 500,
};
