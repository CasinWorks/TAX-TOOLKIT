import { useCallback, useEffect, useMemo, useState } from "react";
import DeadlineCalendarGuide from "./guides/DeadlineCalendarGuide";
import {
  buildIcsCalendar,
  DEFAULT_DEADLINE_PREFS,
  generateBirDeadlines,
  loadDeadlinePrefs,
  saveDeadlinePrefs,
} from "../data/birDeadlines";
import { theme } from "../theme";

function formatDisplayDate(iso) {
  if (!iso || iso.length < 10) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function DeadlineCalendar({ userId }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [prefs, setPrefs] = useState(DEFAULT_DEADLINE_PREFS);
  const [showPast, setShowPast] = useState(false);
  useEffect(() => {
    if (!userId) return;
    setPrefs(loadDeadlinePrefs(userId));
  }, [userId]);

  const updatePrefs = useCallback(
    (next) => {
      if (!userId) return;
      setPrefs(next);
      saveDeadlinePrefs(userId, next);
    },
    [userId]
  );

  const deadlines = useMemo(() => generateBirDeadlines(year, prefs), [year, prefs]);

  const visible = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (showPast) return deadlines;
    return deadlines.filter((d) => d.date >= today);
  }, [deadlines, showPast]);

  const downloadIcs = () => {
    const ics = buildIcsCalendar(deadlines);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IC-Toolkit-BIR-deadlines-${year}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  if (!userId) {
    return (
      <div style={S.card}>
        <p style={{ fontSize: 14, color: "#9B9991", margin: 0 }}>Mag-login para i-save ang deadline preferences.</p>
      </div>
    );
  }

  return (
    <div>
      <DeadlineCalendarGuide />

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 6 }}>Calendar year</label>
            <input
              type="text"
              inputMode="numeric"
              value={String(year)}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (!n) return;
                setYear(Math.min(2100, Math.max(2000, parseInt(n, 10))));
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
            <label style={{ display: "block", fontSize: 11, color: "#9B9991", marginBottom: 6 }}>Income tax option</label>
            <select
              value={prefs.regime}
              onChange={(e) =>
                updatePrefs({
                  ...prefs,
                  regime: e.target.value === "flat8" ? "flat8" : "graduated",
                })
              }
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontSize: 14,
                background: "#FAFAF8",
                minWidth: 200,
              }}
            >
              <option value="graduated">Graduated + 3% (2551Q typical)</option>
              <option value="flat8">8% flat (no 2551Q in calendar)</option>
            </select>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#1A1A18",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={prefs.vat}
              onChange={(e) => updatePrefs({ ...prefs, vat: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: "#0B3D2C" }}
            />
            VAT-registered (add VAT quarters)
          </label>
        </div>

        {prefs.regime === "flat8" && (
          <p style={{ fontSize: 12, color: "#6B6B66", margin: "0 0 12px", lineHeight: 1.55, padding: "10px 12px", background: "#F6F4EF", borderRadius: 10 }}>
            <strong style={{ color: "#0B3D2C" }}>8% option:</strong> karaniwang <strong>walang 2551Q</strong> sa calendar na ito — i-verify sa COR. May{" "}
            <strong>1701Q / 1701</strong> pa rin kung sakop.
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <button
            type="button"
            onClick={downloadIcs}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: "#0B3D2C",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Download .ics (Google / Apple Calendar)
          </button>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#6B6B66",
              cursor: "pointer",
            }}
          >
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} style={{ accentColor: "#0B3D2C" }} />
            Show past dates
          </label>
        </div>

        <div style={S.sectionLabel}>
          Deadlines ({visible.length}
          {visible.length !== deadlines.length ? ` of ${deadlines.length}` : ""})
        </div>

        {visible.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Walang upcoming deadline sa filter. I-enable ang “Show past dates”.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((d) => {
              const past = d.date < new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={d.id}
                  style={{
                    border: "1px solid #F0EDE7",
                    borderRadius: 12,
                    padding: "12px 14px",
                    background: past ? "#FAFAF8" : "#FFFFFF",
                    opacity: past ? 0.85 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          color: "#1A3A6E",
                          textTransform: "uppercase",
                        }}
                      >
                        {d.form}
                      </span>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1A1A18" }}>{d.title}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 600, color: "#0B3D2C" }}>
                        {formatDisplayDate(d.date)}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B6B66", margin: "6px 0 4px", lineHeight: 1.55 }}>
                    <strong style={{ color: "#1A1A18" }}>Compute:</strong> {d.compute}
                  </p>
                  <p style={{ fontSize: 12, color: "#9B9991", margin: 0, lineHeight: 1.55 }}>
                    <strong style={{ color: "#6B6B66" }}>Bring / prep:</strong> {d.bring}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ ...S.card, padding: "1.25rem", background: "#FAFAF8", borderColor: "#E5E2D9" }}>
        <div style={S.sectionLabel}>Push alerts</div>
        <p style={{ fontSize: 13, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
          <strong style={{ color: "#1A1A18" }}>7 araw / 1 araw na paalala</strong> sa browser — kasama sa roadmap (PWA + notification permission). Sa ngayon: mag-import ng{" "}
          <strong style={{ color: "#1A1A18" }}>.ics</strong> at mag-set ng default reminder sa Google Calendar (e.g. 1 week + 1 day before).
        </p>
      </div>

      <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", lineHeight: 1.6, marginTop: 8 }}>
        Not legal advice — verify dates/forms against your COR, BIR issuances, and CPA.
      </p>
    </div>
  );
}
