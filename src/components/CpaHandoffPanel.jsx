import { useState } from "react";
import PreCpaReadiness from "./PreCpaReadiness";
import LegalDisclaimer from "./LegalDisclaimer";
import { downloadCpaPackSeparate, downloadCpaPackZip } from "../utils/cpaHandoffExport";
import { theme } from "../theme";

export default function CpaHandoffPanel({ userId, user }) {
  const S = { card: theme.card, sectionLabel: theme.sectionLabel };
  const [busy, setBusy] = useState(false);

  const onZip = async () => {
    setBusy(true);
    try {
      await downloadCpaPackZip(userId, { name: user?.name, email: user?.email });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <LegalDisclaimer variant="card" />

      <PreCpaReadiness userId={userId} />

      <div style={{ ...S.card, padding: "1.25rem", borderColor: "#1A3A6E", background: "linear-gradient(180deg, #F8FAFD 0%, #FFFFFF 100%)" }}>
        <div style={S.sectionLabel}>Organized inputs → CPA-ready pack</div>
        <p style={{ fontSize: 14, color: "#6B6B66", margin: "0 0 12px", lineHeight: 1.65 }}>
          I-export ang data mula sa app: businesses, clients, invoices, Form 2307, income YTD log,{" "}
          <strong style={{ color: "#1A1A18" }}>Pre-CPA checklist</strong>,{" "}
          <strong style={{ color: "#1A1A18" }}>income-by-quarter</strong> (gross / 2307 / est. tax / take-home),{" "}
          <strong style={{ color: "#1A1A18" }}>BIR deadlines</strong> (prefs + list),{" "}
          <strong style={{ color: "#1A1A18" }}>simplified books</strong> (revenue / expense / combined CSV for the calendar year), at{" "}
          <strong style={{ color: "#1A1A18" }}>Tax estimator snapshot</strong>. Kasama sa master .csv; dedicated files sa .zip. Isang{" "}
          <strong style={{ color: "#1A1A18" }}>.zip</strong> para iwas blocked download.
        </p>
        <button
          type="button"
          disabled={busy || !userId}
          onClick={onZip}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            background: busy || !userId ? "#C5C2BA" : "#1A3A6E",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 14,
            cursor: busy || !userId ? "not-allowed" : "pointer",
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 10,
          }}
        >
          {busy ? "Preparing…" : "Download CPA pack (.zip)"}
        </button>
        <button
          type="button"
          disabled={!userId}
          onClick={() => downloadCpaPackSeparate(userId, { name: user?.name, email: user?.email })}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #E5E2D9",
            background: "#FFFFFF",
            color: "#6B6B66",
            fontWeight: 500,
            fontSize: 13,
            cursor: !userId ? "not-allowed" : "pointer",
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 10,
          }}
        >
          Or: separate downloads (summary, master CSV, income-by-quarter, deadlines, 3 books CSVs) — 7 files
        </button>
        <p style={{ fontSize: 11, color: "#9B9991", margin: 0, lineHeight: 1.55 }}>
          Walang snapshot? Buksan muna ang <strong style={{ color: "#6B6B66" }}>Tax estimator</strong> tab at mag-load ng estimate ( dapat naka-login ).
        </p>
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>CPA validation (reminder)</div>
        <ul style={{ margin: 0, paddingLeft: "1.15rem", fontSize: 13, color: "#6B6B66", lineHeight: 1.7 }}>
          <li>Itugma ang TIN / RDO at registered line of business sa BIR.</li>
          <li>Siguraduhin ang tamang option (8% vs graduated; OSD vs itemized) para sa taon.</li>
          <li>I-reconcile ang invoices at 2307 sa aktwal na bank at certificates.</li>
          <li>Kung VAT-registered, hiwalay ang VAT returns — hindi sakop ng simpleng export ang buong VAT workflow.</li>
          <li>I-validate ang 1701Q / credits laban sa official forms — hindi lang sa app model.</li>
        </ul>
      </div>
    </div>
  );
}
