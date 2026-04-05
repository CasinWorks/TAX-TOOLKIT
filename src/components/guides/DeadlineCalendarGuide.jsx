import { useState } from "react";

export default function DeadlineCalendarGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        marginBottom: "1rem",
        borderRadius: 14,
        border: "1px solid #E5E2D9",
        overflow: "hidden",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF8 100%)",
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
          background: "rgba(11, 61, 44, 0.05)",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#0B3D2C",
        }}
      >
        📅 BIR deadline calendar {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#6B6B66", lineHeight: 1.65 }}>
          <p style={{ margin: "0 0 8px" }}>
            Piliin ang <strong style={{ color: "#1A1A18" }}>8% vs graduated</strong> at kung <strong style={{ color: "#1A1A18" }}>VAT-registered</strong> ka — magbabago ang listahan (hal. 2551Q, VAT quarters).
            Ang petsa ay <strong style={{ color: "#1A1A18" }}>typical BIR deadlines</strong> — laging i-verify sa COR, RDO notices, at BIR website.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#9B9991" }}>
            I-download ang <strong style={{ color: "#6B6B66" }}>.ics</strong> para i-import sa Google Calendar / Apple Calendar. Push notifications sa browser — plano pa (PWA).
          </p>
        </div>
      )}
    </div>
  );
}
