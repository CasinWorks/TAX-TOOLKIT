import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import IncomeDashboardGuide from "./guides/IncomeDashboardGuide";
import { buildIncomeDashboard } from "../utils/incomeDashboard";
import { peso, theme } from "../theme";

function defaultYearQuarter() {
  const d = new Date();
  const m = d.getMonth() + 1;
  const quarter = m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4";
  return { year: d.getFullYear(), quarter };
}

export default function IncomeDashboard({ userId }) {
  const [{ year, quarter }, setYq] = useState(defaultYearQuarter);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const d = useMemo(() => {
    if (!userId) return null;
    return buildIncomeDashboard(userId, year, quarter);
  }, [userId, year, quarter, tick]);

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  if (!userId || !d) {
    return (
      <div style={S.card}>
        <p style={{ fontSize: 14, color: "#9B9991", margin: 0 }}>Mag-login para makita ang income dashboard.</p>
      </div>
    );
  }

  return (
    <div>
      <IncomeDashboardGuide />

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 6 }}>Year</label>
            <input
              type="text"
              inputMode="numeric"
              value={String(year)}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (!n) return;
                setYq((q) => ({ ...q, year: Math.min(2100, Math.max(2000, parseInt(n, 10))) }));
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
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 6 }}>Quarter</label>
            <select
              value={quarter}
              onChange={(e) => setYq((q) => ({ ...q, quarter: e.target.value }))}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                background: "#FAFAF8",
                minWidth: 120,
              }}
            >
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Gross (invoices)</div>
            <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 20, fontWeight: 600, color: "#0B3D2C" }}>{peso(d.grossQuarter)}</div>
          </div>
          <div style={{ background: "#FFF8EB", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>2307 withheld</div>
            <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 20, fontWeight: 600, color: "#C4830A" }}>{peso(d.withheldQuarter)}</div>
          </div>
          <div style={{ background: "#EBF0FA", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Est. income tax (Q)</div>
            <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 20, fontWeight: 600, color: "#1A3A6E" }}>{peso(d.estimatedTaxQuarter)}</div>
            <div style={{ fontSize: 10, color: "#9B9991", marginTop: 4 }}>
              {d.taxMode === "snapshot" ? "From estimator snapshot" : "Projected from YTD"}
            </div>
          </div>
          <div
            style={{
              background: d.takeHomeQuarter >= 0 ? "#EBF5F0" : "#FEF2F2",
              borderRadius: 12,
              padding: "12px 14px",
              border: d.takeHomeQuarter < 0 ? "1px solid #FECACA" : "none",
            }}
          >
            <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Take-home (est.)</div>
            <div
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 20,
                fontWeight: 600,
                color: d.takeHomeQuarter >= 0 ? "#1A5C3E" : "#B91C1C",
              }}
            >
              {peso(d.takeHomeQuarter)}
            </div>
            <div style={{ fontSize: 10, color: "#9B9991", marginTop: 4 }}>Gross − 2307 − est. tax</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12,
            color: "#6B6B66",
            marginBottom: 12,
            padding: "10px 12px",
            background: "#FAFAF8",
            borderRadius: 10,
          }}
        >
          <span>
            <strong style={{ color: "#1A1A18" }}>YTD gross</strong> (Jan–{quarter}): {peso(d.ytdGross)}
          </span>
          <span>·</span>
          <span>
            <strong style={{ color: "#1A1A18" }}>Annualized</strong> (rough): {peso(d.annualizedFromYtd)}
          </span>
          {!d.snapshotMatched && (
            <>
              <span>·</span>
              <Link to="/app" style={{ color: "#1A3A6E", fontWeight: 600 }}>
                Open Tax estimator
              </Link>
              <span style={{ fontSize: 11, color: "#9B9991" }}>para mas accurate ang est. tax (same year).</span>
            </>
          )}
        </div>

        <div style={S.sectionLabel}>By client</div>
        {d.byClient.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Walang invoice o 2307 data sa quarter na ito.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0EDE7", textAlign: "left", color: "#9B9991", fontSize: 11 }}>
                  <th style={{ padding: "8px 6px" }}>Client</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Gross</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>2307</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {d.byClient.map((row) => (
                  <tr key={row.key} style={{ borderBottom: "1px solid #F6F4EF" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 500 }}>{row.clientName}</td>
                    <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{peso(row.gross)}</td>
                    <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace", color: "#C4830A" }}>
                      {peso(row.withheld)}
                    </td>
                    <td style={{ padding: "10px 6px", textAlign: "right", color: "#9B9991" }}>{row.invoiceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>By invoice / project lines</div>
        {d.invoicesThisQuarter.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>
            Walang saved invoice sa {quarter} {year}.{" "}
            <Link to="/app?tab=invoices" style={{ color: "#1A3A6E", fontWeight: 600 }}>
              Mag-invoice
            </Link>
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0EDE7", textAlign: "left", color: "#9B9991", fontSize: 11 }}>
                  <th style={{ padding: "8px 6px" }}>Invoice</th>
                  <th style={{ padding: "8px 6px" }}>Client</th>
                  <th style={{ padding: "8px 6px" }}>Project / lines</th>
                  <th style={{ padding: "8px 6px" }}>Date</th>
                  <th style={{ padding: "8px 6px", textAlign: "right" }}>Total</th>
                  <th style={{ padding: "8px 6px" }}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {d.invoicesThisQuarter.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #F6F4EF" }}>
                    <td style={{ padding: "10px 6px", fontFamily: "'Fira Code', monospace", fontSize: 12 }}>{inv.invoiceNumber || "—"}</td>
                    <td style={{ padding: "10px 6px" }}>{inv.clientName}</td>
                    <td style={{ padding: "10px 6px", color: "#6B6B66", maxWidth: 220 }}>{inv.projectLabel}</td>
                    <td style={{ padding: "10px 6px", fontSize: 12, color: "#9B9991" }}>{inv.issueDate}</td>
                    <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{peso(inv.total)}</td>
                    <td style={{ padding: "10px 6px", fontSize: 12 }}>{inv.paid ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", lineHeight: 1.6, marginTop: 8 }}>
        Estimates only — same limits as Tax estimator. Hindi kasama ang buong BIR scenario (VAT, mixed income, etc.) hangga’t hindi sinabi ng CPA.
      </p>
    </div>
  );
}
