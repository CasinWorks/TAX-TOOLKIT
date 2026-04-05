import { useState } from "react";
import { emptyClientForm, normalizeClientNameKey } from "../data/clients";
import { useClients } from "../hooks/useClients";
import { theme } from "../theme";
import { formatTinInput, isTinComplete } from "../utils/phInputs";

function ClientsGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: "1.25rem",
        border: "1px solid #E5E2D9",
        background: "#FFFFFF",
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
          background: "#FAFAF8",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#0B3D2C",
        }}
      >
        Mga kliyente — paano gumagana? {open ? "−" : "+"}
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px", fontSize: 13, color: "#6B6B66", lineHeight: 1.65 }}>
          <p style={{ margin: "0 0 10px" }}>
            I-save ang madalas mong bill-an (pangalan, TIN, address). Sa <strong style={{ color: "#1A1A18" }}>Invoices</strong>, piliin
            sila sa dropdown para hindi na mag-type ulit.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#9B9991" }}>
            <strong style={{ color: "#0B3D2C" }}>Auto-register:</strong> kapag nag-save ka ng invoice at diretso mo lang tinype ang client,
            idadagdag o iu-update din namin ang listahan (same name = iisang record).
          </p>
        </div>
      )}
    </div>
  );
}

export default function ClientsPanel({ userId }) {
  const { clients, persistList, refresh } = useClients(userId);
  const [form, setForm] = useState(emptyClientForm);
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
    setForm(emptyClientForm());
    setEditingId(null);
    setErr("");
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name || "", tin: formatTinInput(c.tin || ""), address: c.address || "" });
    setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) {
      setErr("Client name is required.");
      return;
    }
    if (form.tin && !isTinComplete(form.tin)) {
      setErr("TIN must be 12 digits or leave blank.");
      return;
    }

    const name = form.name.trim();
    const key = normalizeClientNameKey(name);
    const others = clients.filter((c) => (editingId ? c.id !== editingId : true));
    if (others.some((c) => normalizeClientNameKey(c.name) === key)) {
      setErr("May existing client na with the same name (case-insensitive).");
      return;
    }

    const row = {
      id: editingId || crypto.randomUUID(),
      name,
      tin: formatTinInput(form.tin),
      address: form.address.trim(),
      createdAt: editingId ? clients.find((x) => x.id === editingId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    let next;
    if (editingId) {
      next = clients.map((x) => (x.id === editingId ? row : x));
    } else {
      next = [row, ...clients];
    }
    persistList(next);
    refresh();
    resetForm();
  };

  const remove = (id) => {
    if (!confirm("Delete this client?")) return;
    persistList(clients.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
    refresh();
  };

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };

  return (
    <div>
      <ClientsGuide />

      <form onSubmit={submit} style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>{editingId ? "Edit client" : "Add client"}</div>
        {err && (
          <div style={{ fontSize: 13, color: "#B71C1C", marginBottom: 12, padding: "10px 12px", background: "#FFEBEE", borderRadius: 8 }}>
            {err}
          </div>
        )}
        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Client / payor name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Company or person"
          style={{ ...inputStyle, marginBottom: 10 }}
          required
        />
        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>TIN (optional, 12 digits)</label>
        <input
          value={form.tin}
          onChange={(e) => setForm((f) => ({ ...f, tin: formatTinInput(e.target.value) }))}
          placeholder="000-000-000-000"
          inputMode="numeric"
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Address (optional)</label>
        <input
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
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
            {editingId ? "Update" : "Save client"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #E5E2D9", background: "#FFF", fontSize: 13, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>Saved clients ({clients.length})</div>
        {clients.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Wala pa — mag-add sa itaas o mag-save ng invoice na may client name.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clients.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #E5E2D9",
                  background: "#FAFAF8",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#6B6B66", fontFamily: c.tin ? "'Fira Code', monospace" : "inherit" }}>
                    {c.tin ? `TIN ${c.tin}` : "No TIN"}
                    {c.address ? ` · ${c.address}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => startEdit(c)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E2D9", background: "#FFF", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(c.id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#C45C3A", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
