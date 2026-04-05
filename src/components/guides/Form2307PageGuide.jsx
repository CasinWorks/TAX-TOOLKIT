import { useState } from "react";

export default function Form2307PageGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        marginBottom: "1rem",
        borderRadius: 14,
        overflow: "hidden",
        background: "linear-gradient(125deg, rgba(26,58,110,0.06) 0%, rgba(232,184,75,0.1) 100%)",
        border: "1px solid rgba(26, 58, 110, 0.15)",
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
          background: "transparent",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "#1A3A6E",
        }}
      >
        📋 Quick guide — 2307 tracker {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#6B6B66", lineHeight: 1.65 }}>
          <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
            <li>
              Kapag may <strong style={{ color: "#1A1A18" }}>corporate client</strong>, humingi ng copy ng 2307 (withholding certificate) pagkatapos bayaran.
            </li>
            <li>
              Ilagay ang <strong style={{ color: "#1A1A18" }}>quarter + year</strong> na naka-print sa form para madaling hanapin.
            </li>
            <li>
              Ang <strong style={{ color: "#0B3D2C" }}>total withheld</strong> dito — reference mo sa 1701Q / annual ITR bilang tax credit.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
