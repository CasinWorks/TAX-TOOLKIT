/** Shared IC Toolkit visual tokens (matches original estimator) */
export const theme = {
  root: {
    fontFamily: "'Outfit', sans-serif",
    background: "#F6F4EF",
    minHeight: "100vh",
    padding: "2.25rem 1rem 3rem",
    color: "#1A1A18",
  },
  container: { maxWidth: 560, margin: "0 auto" },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E2D9",
    borderRadius: 16,
    padding: "1.5rem",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color: "#9B9991",
    marginBottom: 12,
  },
  toggleWrap: {
    display: "inline-flex",
    background: "#EDE9E2",
    borderRadius: 9,
    padding: 3,
    marginBottom: "1.25rem",
  },
  brandGreen: "#0B3D2C",
  accentGold: "#E8B84B",
  textMuted: "#9B9991",
  border: "#E5E2D9",
};

export const peso = (n) => `₱${Math.round(n).toLocaleString("en-PH")}`;
export const pesoRaw = (n) => Math.round(n).toLocaleString("en-PH");
export const pct = (n) => `${n.toFixed(2)}%`;
