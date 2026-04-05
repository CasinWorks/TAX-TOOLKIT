import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TaxEstimatorPageGuide from "./guides/TaxEstimatorPageGuide";
import { loadForm2307Entries, sumWithheldByQuarterForYear, totalWithheldForYear } from "../data/form2307";
import { saveTaxSnapshot } from "../data/taxSnapshot";
import { MONTH_LABELS, ytdMetrics } from "../data/incomeYtd";
import { useIncomeYtd } from "../hooks/useIncomeYtd";
import { peso, pesoRaw, pct, theme } from "../theme";

const BRACKETS = [
  { min: 0, max: 250000, base: 0, rate: 0, label: "₱0 – ₱250,000" },
  { min: 250000, max: 400000, base: 0, rate: 0.15, label: "₱250,001 – ₱400,000" },
  { min: 400000, max: 800000, base: 22500, rate: 0.2, label: "₱400,001 – ₱800,000" },
  { min: 800000, max: 2000000, base: 102500, rate: 0.25, label: "₱800,001 – ₱2,000,000" },
  { min: 2000000, max: 8000000, base: 402500, rate: 0.3, label: "₱2,000,001 – ₱8,000,000" },
  { min: 8000000, max: Infinity, base: 2202500, rate: 0.35, label: "Above ₱8,000,000" },
];

function graduatedIncomeTax(net) {
  if (net <= 0) return 0;
  for (const b of BRACKETS) {
    if (net <= b.max) return b.base + (net - b.min) * b.rate;
  }
  return 0;
}

function computeAll(annual) {
  if (!annual || annual <= 0) return null;

  const taxable8 = Math.max(0, annual - 250000);
  const flatTax = taxable8 * 0.08;

  const osd = annual * 0.4;
  const netTaxable = annual * 0.6;
  const gradIncomeTax = graduatedIncomeTax(netTaxable);
  const percentageTax = annual * 0.03;
  const gradTotal = gradIncomeTax + percentageTax;

  const winner = flatTax <= gradTotal ? "flat" : "grad";

  return {
    annual,
    flat: {
      tax: flatTax,
      taxableBase: taxable8,
      quarterly: flatTax / 4,
      monthly: flatTax / 12,
      effective: (flatTax / annual) * 100,
    },
    grad: {
      incomeTax: gradIncomeTax,
      percentageTax,
      tax: gradTotal,
      osd,
      netTaxable,
      quarterly: gradTotal / 4,
      monthly: gradTotal / 12,
      effective: (gradTotal / annual) * 100,
    },
    winner,
    savings: Math.abs(flatTax - gradTotal),
  };
}

function MetaRow({ label, value, mono = false, color = "#6B6B66" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#9B9991" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          fontFamily: mono ? "'Fira Code', monospace" : "'Outfit', sans-serif",
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function BreakRow({ label, value, bold = false, muted = false, green = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
      <span
        style={{
          fontSize: 12,
          color: muted ? "#9B9991" : bold ? "#1A1A18" : "#6B6B66",
          fontWeight: bold ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: "'Fira Code', monospace",
          fontWeight: bold ? 600 : 400,
          color: green ? "#1A5C3E" : bold ? "#1A1A18" : "#6B6B66",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const monthInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 8px",
  fontFamily: "'Fira Code', monospace",
  fontSize: 13,
  border: "1.5px solid #E5E2D9",
  borderRadius: 8,
  background: "#FAFAF8",
  color: "#1A1A18",
};

export default function TaxEstimator({ userId }) {
  const [taxYear, setTaxYear] = useState(() => new Date().getFullYear());
  const [incomeMode, setIncomeMode] = useState("manual");
  const [mode, setMode] = useState("monthly");
  const [rawInput, setRawInput] = useState("");
  const [showBreak, setShowBreak] = useState(false);
  const [entries2307, setEntries2307] = useState([]);

  const { months, setMonth, refresh: refreshYtd } = useIncomeYtd(userId, taxYear);

  const refresh2307 = useCallback(() => {
    setEntries2307(loadForm2307Entries(userId));
  }, [userId]);

  useEffect(() => {
    refresh2307();
  }, [refresh2307]);

  useEffect(() => {
    const onFocus = () => {
      refresh2307();
      refreshYtd();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh2307, refreshYtd]);

  const ytd = useMemo(() => ytdMetrics(months, taxYear), [months, taxYear]);

  const numVal = parseFloat(rawInput.replace(/,/g, "")) || 0;
  const annual =
    incomeMode === "ytd"
      ? ytd.annualized
      : mode === "monthly"
        ? numVal * 12
        : numVal;

  const result = useMemo(() => computeAll(annual), [annual]);

  const withheldByQ = useMemo(
    () => sumWithheldByQuarterForYear(entries2307, taxYear),
    [entries2307, taxYear]
  );
  const totalWithheld = useMemo(
    () => totalWithheldForYear(entries2307, taxYear),
    [entries2307, taxYear]
  );

  const isFlatWinner = result?.winner === "flat";

  const handleInput = (e) => {
    const clean = e.target.value.replace(/[^0-9.]/g, "");
    setRawInput(clean);
  };

  const S = {
    card: theme.card,
    toggleWrap: theme.toggleWrap,
    sectionLabel: theme.sectionLabel,
  };

  const showResults = result && (incomeMode === "manual" ? annual > 0 : ytd.elapsedMonths > 0 && ytd.ytdSum > 0);

  useEffect(() => {
    if (!userId || !result || !showResults) return;
    saveTaxSnapshot(userId, {
      taxYear,
      incomeMode,
      manualMode: incomeMode === "manual" ? mode : null,
      manualInputRaw: incomeMode === "manual" ? rawInput : "",
      annualGross: annual,
      ytdSum: ytd.ytdSum,
      ytdAnnualized: ytd.annualized,
      ytdElapsedMonths: ytd.elapsedMonths,
      flatAnnualTax: result.flat.tax,
      gradAnnualTax: result.grad.tax,
      recommended: result.winner,
      savingsVsOther: result.savings,
      total2307ForYear: totalWithheld,
      withheldByQ,
      netFlatAfter2307: Math.max(0, result.flat.tax - totalWithheld),
      netGradAfter2307: Math.max(0, result.grad.tax - totalWithheld),
      modelNote:
        "Simplified equal quarterly instalments (annual tax ÷ 4). Actual 1701Q may use cumulative taxable income and credits differently—CPA validates.",
    });
  }, [
    userId,
    taxYear,
    incomeMode,
    mode,
    rawInput,
    annual,
    result,
    ytd.ytdSum,
    ytd.annualized,
    ytd.elapsedMonths,
    totalWithheld,
    withheldByQ,
    showResults,
  ]);

  return (
    <div>
      <TaxEstimatorPageGuide />
      <div style={S.card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9B9991",
                marginBottom: 6,
              }}
            >
              Tax year (estimates + 2307 match)
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={String(taxYear)}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (d.length === 0) {
                  setTaxYear(new Date().getFullYear());
                  return;
                }
                setTaxYear(Math.min(2100, Math.max(2000, parseInt(d, 10))));
              }}
              style={{
                width: 88,
                padding: "8px 10px",
                fontFamily: "'Fira Code', monospace",
                fontSize: 16,
                border: "1.5px solid #E5E2D9",
                borderRadius: 10,
                background: "#FAFAF8",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9B9991",
                marginBottom: 6,
              }}
            >
              Income input
            </div>
            <div style={S.toggleWrap}>
              {[
                { id: "manual", label: "Manual" },
                { id: "ytd", label: "YTD log" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIncomeMode(id)}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Outfit', sans-serif",
                    background: incomeMode === id ? "#0B3D2C" : "transparent",
                    color: incomeMode === id ? "#FFFFFF" : "#6B6B66",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {incomeMode === "manual" ? (
          <>
            <div style={S.toggleWrap}>
              {["monthly", "annual"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMode(t)}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: "'Outfit', sans-serif",
                    background: mode === t ? "#0B3D2C" : "transparent",
                    color: mode === t ? "#FFFFFF" : "#6B6B66",
                    transition: "all 0.15s",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#9B9991",
                marginBottom: 8,
                marginTop: 12,
              }}
            >
              {mode === "monthly" ? "Monthly gross income" : "Annual gross income"}
            </div>

            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#0B3D2C",
                }}
              >
                ₱
              </span>
              <input
                type="text"
                value={rawInput}
                onChange={handleInput}
                placeholder="0"
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 34px",
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 26,
                  fontWeight: 500,
                  border: "1.5px solid #E5E2D9",
                  borderRadius: 10,
                  background: "#FAFAF8",
                  color: "#1A1A18",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0B3D2C";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E2D9";
                }}
              />
            </div>

            {annual > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#9B9991", fontFamily: "'Fira Code', monospace" }}>
                  {mode === "monthly" ? `${peso(annual)} annual projection` : `${peso(annual / 12)}/month`}
                </span>
                {annual >= 3000000 && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "#FEF3C7",
                      color: "#92400E",
                      padding: "2px 10px",
                      borderRadius: 20,
                      fontWeight: 500,
                    }}
                  >
                    Above ₱3M — VAT registration required
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#9B9991",
                marginBottom: 8,
              }}
            >
              Monthly gross ({taxYear})
            </div>
            <p style={{ fontSize: 12, color: "#6B6B66", margin: "0 0 10px", lineHeight: 1.55 }}>
              Ilagay ang kita per month. <strong style={{ color: "#1A1A18" }}>YTD</strong> = Jan hanggang ngayong buwan (calendar).{" "}
              <strong style={{ color: "#1A1A18" }}>Projected annual</strong> = YTD ÷ buwan na lumipas × 12 — ginagamit sa tax estimate.
            </p>
            {!userId ? (
              <p style={{ fontSize: 11, color: "#C4830A", margin: "0 0 10px" }}>Mag-login para ma-save ang monthly log sa device mo.</p>
            ) : null}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {MONTH_LABELS.map((label, i) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 4 }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: 12,
                        color: "#0B3D2C",
                      }}
                    >
                      ₱
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={months[i] ? String(months[i]) : ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        setMonth(i, parseFloat(v) || 0);
                      }}
                      placeholder="0"
                      style={{ ...monthInputStyle, paddingLeft: 26 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "baseline",
                padding: "10px 12px",
                background: "#F6F4EF",
                borderRadius: 10,
                marginBottom: 4,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Running YTD</div>
                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 600, color: "#0B3D2C" }}>
                  {peso(ytd.ytdSum)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Projected annual (est.)
                </div>
                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 600, color: "#1A1A18" }}>
                  {peso(ytd.annualized)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#9B9991" }}>
                ({ytd.elapsedMonths} month{ytd.elapsedMonths !== 1 ? "s" : ""} counted for YTD)
              </div>
            </div>
            {ytd.annualized >= 3000000 && (
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    background: "#FEF3C7",
                    color: "#92400E",
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontWeight: 500,
                  }}
                >
                  Above ₱3M projected — VAT registration required
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {showResults && result && (
        <>
          <div
            style={{
              background: "#0B3D2C",
              borderRadius: 14,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#7DB89A",
                  marginBottom: 4,
                }}
              >
                recommended for you
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3 }}>
                {isFlatWinner ? "8% Flat Rate" : "Graduated Rate"} saves you{" "}
                <span style={{ color: "#E8B84B" }}>{peso(result.savings)}</span> per year
              </div>
            </div>
            <div
              style={{
                background: "#E8B84B",
                color: "#0B3D2C",
                fontSize: 10,
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: 20,
                letterSpacing: "0.07em",
                whiteSpace: "nowrap",
              }}
            >
              BEST PICK
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "1.25rem",
                border: isFlatWinner ? "2px solid #0B3D2C" : "1px solid #E5E2D9",
                position: "relative",
              }}
            >
              {isFlatWinner && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#0B3D2C",
                    color: "#E8B84B",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  RECOMMENDED
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#1A5C3E",
                  marginBottom: 10,
                }}
              >
                8% Flat Rate
              </div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 22, fontWeight: 500, color: "#1A1A18", marginBottom: 2 }}>
                ₱{pesoRaw(result.flat.tax)}
              </div>
              <div style={{ fontSize: 11, color: "#9B9991", marginBottom: 14 }}>per year</div>
              <div style={{ borderTop: "1px solid #F0EDE7", paddingTop: 12 }}>
                <MetaRow label="Per quarter" value={peso(result.flat.quarterly)} mono />
                <MetaRow label="Effective rate" value={pct(result.flat.effective)} />
                <MetaRow label="% Tax (2551Q)" value="₱0 — exempt" color="#1A5C3E" />
              </div>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "1.25rem",
                border: !isFlatWinner ? "2px solid #1A3A6E" : "1px solid #E5E2D9",
                position: "relative",
              }}
            >
              {!isFlatWinner && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1A3A6E",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  RECOMMENDED
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#1A3A6E",
                  marginBottom: 10,
                }}
              >
                Graduated Rate
              </div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 22, fontWeight: 500, color: "#1A1A18", marginBottom: 2 }}>
                ₱{pesoRaw(result.grad.tax)}
              </div>
              <div style={{ fontSize: 11, color: "#9B9991", marginBottom: 14 }}>per year (incl. % tax)</div>
              <div style={{ borderTop: "1px solid #F0EDE7", paddingTop: 12 }}>
                <MetaRow label="Per quarter" value={peso(result.grad.quarterly)} mono />
                <MetaRow label="Effective rate" value={pct(result.grad.effective)} />
                <MetaRow label="% Tax (2551Q)" value={peso(result.grad.percentageTax)} color="#C4830A" />
              </div>
            </div>
          </div>

          <div style={{ ...S.card, padding: "1.25rem" }}>
            <div style={S.sectionLabel}>annual tax comparison</div>
            {[
              { label: "8% Flat Rate", tax: result.flat.tax, color: "#1A5C3E" },
              { label: "Graduated Rate", tax: result.grad.tax, color: "#1A3A6E" },
            ].map(({ label, tax, color }) => {
              const maxTax = Math.max(result.flat.tax, result.grad.tax);
              const barPct = maxTax > 0 ? (tax / maxTax) * 100 : 0;
              return (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#6B6B66" }}>{label}</span>
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 500, color }}>{peso(tax)}</span>
                  </div>
                  <div style={{ background: "#F0EDE7", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div
                      style={{
                        background: color,
                        width: `${barPct.toFixed(1)}%`,
                        height: "100%",
                        borderRadius: 6,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div
              style={{
                background: "#F6F4EF",
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 12, color: "#6B6B66" }}>
                Yearly savings with {isFlatWinner ? "8% flat" : "graduated"}
              </span>
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 600, color: "#1A5C3E" }}>
                {peso(result.savings)}
              </span>
            </div>
          </div>

          <div style={{ ...S.card, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={S.sectionLabel}>2307 credits → net tax (estimate)</div>
              {userId ? (
                <Link to="/app?tab=2307" style={{ fontSize: 12, color: "#1A3A6E", whiteSpace: "nowrap" }}>
                  Form 2307 tracker
                </Link>
              ) : null}
            </div>
            <p style={{ fontSize: 12, color: "#6B6B66", margin: "0 0 12px", lineHeight: 1.55 }}>
              Kinukuha ang total na <strong style={{ color: "#1A1A18" }}>tax withheld</strong> mula sa entries mo (same tax year). Per quarter:{" "}
              <strong style={{ color: "#1A1A18" }}>instalment (-) 2307 sa quarter na yun</strong> = net na payable (estimate). Annual: buong tax minus lahat ng 2307 sa taon.
            </p>
            {!userId ? (
              <p style={{ fontSize: 12, color: "#9B9991", margin: 0 }}>Mag-login para ma-sync ang 2307 credits dito.</p>
            ) : totalWithheld <= 0 ? (
              <p style={{ fontSize: 12, color: "#9B9991", margin: "0 0 12px" }}>
                Walang 2307 withholding na naka-log para sa {taxYear}. Magdagdag sa Form 2307 tracker tab.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ background: "#F6F4EF", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total 2307 ({taxYear})</div>
                    <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 600, color: "#C4830A" }}>{peso(totalWithheld)}</div>
                  </div>
                  <div style={{ background: "#EBF5F0", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#9B9991", textTransform: "uppercase", letterSpacing: "0.06em" }}>Net annual (est.)</div>
                    <div style={{ fontSize: 11, color: "#6B6B66", marginBottom: 4 }}>8%: {peso(Math.max(0, result.flat.tax - totalWithheld))}</div>
                    <div style={{ fontSize: 11, color: "#6B6B66" }}>Grad: {peso(Math.max(0, result.grad.tax - totalWithheld))}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ ...S.card, padding: "1.25rem", overflowX: "auto" }}>
            <div style={S.sectionLabel}>quarterly instalments vs 2307 (BIR deadlines)</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "72px 1fr 1fr 1fr 1fr 1fr",
                gap: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#9B9991",
                marginBottom: 8,
                minWidth: 520,
              }}
            >
              <span />
              <span style={{ color: "#1A5C3E" }}>8% due</span>
              <span style={{ color: "#1A3A6E" }}>Grad due</span>
              <span style={{ color: "#C4830A" }}>2307</span>
              <span style={{ color: "#1A5C3E" }}>Net 8%</span>
              <span style={{ color: "#1A3A6E" }}>Net grad</span>
            </div>
            {[
              { q: "Q1", deadline: "May 15", form: "1701Q", key: "Q1" },
              { q: "Q2", deadline: "Aug 15", form: "1701Q", key: "Q2" },
              { q: "Q3", deadline: "Nov 15", form: "1701Q", key: "Q3" },
              { q: "Annual", deadline: "Apr 15", form: "1701", key: null },
            ].map(({ q, deadline, form, key: qk }, i) => {
              const flatQtl = i < 3 ? result.flat.tax / 4 : 0;
              const gradQtl = i < 3 ? result.grad.tax / 4 : 0;
              const isAnnual = i === 3;
              const w = !isAnnual && qk ? withheldByQ[qk] || 0 : totalWithheld;
              const netFlat = isAnnual ? Math.max(0, result.flat.tax - totalWithheld) : Math.max(0, flatQtl - w);
              const netGrad = isAnnual ? Math.max(0, result.grad.tax - totalWithheld) : Math.max(0, gradQtl - w);
              return (
                <div
                  key={q}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr 1fr 1fr 1fr 1fr",
                    gap: 6,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < 3 ? "1px solid #F0EDE7" : "none",
                    minWidth: 520,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>{q}</div>
                    <div style={{ fontSize: 10, color: "#9B9991" }}>{deadline}</div>
                    <div style={{ fontSize: 9, color: "#C5C2BA", fontFamily: "'Fira Code', monospace" }}>{form}</div>
                  </div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 500, color: "#1A1A18", textAlign: "right" }}>
                    {isAnnual ? "—" : peso(flatQtl)}
                  </div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 500, color: "#1A1A18", textAlign: "right" }}>
                    {isAnnual ? "—" : peso(gradQtl)}
                  </div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 500, color: "#C4830A", textAlign: "right" }}>
                    {isAnnual ? peso(totalWithheld) : peso(w)}
                  </div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 600, color: "#1A5C3E", textAlign: "right" }}>
                    {isAnnual ? peso(netFlat) : peso(netFlat)}
                  </div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 600, color: "#1A3A6E", textAlign: "right" }}>
                    {isAnnual ? peso(netGrad) : peso(netGrad)}
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: "#9B9991", marginTop: 10, lineHeight: 1.6 }}>
              <strong style={{ color: "#1A1A18" }}>Q1–Q3:</strong> 2307 column = withholding na naka-tag sa quarter na yun. <strong style={{ color: "#1A1A18" }}>Annual row:</strong> lahat ng 2307 sa {taxYear}. Graduated: may hiwalay na{" "}
              <strong style={{ color: "#C4830A" }}>2551Q (% tax)</strong> (Apr 25 · Jul 25 · Oct 25 · Jan 25); 8% exempt.
            </div>
          </div>

          <div style={{ ...S.card, padding: "1.25rem", background: "#FAFAF8", borderColor: "#E5E2D9" }}>
            <div style={S.sectionLabel}>1701Q modelling (read before CPA)</div>
            <p style={{ fontSize: 12, color: "#6B6B66", margin: "0 0 10px", lineHeight: 1.65 }}>
              Ang table sa itaas ay <strong style={{ color: "#1A1A18" }}>planning estimate</strong>: hinahati ang projected annual tax sa apat na pantay na bahagi para sa Q1–Q3. Sa totoong{" "}
              <strong style={{ color: "#1A1A18" }}>BIR Form 1701Q</strong>, ang income tax instalment ay maaaring batay sa{" "}
              <strong style={{ color: "#1A1A18" }}>kumulatibong taxable income</strong> sa taon at sa rules na applicable — hindi laging “annual ÷ 4.” Ang creditable tax (2307) ay ina-apply ayon sa form at guidance; hindi guaranteed na eksaktong per-quarter ang net dito.
            </p>
            <p style={{ fontSize: 12, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
              <strong style={{ color: "#0B3D2C" }}>Bago mag-CPA:</strong> tumingin sa Tax estimator (auto-save ang snapshot kapag naka-login ka) at kumpletuhin ang{" "}
              <Link to="/app?tab=cpa" style={{ color: "#1A3A6E", fontWeight: 600 }}>
                Pre-CPA checklist
              </Link>{" "}
              sa CPA pack tab — para may dala kang organized inputs at tanong.
            </p>
          </div>

          <div
            style={{
              background: "#FAFAF8",
              border: "1px solid #E5E2D9",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0B3D2C", marginBottom: 6 }}>
              Next step: filing
            </div>
            <p style={{ fontSize: 12, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
              IC Toolkit helps you compute and prepare — final filing is done sa{" "}
              <strong style={{ color: "#1A1A18" }}>BIR eFPS</strong> o sa tools tulad ng{" "}
              <strong style={{ color: "#1A1A18" }}>Taxumo</strong>. Dalhin mo lang ang numbers mo doon.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBreak(!showBreak)}
            style={{
              width: "100%",
              padding: "13px",
              background: "#FFFFFF",
              border: "1px solid #E5E2D9",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              color: "#1A1A18",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {showBreak ? "Hide" : "Show"} full computation breakdown
            <span
              style={{
                display: "inline-block",
                transform: showBreak ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              ↓
            </span>
          </button>

          {showBreak && (
            <div style={{ ...S.card, padding: "1.5rem" }}>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#1A5C3E",
                    marginBottom: 12,
                  }}
                >
                  8% Flat Rate — full computation
                </div>
                <BreakRow label="Gross annual income" value={peso(result.annual)} />
                <BreakRow label="Less: ₱250,000 exclusion" value={`(${peso(250000)})`} muted />
                <div style={{ borderTop: "1px solid #F0EDE7", margin: "8px 0" }} />
                <BreakRow label="Net taxable amount" value={peso(result.flat.taxableBase)} bold />
                <BreakRow label="Tax rate" value="× 8%" muted />
                <BreakRow label="Income tax due" value={peso(result.flat.tax)} bold green />
                <BreakRow label="3% Percentage tax" value="₱0 — exempt" muted />
                <div style={{ borderTop: "1.5px solid #0B3D2C", margin: "8px 0", opacity: 0.15 }} />
                <BreakRow label="Total tax due" value={peso(result.flat.tax)} bold />
              </div>

              <div style={{ borderTop: "1px dashed #E5E2D9", paddingTop: 20, marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#1A3A6E",
                    marginBottom: 12,
                  }}
                >
                  Graduated Rate — OSD (40%) method
                </div>
                <BreakRow label="Gross annual income" value={peso(result.annual)} />
                <BreakRow label="Less: 40% OSD" value={`(${peso(result.grad.osd)})`} muted />
                <div style={{ borderTop: "1px solid #F0EDE7", margin: "8px 0" }} />
                <BreakRow label="Net taxable income" value={peso(result.grad.netTaxable)} bold />
                <BreakRow label="Income tax per brackets" value={peso(result.grad.incomeTax)} />
                <BreakRow label="Add: 3% Percentage tax" value={peso(result.grad.percentageTax)} />
                <div style={{ borderTop: "1.5px solid #1A3A6E", margin: "8px 0", opacity: 0.15 }} />
                <BreakRow label="Total tax due" value={peso(result.grad.tax)} bold />
              </div>

              <div style={{ borderTop: "1px dashed #E5E2D9", paddingTop: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#9B9991",
                    marginBottom: 12,
                  }}
                >
                  2025 BIR graduated tax brackets
                </div>
                {BRACKETS.map((b, i) => {
                  const active =
                    result.grad.netTaxable > b.min && (b.max === Infinity ? true : result.grad.netTaxable <= b.max);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "7px 10px",
                        borderRadius: 8,
                        background: active ? "#EBF0FA" : "transparent",
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 12, color: active ? "#1A3A6E" : "#6B6B66", fontWeight: active ? 500 : 400 }}>
                        {active ? "▶ " : ""}
                        {b.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Fira Code', monospace",
                          fontSize: 12,
                          color: active ? "#1A3A6E" : "#6B6B66",
                          fontWeight: active ? 500 : 400,
                        }}
                      >
                        {b.rate === 0 ? "0%" : `${(b.rate * 100).toFixed(0)}%`}
                        {b.base > 0 ? ` + ₱${b.base.toLocaleString()}` : ""}
                      </span>
                    </div>
                  );
                })}
                {result.grad.netTaxable > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 12px",
                      background: "#EBF0FA",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#1A3A6E",
                      lineHeight: 1.6,
                    }}
                  >
                    Your net taxable income of <strong>{peso(result.grad.netTaxable)}</strong> (after 40% OSD) falls in the highlighted bracket.
                  </div>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", lineHeight: 1.7, marginTop: 8 }}>
            Estimates only · Non-VAT professional income assumed · 40% OSD applied for graduated rate · Consult a CPA for official BIR filing · IC Toolkit beta — 2025
          </p>
        </>
      )}

      {!showResults && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#C5C2BA" }}>
          <div style={{ fontSize: 40, marginBottom: 12, fontFamily: "'Fira Code', monospace", color: "#D8D4CC" }}>₱ —</div>
          <div style={{ fontSize: 14, color: "#9B9991" }}>
            {incomeMode === "ytd"
              ? "Maglagay ng monthly income sa YTD log (may laman ang running YTD) para makita ang estimate."
              : "Enter your income above to see your tax comparison"}
          </div>
        </div>
      )}
    </div>
  );
}
