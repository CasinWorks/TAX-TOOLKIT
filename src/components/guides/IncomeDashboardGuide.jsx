import { useState } from "react";

export default function IncomeDashboardGuide() {
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
          background: "rgba(26, 58, 110, 0.06)",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#1A3A6E",
        }}
      >
        📊 Income dashboard {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#6B6B66", lineHeight: 1.65 }}>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#1A1A18" }}>Gross</strong> = saved invoices with <strong style={{ color: "#1A1A18" }}>issue date</strong> sa napiling quarter.{" "}
            <strong style={{ color: "#1A1A18" }}>2307 withheld</strong> = entries na same quarter + year.{" "}
            <strong style={{ color: "#1A1A18" }}>Est. income tax (quarter)</strong> = mula sa Tax estimator snapshot (same year) kung meron; kung wala, projected mula sa YTD gross × 4 / quarters elapsed.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#9B9991" }}>
            Hindi kasama ang percentage tax (2551Q) as separate line dito — nasa graduated total na sa estimator. Take-home = rough guide lamang; CPA validates.
          </p>
        </div>
      )}
    </div>
  );
}
