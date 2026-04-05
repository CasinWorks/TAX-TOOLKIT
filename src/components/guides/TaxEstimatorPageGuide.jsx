import { useState } from "react";

export default function TaxEstimatorPageGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        marginBottom: "1rem",
        borderRadius: 14,
        border: "1px solid #E5E2D9",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF8 100%)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 16px",
          border: "none",
          background: "rgba(11, 61, 44, 0.04)",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#0B3D2C",
        }}
      >
        💡 How to use this page {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#6B6B66", lineHeight: 1.65 }}>
          <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>
              <strong style={{ color: "#1A1A18" }}>Manual:</strong> monthly o annual gross. <strong style={{ color: "#1A1A18" }}>YTD log:</strong> monthly amounts → running YTD + projected annual (YTD ÷ months elapsed × 12).
            </li>
            <li>Itugma ang <strong style={{ color: "#1A1A18" }}>tax year</strong> sa 2307 entries mo; ang estimator ay magba-bawas ng withholding credits sa quarterly at annual net (estimate). Kapag naka-login ka, <strong style={{ color: "#1A1A18" }}>auto-save</strong> ang huling snapshot para sa CPA pack.</li>
            <li>
              Tingnan kung alin ang mas mababa: <strong style={{ color: "#0B3D2C" }}>8% flat</strong> (₱250k exempt window) vs{" "}
              <strong style={{ color: "#0B3D2C" }}>graduated + 3% percentage tax</strong> (40% OSD).
            </li>
          </ol>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9B9991" }}>Estimate lang — final numbers sa BIR forms at CPA.</p>
        </div>
      )}
    </div>
  );
}
