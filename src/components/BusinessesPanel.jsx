import { useState } from "react";
import { emptyBusinessForm } from "../data/businesses";
import { useBusinesses } from "../hooks/useBusinesses";
import { theme } from "../theme";
import { formatTinInput, isTinComplete, sanitizePhPhone, sanitizeRdo } from "../utils/phInputs";

function BusinessesGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: "1.25rem",
        border: "2px solid transparent",
        background: "linear-gradient(#F6F4EF, #F6F4EF) padding-box, linear-gradient(135deg, #0B3D2C, #E8B84B, #1A3A6E) border-box",
        boxShadow: "0 12px 40px rgba(11, 61, 44, 0.08)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "14px 18px",
          border: "none",
          background: "linear-gradient(90deg, rgba(11,61,44,0.06) 0%, rgba(232,184,75,0.12) 100%)",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0B3D2C" }}>
          ✦ How this page works — multiple businesses, one account
        </span>
        <span style={{ fontSize: 12, color: "#9B9991" }}>{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px", fontSize: 13, color: "#6B6B66", lineHeight: 1.65 }}>
          <ol style={{ margin: "0 0 0 1.1rem", padding: 0 }}>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "#1A1A18" }}>Register each business once</strong> — lagay ang legal / trade name, TIN (12 digits),
              RDO, address, at contact. Puwede kang magdagdag ng freelance sole prop at saka isang separate consulting brand.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "#1A1A18" }}>Walang doble-doble</strong> — sa Invoices tab, pili lang kung aling business ang nag
              bill; auto-fill na ang details sa PDF.
            </li>
            <li>
              <strong style={{ color: "#1A1A18" }}>Edit or delete anytime</strong> — changes apply sa bagong invoices; na-save na
              PDFs stay as they were when you exported.
            </li>
          </ol>
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(11, 61, 44, 0.06)",
              fontSize: 12,
              color: "#0B3D2C",
            }}
          >
            <strong>TIN field</strong> auto-formats to <span style={{ fontFamily: "'Fira Code', monospace" }}>XXX-XXX-XXX-XXX</span> (12
            digits lang). RDO = numbers only (max 4). Phone = numbers only (max 11, e.g. 09XXXXXXXXX).
          </div>
        </div>
      )}
    </div>
  );
}

/** Business registry UI — used inside Dashboard (tab) or standalone route redirect. */
export default function BusinessesPanel({ userId }) {
  const { businesses, persistList, refresh, selectedId, selectBusiness } = useBusinesses(userId);
  const [form, setForm] = useState(emptyBusinessForm);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState("");

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1.5px solid #E5E2D9",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    background: "#FAFAF8",
  };

  const resetForm = () => {
    setForm(emptyBusinessForm());
    setEditingId(null);
    setErr("");
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({
      businessName: b.businessName || "",
      tin: formatTinInput(b.tin || ""),
      rdo: sanitizeRdo(b.rdo || ""),
      address: b.address || "",
      phone: sanitizePhPhone(b.phone || ""),
      email: b.email || "",
    });
    setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!form.businessName.trim()) {
      setErr("Business name is required.");
      return;
    }
    if (!isTinComplete(form.tin)) {
      setErr("TIN must be exactly 12 digits (BIR format).");
      return;
    }

    const row = {
      id: editingId || crypto.randomUUID(),
      businessName: form.businessName.trim(),
      tin: formatTinInput(form.tin),
      rdo: sanitizeRdo(form.rdo),
      address: form.address.trim(),
      phone: sanitizePhPhone(form.phone),
      email: form.email.trim(),
      createdAt: editingId ? businesses.find((x) => x.id === editingId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    let next;
    if (editingId) {
      next = businesses.map((x) => (x.id === editingId ? row : x));
    } else {
      next = [row, ...businesses];
    }
    persistList(next);
    if (!editingId) selectBusiness(row.id);
    resetForm();
  };

  const remove = (id) => {
    if (!confirm("Delete this business profile?")) return;
    persistList(businesses.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
    refresh();
  };

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  return (
    <div>
      <BusinessesGuide />

      <form onSubmit={submit} style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>{editingId ? "Edit business" : "Add a business"}</div>
        {err && (
          <div style={{ fontSize: 13, color: "#B71C1C", marginBottom: 12, padding: "10px 12px", background: "#FFEBEE", borderRadius: 8 }}>
            {err}
          </div>
        )}
        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Business / trade name</label>
        <input
          value={form.businessName}
          onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
          placeholder="Registered name"
          style={{ ...inputStyle, marginBottom: 10 }}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>TIN (12 digits)</label>
            <input
              value={form.tin}
              onChange={(e) => setForm((f) => ({ ...f, tin: formatTinInput(e.target.value) }))}
              placeholder="000-000-000-000"
              inputMode="numeric"
              autoComplete="off"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>RDO code (digits, max 4)</label>
            <input
              value={form.rdo}
              onChange={(e) => setForm((f) => ({ ...f, rdo: sanitizeRdo(e.target.value) }))}
              placeholder="043"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>
        </div>

        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Address</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 10 }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Phone (11 digits max)</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhPhone(e.target.value) }))}
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="submit"
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "#0B3D2C",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {editingId ? "Update business" : "Save business"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #E5E2D9",
                background: "#FFFFFF",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>Your businesses ({businesses.length})</div>
        {businesses.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Wala pang naka-save. Mag-add gamit ang form sa itaas.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {businesses.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #E5E2D9",
                  background: selectedId === b.id ? "#EBF0FA" : "#FAFAF8",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#1A1A18" }}>{b.businessName}</div>
                  <div style={{ fontSize: 12, color: "#6B6B66", marginTop: 4, fontFamily: "'Fira Code', monospace" }}>
                    TIN {b.tin || "—"} · RDO {b.rdo || "—"}
                  </div>
                  {selectedId === b.id && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#0B3D2C",
                        background: "rgba(11,61,44,0.1)",
                        padding: "3px 8px",
                        borderRadius: 4,
                      }}
                    >
                      Default for new invoices
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #E5E2D9",
                      background: "#FFFFFF",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#C45C3A",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", lineHeight: 1.65 }}>
        Data stored on this device. Default business = last selected sa Invoices tab.
      </p>
    </div>
  );
}
