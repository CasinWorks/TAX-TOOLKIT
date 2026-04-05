import { useState } from "react";

/**
 * Creative explainer for Invoices & OR: workflow + what OR number means (BIR booklet series).
 */
export default function InvoicePageGuide() {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        borderRadius: 16,
        marginBottom: "1.25rem",
        overflow: "hidden",
        background: "linear-gradient(145deg, #1A3A6E 0%, #0B3D2C 55%, #0d2a22 100%)",
        color: "#F6F4EF",
        boxShadow: "0 16px 48px rgba(26, 58, 110, 0.25)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "16px 20px",
          border: "none",
          background: "rgba(255,255,255,0.06)",
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.02em" }}>
          ★ Field guide & OR number — basahin mo ‘to once
        </span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>{open ? "Tago" : "Buksan"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", fontSize: 13, lineHeight: 1.65, opacity: 0.95 }}>
          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: "rgba(232, 184, 75, 0.15)",
                border: "1px solid rgba(232, 184, 75, 0.35)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#E8B84B", marginBottom: 6 }}>
                STEP 1 — BUSINESS
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#E8E6E0" }}>
                Mag-register muna sa <strong style={{ color: "#fff" }}>My businesses</strong> (isang beses lang per entity). Dito sa tab,
                piliin kung aling business ang mag-i-issue ng invoice/OR.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#9EC9FF", marginBottom: 6 }}>
                STEP 2 — INVOICE
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#E8E6E0" }}>
                Lagyan ang client, line items, at <strong style={{ color: "#fff" }}>PDF — Invoice</strong> para sa billing. “Mark as paid”
                kapag settled na.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#9EC9FF", marginBottom: 6 }}>
                STEP 3 — OFFICIAL RECEIPT
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#E8E6E0" }}>
                Ang <strong style={{ color: "#fff" }}>OR</strong> ay resibo na tumatanggap ka ng bayad. Iba ang layout sa invoice — gamitin
                ang <strong style={{ color: "#fff" }}>PDF — Official Receipt</strong> pag nagbabayad na ang client.
              </p>
            </div>
          </div>

          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 12,
              color: "#E8E6E0",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#E8B84B" }}>VAT</strong> — pag naka-check, VAT-exclusive ang presyo bawat line; +12% VAT sa
            subtotal.{" "}
            <strong style={{ color: "#E8B84B" }}>Duplicate</strong> — gawing bagong draft mula sa saved invoice (bagong invoice no.).{" "}
            <strong style={{ color: "#E8B84B" }}>Print / Save as PDF</strong> — system print dialog (mas malinis na text); PDF buttons =
            image PDF.{" "}
            <strong style={{ color: "#E8B84B" }}>Withholding</strong> — i-check kung corporate magwi-withhold; may button papuntang 2307
            Tracker na may pre-fill.
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: "14px 16px",
              background: "rgba(0,0,0,0.2)",
              border: "1px dashed rgba(232, 184, 75, 0.4)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#E8B84B", marginBottom: 8 }}>
              ANO ANG “OR NO. / BIR SERIES”?
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#D8D4CC" }}>
              Kapag <strong style={{ color: "#fff" }}>nakarehistro</strong> ka sa BIR at may authorized Official Receipt booklet (o
              printed receipts), may <strong style={{ color: "#fff" }}>series</strong> at sunod-sunod na numero ang bawat resibo — hal.{" "}
              <span style={{ fontFamily: "'Fira Code', monospace", color: "#E8B84B" }}>OR 0000012345</span>. Ilagay dito ang numero na
              gagamitin mo sa fisikal na resibo (dapat tumugma sa BIR records). Hindi ito auto-generated ng app —{" "}
              <strong style={{ color: "#fff" }}>ikaw ang nag-uusad ng series</strong> ayon sa booklet mo.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#9B9991" }}>
              Template lang ang PDF dito; i-align pa rin sa authorized receipts at books of accounts mo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
