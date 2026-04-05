import { useCallback, useEffect, useMemo, useState } from "react";
import Form2307PageGuide from "./guides/Form2307PageGuide";
import { loadForm2307Entries, saveForm2307Entries } from "../data/form2307";
import { peso, theme } from "../theme";

const invoicesStorageKey = (userId) => `ict_invoices_${userId}`;

function loadInvoicesForPicker(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(invoicesStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Form2307Tracker({ userId }) {
  const [entries, setEntries] = useState([]);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [linkedInvoiceId, setLinkedInvoiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [gross, setGross] = useState("");
  const [withheld, setWithheld] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setEntries(loadForm2307Entries(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSavedInvoices([]);
      return;
    }
    const refreshInvoices = () => setSavedInvoices(loadInvoicesForPicker(userId));
    refreshInvoices();
    window.addEventListener("focus", refreshInvoices);
    return () => window.removeEventListener("focus", refreshInvoices);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = sessionStorage.getItem("ict_2307_prefill");
      if (!raw) return;
      const p = JSON.parse(raw);
      sessionStorage.removeItem("ict_2307_prefill");
      const invs = loadInvoicesForPicker(userId);
      if (p.clientName) setClientName(String(p.clientName));
      if (p.grossAmount != null && Number(p.grossAmount) > 0) setGross(String(p.grossAmount));
      if (p.taxWithheld != null && Number(p.taxWithheld) > 0) setWithheld(String(p.taxWithheld));
      if (p.quarter && ["Q1", "Q2", "Q3", "Q4"].includes(p.quarter)) setQuarter(p.quarter);
      if (p.year) setYear(String(p.year).slice(0, 4));
      if (p.linkedInvoiceId && invs.some((x) => x.id === p.linkedInvoiceId)) {
        setLinkedInvoiceId(p.linkedInvoiceId);
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  const onPickInvoice = (id) => {
    setLinkedInvoiceId(id);
    if (!id) return;
    const inv = savedInvoices.find((x) => x.id === id);
    if (!inv) return;
    if (inv.clientName) setClientName(inv.clientName);
    const t = Number(inv.total) || 0;
    if (t > 0) setGross(String(t));
  };

  const totalWithheld = useMemo(() => entries.reduce((s, e) => s + (Number(e.taxWithheld) || 0), 0), [entries]);

  const addEntry = useCallback(
    (e) => {
      e.preventDefault();
      const g = parseFloat(String(gross).replace(/,/g, "")) || 0;
      const w = parseFloat(String(withheld).replace(/,/g, "")) || 0;
      if (!clientName.trim() || (g <= 0 && w <= 0)) return;

      const linked = linkedInvoiceId ? savedInvoices.find((x) => x.id === linkedInvoiceId) : null;
      const row = {
        id: crypto.randomUUID(),
        clientName: clientName.trim(),
        quarter,
        year: year.trim() || String(new Date().getFullYear()),
        grossAmount: g,
        taxWithheld: w,
        notes: notes.trim(),
        invoiceId: linked?.id ?? null,
        invoiceNumber: linked?.invoiceNumber ?? "",
        createdAt: Date.now(),
      };
      const next = [row, ...entries];
      setEntries(next);
      saveForm2307Entries(userId, next);
      setClientName("");
      setGross("");
      setWithheld("");
      setNotes("");
      setLinkedInvoiceId("");
    },
    [clientName, quarter, year, gross, withheld, notes, entries, userId, linkedInvoiceId, savedInvoices]
  );

  const remove = (id) => {
    const next = entries.filter((x) => x.id !== id);
    setEntries(next);
    saveForm2307Entries(userId, next);
  };

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  return (
    <div>
      <Form2307PageGuide />
      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>what is form 2307?</div>
        <p style={{ fontSize: 13, color: "#6B6B66", margin: "0 0 12px", lineHeight: 1.65 }}>
          Kapag may corporate client ka, minsan magbibigay sila ng <strong style={{ color: "#1A1A18" }}>Certificate of Creditable Tax Withheld (2307)</strong> — yun ang withholding na
          kinuha nila at ire-remit sa BIR. Puwede mong gamitin yan bilang <strong style={{ color: "#0B3D2C" }}>tax credit</strong> pag nag-file ka ng 1701Q o annual ITR.
        </p>
        <p style={{ fontSize: 12, color: "#9B9991", margin: 0, lineHeight: 1.6 }}>
          Ilagay dito ang details para hindi mawala — total mo ang ma-track for the year.
        </p>
      </div>

      <form onSubmit={addEntry} style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>add a 2307 / withholding entry</div>

        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Client / payor</label>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Company name"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1.5px solid #E5E2D9",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            marginBottom: 12,
            background: "#FAFAF8",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Quarter</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                background: "#FAFAF8",
              }}
            >
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="2025"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                background: "#FAFAF8",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>
            Link sa saved invoice (optional)
          </label>
          <select
            value={linkedInvoiceId}
            onChange={(e) => onPickInvoice(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1.5px solid #E5E2D9",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              background: "#FAFAF8",
              cursor: "pointer",
            }}
          >
            <option value="">— Walang link / manual o lumang 2307 —</option>
            {savedInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber || "No #"} · {inv.clientName || "Client"} · {peso(inv.total || 0)}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: "#9B9991", margin: "8px 0 0", lineHeight: 1.5 }}>
            Kapag pumili ka, auto-fill ang client at gross mula sa invoice. Hindi lahat ng 2307 may match dito — maaaring ibang sistema,
            lumang bayad, o wala pang na-save na invoice.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Gross payment (optional)</label>
            <input
              value={gross}
              onChange={(e) => setGross(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                background: "#FAFAF8",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Tax withheld (credit)</label>
            <input
              value={withheld}
              onChange={(e) => setWithheld(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1.5px solid #E5E2D9",
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                background: "#FAFAF8",
              }}
            />
          </div>
        </div>

        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>
          Extra notes (optional)
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 2307 series no., ATC, internal ref"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1.5px solid #E5E2D9",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            marginBottom: 14,
            background: "#FAFAF8",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "none",
            background: "#0B3D2C",
            color: "#FFFFFF",
            fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Save entry
        </button>
      </form>

      <div
        style={{
          background: "#0B3D2C",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7DB89A" }}>
            total withheld (credits tracked)
          </div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 22, fontWeight: 500, color: "#E8B84B" }}>{peso(totalWithheld)}</div>
        </div>
        <div style={{ fontSize: 11, color: "#B8D4C8", maxWidth: 260, lineHeight: 1.5 }}>
          Auto-sync sa <strong style={{ color: "#E8F5EE" }}>Tax estimator</strong> (same tax year): net tax at quarterly table. Final filing pa rin sa 1701Q / eFPS / CPA.
        </div>
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>your entries ({entries.length})</div>
        {entries.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Wala pang entries. Add one above pag may natanggap ka na 2307.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map((row) => (
              <div
                key={row.id}
                style={{
                  border: "1px solid #F0EDE7",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#FAFAF8",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A18" }}>{row.clientName}</div>
                    <div style={{ fontSize: 12, color: "#9B9991" }}>
                      {row.quarter} {row.year}
                      {row.grossAmount > 0 && (
                        <>
                          {" "}
                          · Gross {peso(row.grossAmount)}
                        </>
                      )}
                    </div>
                    {row.invoiceNumber && (
                      <div style={{ fontSize: 11, color: "#1A3A6E", marginTop: 4, fontWeight: 500 }}>
                        Linked: {row.invoiceNumber}
                      </div>
                    )}
                    {row.notes && <div style={{ fontSize: 11, color: "#C5C2BA", marginTop: 4 }}>{row.notes}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 600, color: "#1A5C3E" }}>
                      {peso(row.taxWithheld)}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(row.id)}
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "#C4830A",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
