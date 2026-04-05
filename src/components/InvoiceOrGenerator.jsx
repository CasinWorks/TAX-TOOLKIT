import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InvoicePageGuide from "./guides/InvoicePageGuide";
import { findClientIdByName, upsertClientFromInvoice } from "../data/clients";
import { useBusinesses } from "../hooks/useBusinesses";
import { useClients } from "../hooks/useClients";
import { peso, theme } from "../theme";
import { formatTinInput, isTinComplete, sanitizeOrSeries } from "../utils/phInputs";
import { amountInWordsPeso } from "../utils/amountInWords";
import { computeInvoiceTotals, lineAmount } from "../utils/invoiceTotals";
import { quarterAndYearFromIso } from "../utils/quarterFromDate";
import "../invoice-print.css";

const invoicesKey = (userId) => `ict_invoices_${userId}`;

const emptyLine = () => ({
  id: crypto.randomUUID(),
  description: "",
  qty: 1,
  unitPrice: 0,
});

const defaultDraft = () => ({
  invoiceNumber: "",
  orNumber: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  clientName: "",
  clientTin: "",
  clientAddress: "",
  lineItems: [emptyLine()],
  notes: "",
  paymentNotes: "",
  paid: false,
  businessId: null,
  businessSnapshot: null,
  vatEnabled: false,
  vatRate: 0.12,
  withholdingExpected: false,
  withheldAmountInput: "",
});

function snapshotFrom(b) {
  if (!b) return null;
  return {
    businessName: b.businessName || "",
    tin: b.tin || "",
    rdo: b.rdo || "",
    address: b.address || "",
    phone: b.phone || "",
    email: b.email || "",
  };
}

function loadInvoices(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(invoicesKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInvoices(userId, list) {
  if (!userId) return;
  localStorage.setItem(invoicesKey(userId), JSON.stringify(list));
}

function nextInvoiceNo(invoices, year) {
  const y = String(year);
  let max = 0;
  const re = new RegExp(`^INV-${y}-(\\d+)$`, "i");
  for (const inv of invoices) {
    const m = String(inv.invoiceNumber || "").match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `INV-${y}-${String(max + 1).padStart(3, "0")}`;
}

const docFont = "'Outfit', sans-serif";
const docTitle = "'Cormorant Garamond', serif";

export default function InvoiceOrGenerator({ userId }) {
  const navigate = useNavigate();
  const { businesses, selected, selectedId, selectBusiness } = useBusinesses(userId);
  const { clients, refresh: refreshClients } = useClients(userId);
  const [invoices, setInvoices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(defaultDraft);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const invoiceRef = useRef(null);
  const orRef = useRef(null);

  useEffect(() => {
    setInvoices(loadInvoices(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onFocus = () => refreshClients();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId, refreshClients]);

  const persistInvoices = useCallback(
    (list) => {
      setInvoices(list);
      saveInvoices(userId, list);
    },
    [userId]
  );

  const startNew = useCallback(() => {
    const y = new Date().getFullYear();
    setEditingId(null);
    const snap = selected ? snapshotFrom(selected) : null;
    setSelectedClientId("");
    setDraft({
      ...defaultDraft(),
      invoiceNumber: nextInvoiceNo(invoices, y),
      businessId: selected?.id ?? null,
      businessSnapshot: snap,
    });
  }, [invoices, selected]);

  useEffect(() => {
    if (!editingId && invoices.length === 0 && userId) {
      const y = new Date().getFullYear();
      setDraft((d) => ({
        ...d,
        invoiceNumber: d.invoiceNumber || nextInvoiceNo([], y),
      }));
    }
  }, [editingId, invoices.length, userId]);

  const loadDraft = (inv) => {
    setEditingId(inv.id);
    if (inv.businessId && businesses.some((b) => b.id === inv.businessId)) {
      selectBusiness(inv.businessId);
    }
    setSelectedClientId(findClientIdByName(userId, inv.clientName || "") || "");
    setDraft({
      invoiceNumber: inv.invoiceNumber || "",
      orNumber: inv.orNumber || "",
      issueDate: inv.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: inv.dueDate || "",
      clientName: inv.clientName || "",
      clientTin: formatTinInput(inv.clientTin || ""),
      clientAddress: inv.clientAddress || "",
      lineItems:
        inv.lineItems?.length > 0
          ? inv.lineItems.map((x) => ({
              ...x,
              id: x.id || crypto.randomUUID(),
            }))
          : [emptyLine()],
      notes: inv.notes || "",
      paymentNotes: inv.paymentNotes || "",
      paid: !!inv.paid,
      businessId: inv.businessId || null,
      businessSnapshot: inv.businessSnapshot || null,
      vatEnabled: !!inv.vatEnabled,
      vatRate: typeof inv.vatRate === "number" ? inv.vatRate : 0.12,
      withholdingExpected: !!inv.withholdingExpected,
      withheldAmountInput:
        inv.withheldAmount != null && Number(inv.withheldAmount) > 0 ? String(inv.withheldAmount) : "",
    });
  };

  const duplicateInvoice = useCallback(
    (inv) => {
      const y = new Date().getFullYear();
      setEditingId(null);
      setSelectedClientId(findClientIdByName(userId, inv.clientName || "") || "");
      const lines = (inv.lineItems || []).map((line) => ({
        ...line,
        id: crypto.randomUUID(),
      }));
      if (inv.businessId && businesses.some((b) => b.id === inv.businessId)) {
        selectBusiness(inv.businessId);
      }
      setDraft({
        ...defaultDraft(),
        invoiceNumber: nextInvoiceNo(invoices, y),
        orNumber: "",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: inv.dueDate || "",
        clientName: inv.clientName || "",
        clientTin: formatTinInput(inv.clientTin || ""),
        clientAddress: inv.clientAddress || "",
        lineItems: lines.length ? lines : [emptyLine()],
        notes: inv.notes || "",
        paymentNotes: inv.paymentNotes || "",
        paid: false,
        vatEnabled: !!inv.vatEnabled,
        vatRate: typeof inv.vatRate === "number" ? inv.vatRate : 0.12,
        businessId: inv.businessId || null,
        businessSnapshot: inv.businessSnapshot || null,
        withholdingExpected: !!inv.withholdingExpected,
        withheldAmountInput:
          inv.withheldAmount != null && Number(inv.withheldAmount) > 0 ? String(inv.withheldAmount) : "",
      });
    },
    [invoices, businesses, selectBusiness, userId]
  );

  const saveDraft = () => {
    const { grandTotal } = computeInvoiceTotals(draft);
    if (!selected) {
      alert("Mag-register muna ng business sa My businesses (link sa itaas).");
      return;
    }
    if (!String(selected.businessName || "").trim()) {
      alert("Kulang ang business name sa My businesses.");
      return;
    }
    if (!isTinComplete(selected.tin)) {
      alert("Ang TIN dapat kumpleto: 12 digits (XXX-XXX-XXX-XXX) sa My businesses.");
      return;
    }
    if (!draft.clientName.trim()) {
      alert("Ilagay ang client name.");
      return;
    }
    if (grandTotal <= 0) {
      alert("Maglagay ng valid line items (amount > 0).");
      return;
    }

    const t = computeInvoiceTotals(draft);
    const w = parseFloat(String(draft.withheldAmountInput).replace(/,/g, "")) || 0;
    const { withheldAmountInput: _omitWithheldStr, ...draftForSave } = draft;
    const row = {
      id: editingId || crypto.randomUUID(),
      ...draftForSave,
      businessId: selected.id,
      businessSnapshot: snapshotFrom(selected),
      subtotal: t.subtotal,
      vatAmount: t.vatAmount,
      vatEnabled: t.vatEnabled,
      vatRate: t.vatEnabled ? t.vatRate : 0,
      total: t.grandTotal,
      withholdingExpected: !!draft.withholdingExpected,
      withheldAmount: w > 0 ? w : 0,
      createdAt: editingId ? invoices.find((x) => x.id === editingId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    let next;
    if (editingId) {
      next = invoices.map((x) => (x.id === editingId ? row : x));
    } else {
      next = [row, ...invoices];
    }
    persistInvoices(next);
    setEditingId(row.id);
    upsertClientFromInvoice(userId, {
      clientName: draft.clientName,
      clientTin: draft.clientTin,
      clientAddress: draft.clientAddress,
    });
    refreshClients();
    setSelectedClientId(findClientIdByName(userId, draft.clientName) || "");
  };

  const removeInvoice = (id) => {
    if (!confirm("Delete this invoice?")) return;
    persistInvoices(invoices.filter((x) => x.id !== id));
    if (editingId === id) startNew();
  };

  const togglePaid = (id) => {
    persistInvoices(
      invoices.map((x) => (x.id === id ? { ...x, paid: !x.paid, updatedAt: Date.now() } : x))
    );
    if (editingId === id) setDraft((d) => ({ ...d, paid: !d.paid }));
  };

  const totals = useMemo(() => computeInvoiceTotals(draft), [draft]);

  const sendTo2307Tracker = () => {
    const t = computeInvoiceTotals(draft);
    const { quarter, year } = quarterAndYearFromIso(draft.issueDate);
    const wh = parseFloat(String(draft.withheldAmountInput).replace(/,/g, "")) || 0;
    try {
      sessionStorage.setItem(
        "ict_2307_prefill",
        JSON.stringify({
          clientName: draft.clientName.trim(),
          grossAmount: t.grandTotal,
          quarter,
          year,
          invoiceNumber: draft.invoiceNumber || "",
          linkedInvoiceId: editingId || "",
          taxWithheld: wh > 0 ? wh : undefined,
        })
      );
    } catch {
      /* ignore */
    }
    navigate("/app?tab=2307");
  };

  const displayBiz = useMemo(() => {
    const s = draft.businessSnapshot;
    if (s && (s.businessName || s.tin)) return s;
    const fromSel = snapshotFrom(selected);
    return fromSel || { businessName: "", tin: "", rdo: "", address: "", phone: "", email: "" };
  }, [draft.businessSnapshot, selected]);

  const exportPdf = async (kind) => {
    const ref = kind === "or" ? orRef : invoiceRef;
    if (!ref.current) return;
    setPdfBusy(true);
    try {
      const { downloadElementAsPdf } = await import("../utils/pdfExport");
      const slug = (draft.invoiceNumber || "invoice").replace(/[^\w.-]+/g, "_");
      const name = kind === "or" ? `OR_${slug}.pdf` : `Invoice_${slug}.pdf`;
      await downloadElementAsPdf(ref.current, name);
    } finally {
      setPdfBusy(false);
    }
  };

  const updateLine = (id, field, value) => {
    setDraft((d) => ({
      ...d,
      lineItems: d.lineItems.map((row) => {
        if (row.id !== id) return row;
        if (field === "description") return { ...row, description: value };
        const n = parseFloat(String(value).replace(/,/g, ""));
        if (field === "qty") return { ...row, qty: Number.isFinite(n) ? n : 0 };
        return { ...row, unitPrice: Number.isFinite(n) ? n : 0 };
      }),
    }));
  };

  const addLine = () => setDraft((d) => ({ ...d, lineItems: [...d.lineItems, emptyLine()] }));
  const removeLine = (id) =>
    setDraft((d) => ({
      ...d,
      lineItems: d.lineItems.length > 1 ? d.lineItems.filter((x) => x.id !== id) : d.lineItems,
    }));

  const S = { card: theme.card, sectionLabel: theme.sectionLabel };
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

  const printDocOuter = {
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
    background: "#FFFFFF",
    padding: "28px 32px",
    boxSizing: "border-box",
    border: "1px solid #E5E2D9",
    borderRadius: 4,
    fontFamily: docFont,
    fontSize: 12,
    color: "#1A1A18",
    lineHeight: 1.45,
  };

  return (
    <div>
      <InvoicePageGuide />

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>issuing business</div>
        {businesses.length === 0 ? (
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(11,61,44,0.08), rgba(232,184,75,0.12))",
              border: "1px dashed #0B3D2C",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: 14, color: "#1A1A18", fontWeight: 600 }}>Walang naka-register na business pa</p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B6B66", lineHeight: 1.55 }}>
              Mag-save ng isa o maraming business — TIN, RDO, contact — isang beses lang. Babalik-balikan mo na lang dito.
            </p>
            <Link
              to="/app?tab=businesses"
              style={{
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: 10,
                background: "#0B3D2C",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Open My businesses →
            </Link>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Piliin ang mag-i-issue ng invoice / OR</label>
            <select
              value={selectedId || ""}
              onChange={(e) => {
                const id = e.target.value;
                const b = businesses.find((x) => x.id === id);
                selectBusiness(id);
                setDraft((d) => ({
                  ...d,
                  businessId: id || null,
                  businessSnapshot: b ? snapshotFrom(b) : null,
                }));
              }}
              style={{
                ...inputStyle,
                marginBottom: 10,
                cursor: "pointer",
              }}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName || "Unnamed"} · TIN {b.tin || "—"}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", fontSize: 12, color: "#6B6B66" }}>
              <span>
                <strong style={{ color: "#1A1A18" }}>{displayBiz.businessName || "—"}</strong>
                {displayBiz.tin && (
                  <span style={{ fontFamily: "'Fira Code', monospace", marginLeft: 8 }}>· TIN {displayBiz.tin}</span>
                )}
              </span>
              <Link
                to="/app?tab=businesses"
                style={{
                  color: "#1A3A6E",
                  fontWeight: 600,
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(26,58,110,0.35)",
                }}
              >
                Edit businesses
              </Link>
            </div>
          </>
        )}
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={S.sectionLabel}>invoice editor</div>
          <button
            type="button"
            onClick={startNew}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #E5E2D9",
              background: "#FFFFFF",
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              color: "#0B3D2C",
            }}
          >
            + New invoice
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Invoice no.</label>
            <input
              value={draft.invoiceNumber}
              onChange={(e) => setDraft((d) => ({ ...d, invoiceNumber: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>OR no. (BIR booklet series)</label>
            <input
              value={draft.orNumber}
              onChange={(e) => setDraft((d) => ({ ...d, orNumber: sanitizeOrSeries(e.target.value) }))}
              placeholder="e.g. 0000012345"
              style={inputStyle}
              autoComplete="off"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Issue date</label>
            <input
              type="date"
              value={draft.issueDate}
              onChange={(e) => setDraft((d) => ({ ...d, issueDate: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Due date</label>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <label style={{ fontSize: 12, color: "#9B9991" }}>Saved client (optional)</label>
          <Link to="/app?tab=clients" style={{ fontSize: 12, color: theme.accent }}>
            Manage clients
          </Link>
        </div>
        <select
          value={selectedClientId}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              setSelectedClientId("");
              return;
            }
            const c = clients.find((x) => x.id === id);
            if (!c) {
              setSelectedClientId("");
              return;
            }
            setSelectedClientId(id);
            setDraft((d) => ({
              ...d,
              clientName: c.name,
              clientTin: formatTinInput(c.tin || ""),
              clientAddress: c.address || "",
            }));
          }}
          style={{ ...inputStyle, marginBottom: 10 }}
        >
          <option value="">— type manually or pick —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Bill to — client name</label>
        <input
          value={draft.clientName}
          onChange={(e) => {
            setSelectedClientId("");
            setDraft((d) => ({ ...d, clientName: e.target.value }));
          }}
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Client TIN (optional, 12 digits)</label>
            <input
              value={draft.clientTin}
              onChange={(e) => {
                setSelectedClientId("");
                setDraft((d) => ({ ...d, clientTin: formatTinInput(e.target.value) }));
              }}
              placeholder="000-000-000-000"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Client address (optional)</label>
            <input
              value={draft.clientAddress}
              onChange={(e) => {
                setSelectedClientId("");
                setDraft((d) => ({ ...d, clientAddress: e.target.value }));
              }}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={S.sectionLabel}>line items</div>
        {draft.lineItems.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 70px 100px 36px",
              gap: 8,
              alignItems: "end",
              marginBottom: 8,
            }}
          >
            <div>
              <input
                value={row.description}
                onChange={(e) => updateLine(row.id, "description", e.target.value)}
                placeholder="Service / description"
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="number"
                min={0}
                step={1}
                value={row.qty || ""}
                onChange={(e) => updateLine(row.id, "qty", e.target.value)}
                placeholder="Qty"
                style={inputStyle}
              />
            </div>
            <div>
              <input
                type="number"
                min={0}
                step="0.01"
                value={row.unitPrice || ""}
                onChange={(e) => updateLine(row.id, "unitPrice", e.target.value)}
                placeholder="Unit ₱"
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => removeLine(row.id)}
              style={{
                height: 40,
                border: "1px solid #E5E2D9",
                borderRadius: 10,
                background: "#FAFAF8",
                cursor: "pointer",
                fontSize: 16,
                color: "#9B9991",
              }}
              aria-label="Remove line"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          style={{
            marginBottom: 14,
            fontSize: 12,
            color: "#0B3D2C",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            fontFamily: "'Outfit', sans-serif",
            padding: 0,
          }}
        >
          + Add line
        </button>

        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#FAFAF8",
            border: "1px solid #E5E2D9",
          }}
        >
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "#1A1A18", lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={draft.vatEnabled}
              onChange={(e) => setDraft((d) => ({ ...d, vatEnabled: e.target.checked }))}
              style={{ marginTop: 4 }}
            />
            <span>
              <strong>VAT-registered (12%)</strong> — presyo per line ay <strong>VAT-exclusive</strong>; magdadagdag ng 12% VAT bago
              ang total (BIR standard rate).
            </span>
          </label>
        </div>

        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Notes (invoice footer)</label>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={2}
          placeholder="Terms, bank details, etc."
          style={{ ...inputStyle, resize: "vertical", minHeight: 56, marginBottom: 10 }}
        />
        <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Payment notes (shown on OR)</label>
        <textarea
          value={draft.paymentNotes}
          onChange={(e) => setDraft((d) => ({ ...d, paymentNotes: e.target.value }))}
          rows={2}
          placeholder="e.g. Professional fee — Invoice ref"
          style={{ ...inputStyle, resize: "vertical", minHeight: 56, marginBottom: 12 }}
        />

        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(26,58,110,0.06), rgba(11,61,44,0.05))",
            border: "1px solid #E5E2D9",
          }}
        >
          <div style={{ ...S.sectionLabel, marginBottom: 10 }}>Withholding / 2307</div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "#1A1A18", lineHeight: 1.5, marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={draft.withholdingExpected}
              onChange={(e) => setDraft((d) => ({ ...d, withholdingExpected: e.target.checked }))}
              style={{ marginTop: 4 }}
            />
            <span>
              <strong>Payor ay magwi-withhold</strong> (creditable tax) — typical sa corporate clients; maghanda ng{" "}
              <strong>Form 2307</strong> pag nagbayad sila.
            </span>
          </label>
          <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>
            Natanggap na withheld (₱) — optional, ilagay pag may 2307 na
          </label>
          <input
            value={draft.withheldAmountInput}
            onChange={(e) => setDraft((d) => ({ ...d, withheldAmountInput: e.target.value.replace(/[^0-9.,]/g, "") }))}
            placeholder="0"
            style={{ ...inputStyle, marginBottom: 10, fontFamily: "'Fira Code', monospace" }}
          />
          <p style={{ fontSize: 11, color: "#9B9991", margin: "0 0 10px", lineHeight: 1.55 }}>
            Lalabas ito sa invoice/OR kung naka-check. Ang final credit ay naka-2307 pa rin — itala sa 2307 Tracker pag natanggap mo na ang
            certificate.
          </p>
          <button
            type="button"
            disabled={!draft.clientName.trim() || totals.grandTotal <= 0}
            onClick={sendTo2307Tracker}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #1A3A6E",
              background: "#FFFFFF",
              color: "#1A3A6E",
              fontSize: 12,
              fontWeight: 600,
              cursor: !draft.clientName.trim() || totals.grandTotal <= 0 ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              opacity: !draft.clientName.trim() || totals.grandTotal <= 0 ? 0.5 : 1,
            }}
          >
            Buksan 2307 Tracker (may pre-fill mula sa invoice na ito)
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: "#1A1A18" }}>
            <input
              type="checkbox"
              checked={draft.paid}
              onChange={(e) => setDraft((d) => ({ ...d, paid: e.target.checked }))}
            />
            Mark as paid
          </label>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0B3D2C" }}>
            {draft.vatEnabled ? (
              <>
                Subtotal {peso(totals.subtotal)} · VAT {peso(totals.vatAmount)} · <strong>Total {peso(totals.grandTotal)}</strong>
              </>
            ) : (
              <>Total: {peso(totals.grandTotal)}</>
            )}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            onClick={saveDraft}
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
            Save invoice
          </button>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => exportPdf("invoice")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #E5E2D9",
              background: "#FFFFFF",
              fontSize: 13,
              cursor: pdfBusy ? "wait" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              color: "#1A1A18",
            }}
          >
            {pdfBusy ? "…" : "PDF — Invoice"}
          </button>
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => exportPdf("or")}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #E5E2D9",
              background: "#FFFFFF",
              fontSize: 13,
              cursor: pdfBusy ? "wait" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              color: "#1A1A18",
            }}
          >
            {pdfBusy ? "…" : "PDF — Official Receipt"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #1A3A6E",
              background: "#FFFFFF",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              color: "#1A3A6E",
              fontWeight: 600,
            }}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>print preview (same as PDF)</div>
        <p style={{ fontSize: 12, color: "#9B9991", margin: "0 0 16px" }}>
          Scroll to review. Gamitin ang <strong>Print / Save as PDF</strong> para sa browser print dialog — o PDF buttons para sa
          raster PDF.
        </p>
        <div className="ic-print-zone" style={{ overflowX: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div ref={invoiceRef} className="ic-print-doc ic-print-doc--invoice" style={printDocOuter}>
          <div style={{ borderBottom: "2px solid #0B3D2C", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: docTitle, fontSize: 26, fontWeight: 600, color: "#0B3D2C", marginBottom: 4 }}>INVOICE</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{displayBiz.businessName || "—"}</div>
            <div style={{ fontSize: 11, color: "#6B6B66", marginTop: 6, lineHeight: 1.5 }}>
              {displayBiz.address && <div>{displayBiz.address}</div>}
              <div>
                {displayBiz.tin && <span>TIN: {displayBiz.tin}</span>}
                {displayBiz.tin && displayBiz.rdo && <span> · </span>}
                {displayBiz.rdo && <span>RDO: {displayBiz.rdo}</span>}
              </div>
              {(displayBiz.phone || displayBiz.email) && (
                <div>
                  {displayBiz.phone}
                  {displayBiz.phone && displayBiz.email ? " · " : ""}
                  {displayBiz.email}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9991", marginBottom: 4 }}>Bill to</div>
              <div style={{ fontWeight: 600 }}>{draft.clientName || "—"}</div>
              {draft.clientAddress && <div style={{ fontSize: 11, color: "#6B6B66" }}>{draft.clientAddress}</div>}
              {draft.clientTin && <div style={{ fontSize: 11 }}>TIN: {draft.clientTin}</div>}
            </div>
            <div style={{ textAlign: "right", fontSize: 12 }}>
              <div>
                <strong>Invoice no.</strong> {draft.invoiceNumber || "—"}
              </div>
              <div>
                <strong>Date</strong> {draft.issueDate || "—"}
              </div>
              {draft.dueDate && (
                <div>
                  <strong>Due</strong> {draft.dueDate}
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: draft.paid ? "#0B3D2C" : "#C45C3A" }}>
                {draft.paid ? "PAID" : "UNPAID"}
              </div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E2D9", textAlign: "left", color: "#9B9991", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "8px 6px" }}>Description</th>
                <th style={{ padding: "8px 6px", width: 56 }}>Qty</th>
                <th style={{ padding: "8px 6px", width: 90 }}>Unit</th>
                <th style={{ padding: "8px 6px", width: 100, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {draft.lineItems.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #F0EDE7" }}>
                  <td style={{ padding: "10px 6px" }}>{row.description || "—"}</td>
                  <td style={{ padding: "10px 6px" }}>{row.qty}</td>
                  <td style={{ padding: "10px 6px" }}>{peso(row.unitPrice)}</td>
                  <td style={{ padding: "10px 6px", textAlign: "right", fontFamily: "'Fira Code', monospace" }}>{peso(lineAmount(row))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 260, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#6B6B66" }}>Subtotal{draft.vatEnabled ? " (VAT-excl.)" : ""}</span>
                <span style={{ fontFamily: "'Fira Code', monospace" }}>{peso(totals.subtotal)}</span>
              </div>
              {draft.vatEnabled && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#6B6B66" }}>VAT {(totals.vatRate * 100).toFixed(0)}%</span>
                  <span style={{ fontFamily: "'Fira Code', monospace" }}>{peso(totals.vatAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "2px solid #0B3D2C", fontWeight: 700, fontSize: 15 }}>
                <span>Total due</span>
                <span style={{ fontFamily: "'Fira Code', monospace", color: "#0B3D2C" }}>{peso(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
          {draft.notes && (
            <div style={{ fontSize: 11, color: "#6B6B66", borderTop: "1px dashed #E5E2D9", paddingTop: 12 }}>
              {draft.notes}
            </div>
          )}
          {draft.withholdingExpected && (
            <div
              style={{
                fontSize: 11,
                color: "#1A3A6E",
                borderTop: "1px dashed #E5E2D9",
                paddingTop: 12,
                marginTop: draft.notes ? 10 : 0,
                lineHeight: 1.55,
              }}
            >
              <strong>Creditable withholding (BIR):</strong>{" "}
              {(() => {
                const w = parseFloat(String(draft.withheldAmountInput).replace(/,/g, "")) || 0;
                return w > 0 ? `Withheld ${peso(w)} (per payor / 2307).` : "Applicable — halaga ayon sa Form 2307 ng payor.";
              })()}
            </div>
          )}
        </div>

        <div ref={orRef} className="ic-print-doc ic-print-doc--or" style={{ ...printDocOuter, marginTop: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: docTitle, fontSize: 22, fontWeight: 600, color: "#0B3D2C", letterSpacing: "0.12em" }}>OFFICIAL RECEIPT</div>
            <div style={{ fontSize: 10, color: "#9B9991", marginTop: 4 }}>
              {draft.vatEnabled ? "VAT 12% · Acknowledgment of payment" : "Non-VAT · Acknowledgment of payment"}
            </div>
          </div>
          <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #E5E2D9" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{displayBiz.businessName || "—"}</div>
            <div style={{ fontSize: 11, color: "#6B6B66", lineHeight: 1.55, marginTop: 6 }}>
              {displayBiz.address && <div>{displayBiz.address}</div>}
              <div>
                {displayBiz.tin && <span>TIN: {displayBiz.tin}</span>}
                {displayBiz.tin && displayBiz.rdo && <span> · </span>}
                {displayBiz.rdo && <span>RDO: {displayBiz.rdo}</span>}
              </div>
              {(displayBiz.phone || displayBiz.email) && (
                <div>
                  {displayBiz.phone}
                  {displayBiz.phone && displayBiz.email ? " · " : ""}
                  {displayBiz.email}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 12 }}>
            <div>
              <span style={{ color: "#9B9991" }}>OR No. </span>
              <strong>{draft.orNumber || "___________"}</strong>
            </div>
            <div>
              <span style={{ color: "#9B9991" }}>Date </span>
              <strong>{draft.issueDate || "—"}</strong>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9991", marginBottom: 4 }}>Received from</div>
            <div style={{ fontWeight: 600, borderBottom: "1px solid #1A1A18", paddingBottom: 4, minHeight: 22 }}>{draft.clientName || "—"}</div>
            {draft.clientTin && <div style={{ fontSize: 11, marginTop: 6 }}>TIN: {draft.clientTin}</div>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9991", marginBottom: 6 }}>The sum of pesos (in words)</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, border: "1px solid #E5E2D9", padding: "10px 12px", borderRadius: 4, background: "#FAFAF8" }}>
              {amountInWordsPeso(totals.grandTotal)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
            <span style={{ fontSize: 11, color: "#9B9991" }}>Amount (figures)</span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 22, fontWeight: 600, color: "#0B3D2C" }}>{peso(totals.grandTotal)}</span>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9991", marginBottom: 4 }}>In full payment of</div>
            <div style={{ fontSize: 12, borderBottom: "1px solid #E5E2D9", paddingBottom: 6, minHeight: 40 }}>
              {draft.paymentNotes || draft.lineItems.map((x) => x.description).filter(Boolean).join("; ") || "—"}
            </div>
          </div>
          {draft.withholdingExpected && (
            <div style={{ fontSize: 11, color: "#1A3A6E", marginBottom: 16, padding: "10px 12px", background: "#F4F7FC", borderRadius: 6 }}>
              <strong>Withholding:</strong>{" "}
              {(() => {
                const w = parseFloat(String(draft.withheldAmountInput).replace(/,/g, "")) || 0;
                return w > 0 ? `Natanggap na withheld ${peso(w)}.` : "Mag-a-apply ang credit sa pamamagitan ng Form 2307 ng payor.";
              })()}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32, gap: 24 }}>
            <div style={{ fontSize: 10, color: "#9B9991", maxWidth: "45%" }}>
              Invoice ref: {draft.invoiceNumber || "—"} · {draft.paid ? "Paid" : "Unpaid"}
            </div>
            <div style={{ textAlign: "center", minWidth: 200 }}>
              <div style={{ borderBottom: "1px solid #1A1A18", marginBottom: 6, height: 36 }} />
              <div style={{ fontSize: 11 }}>Authorized signature over printed name</div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div style={{ ...S.card, padding: "1.25rem" }}>
        <div style={S.sectionLabel}>saved invoices</div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9B9991", margin: 0 }}>Walang naka-save pa. Fill out the form at itaas, then Save invoice.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #E5E2D9",
                  background: editingId === inv.id ? "#EBF0FA" : "#FAFAF8",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.clientName}</div>
                  <div style={{ fontSize: 11, color: "#9B9991", marginBottom: 2 }}>
                    {inv.businessSnapshot?.businessName || "Business"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6B66" }}>
                    {inv.invoiceNumber} · {peso(inv.total)}
                    {inv.vatEnabled && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#1A3A6E" }}>VAT</span>
                    )}
                    {inv.withholdingExpected && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#6B4C9A" }}>WTH</span>
                    )}{" "}
                    <span
                      style={{
                        marginLeft: 6,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: inv.paid ? "#E8F5E9" : "#FFF3E0",
                        color: inv.paid ? "#0B3D2C" : "#C45C3A",
                      }}
                    >
                      {inv.paid ? "PAID" : "UNPAID"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => loadDraft(inv)}
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
                    onClick={() => duplicateInvoice(inv)}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #E5E2D9",
                      background: "#FFFFFF",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      color: "#1A3A6E",
                      fontWeight: 600,
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePaid(inv.id)}
                    style={{
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: inv.paid ? "#FFF3E0" : "#E8F5E9",
                      color: "#1A1A18",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {inv.paid ? "Mark unpaid" : "Mark paid"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInvoice(inv.id)}
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

      <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", lineHeight: 1.65, marginTop: 8 }}>
        OR layout is a printable template — align with your BIR-registered receipts and books. IC Toolkit beta — not legal advice.
      </p>
    </div>
  );
}
