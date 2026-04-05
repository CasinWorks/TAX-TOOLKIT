import { theme } from "../theme";

/**
 * @param {"banner" | "card"} variant
 */
export default function LegalDisclaimer({ variant = "banner" }) {
  const text =
    "IC Toolkit provides estimates and personal records only. It is not tax or legal advice and not a substitute for a licensed CPA or official BIR filing. Your CPA should validate all figures before submission.";

  if (variant === "card") {
    return (
      <div
        style={{
          ...theme.card,
          background: "#FAFAF8",
          borderColor: "#E5E2D9",
          padding: "1rem 1.25rem",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9B9991",
            marginBottom: 8,
          }}
        >
          Important
        </div>
        <p style={{ fontSize: 12, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>{text}</p>
      </div>
    );
  }

  return (
    <p
      style={{
        fontSize: 11,
        color: "#9B9991",
        lineHeight: 1.6,
        margin: "0 0 1rem",
        padding: "10px 12px",
        background: "rgba(11, 61, 44, 0.04)",
        borderRadius: 10,
        border: "1px solid #EDE9E2",
      }}
    >
      {text}
    </p>
  );
}
