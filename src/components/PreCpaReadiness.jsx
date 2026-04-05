import { useCallback, useEffect, useState } from "react";
import { loadPreCpaChecks, PRE_CPA_ITEMS, preCpaCompletion, savePreCpaChecks } from "../data/preCpaReadiness";
import { theme } from "../theme";

export default function PreCpaReadiness({ userId }) {
  const [checks, setChecks] = useState({});

  useEffect(() => {
    setChecks(loadPreCpaChecks(userId));
  }, [userId]);

  const { done, total, pct } = preCpaCompletion(checks);

  const toggle = useCallback(
    (id) => {
      if (!userId) return;
      setChecks((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        savePreCpaChecks(userId, next);
        return next;
      });
    },
    [userId]
  );

  if (!userId) {
    return (
      <div style={{ ...theme.card, padding: "1.25rem" }}>
        <div style={theme.sectionLabel}>Pre-CPA readiness</div>
        <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Mag-login para ma-save ang checklist.</p>
      </div>
    );
  }

  return (
    <div style={{ ...theme.card, padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={theme.sectionLabel}>Pre-CPA readiness</div>
        <div
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: 13,
            fontWeight: 600,
            color: pct >= 100 ? "#1A5C3E" : "#1A3A6E",
          }}
        >
          {done}/{total} ({pct}%)
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#6B6B66", margin: "0 0 14px", lineHeight: 1.6 }}>
        Sagutan bago mag-consult sa CPA. Naka-save sa device mo (per account). Kasama sa CPA pack export ang status at buong listahan.
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {PRE_CPA_ITEMS.map((item) => (
          <li key={item.id} style={{ marginBottom: 10 }}>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                cursor: "pointer",
                fontSize: 13,
                color: "#1A1A18",
                lineHeight: 1.55,
              }}
            >
              <input
                type="checkbox"
                checked={!!checks[item.id]}
                onChange={() => toggle(item.id)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: "#0B3D2C" }}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
