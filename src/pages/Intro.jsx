import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

export default function Intro() {
  const { user } = useAuth();
  const S = {
    root: theme.root,
    container: { ...theme.container, maxWidth: 580 },
    card: theme.card,
  };

  return (
    <div style={S.root}>
      <div style={S.container}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "#0B3D2C",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#E8B84B", fontSize: 17, fontFamily: "'Fira Code', monospace", fontWeight: 500 }}>₱</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "#9B9991" }}>
              IC Toolkit
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.12,
              color: "#0B3D2C",
              margin: "0 0 12px",
            }}
          >
            Kumusta! Tara, gawin nating simple ang taxes.
          </h1>
          <p style={{ fontSize: 15, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
            Kung nag-i-start ka ng business, freelance ka, o nagpa-plano pa lang — okay lang na hindi mo pa alam lahat. Dito ka magsisimula: <strong style={{ color: "#1A1A18" }}>alin ang mas okay sa’yo</strong>,{" "}
            <strong style={{ color: "#1A1A18" }}>ano ang sunod na hakbang</strong>, at paano mo ma-track ang pera na hawak ng clients mo (Form 2307).
          </p>
        </div>

        <div style={{ ...S.card, background: "#FAFAF8", borderColor: "#E5E2D9" }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>🌿</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#0B3D2C", margin: "0 0 10px" }}>Ano ba ang “tax” para sa’yo?</h2>
          <p style={{ fontSize: 14, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
            Sa madaling salita: kumita ka bilang propesyonal o negosyo → may bahagi nun na ire-report mo sa BIR. May options — tulad ng <strong style={{ color: "#1A5C3E" }}>8% flat</strong> o{" "}
            <strong style={{ color: "#1A3A6E" }}>graduated rate</strong> — at hindi laging pareho ang pinaka-mura; depende sa income mo. Hindi mo kailangan maging accountant overnight; kailangan mo lang ng{" "}
            <strong style={{ color: "#1A1A18" }}>clear na picture</strong> para hindi ka magulat sa deadline.
          </p>
        </div>

        <div style={S.card}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#0B3D2C", margin: "0 0 12px" }}>Paano ka tutulungan ng app na ito?</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#6B6B66", fontSize: 14, lineHeight: 1.75 }}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>Tax estimator</strong> — ikumpara ang 8% vs graduated (OSD) para makita mo kung alin ang mas swak sa projected income mo.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>Form 2307 tracker</strong> — ilista ang withholding credits mula sa corporate clients para hindi mawala pag nag-file ka na.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>Income dashboard</strong> — per quarter: gross, 2307, est. tax, take-home; by client at by invoice.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>BIR deadlines</strong> — list + .ics export (8% vs graduated, optional VAT); push alerts roadmap.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>Simplified books</strong> — revenue mula sa invoices, expense log, CSV/PDF; kasama rin sa CPA pack zip.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: "#1A1A18" }}>CPA handoff pack</strong> — zip na may master CSV, income-by-quarter, deadlines, books CSV, at tax snapshot para sa CPA mo.
            </li>
            <li>
              <strong style={{ color: "#1A1A18" }}>Next steps</strong> — final filing sa eFPS o Taxumo; IC Toolkit ay prep at handoff lang.
            </li>
          </ul>
        </div>

        <div style={{ ...S.card, borderColor: "#1A3A6E", background: "linear-gradient(125deg, rgba(26,58,110,0.06) 0%, #FFFFFF 100%)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#0B3D2C", margin: "0 0 10px" }}>App + CPA (hindi app lang)</h2>
          <p style={{ fontSize: 14, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
            Ang IC Toolkit ay <strong style={{ color: "#1A1A18" }}>organizer at estimate</strong> — hindi tax advice, hindi substitute sa licensed CPA. Maganda ang plano:{" "}
            <strong style={{ color: "#1A1A18" }}>record dito → CPA mo ang nag-verify → file sa BIR</strong>. Sa app may tab na <strong style={{ color: "#1A3A6E" }}>CPA pack</strong> para sa handoff files at checklist.
          </p>
        </div>

        <div style={{ ...S.card, borderColor: "#E8B84B", background: "linear-gradient(180deg, #FFFBF3 0%, #FFFFFF 100%)" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#0B3D2C", margin: "0 0 10px" }}>Sunod na hakbang (after mo mag-compute)</h2>
          <p style={{ fontSize: 14, color: "#6B6B66", margin: 0, lineHeight: 1.65 }}>
            1) Mag-register sa BIR kung wala ka pang TIN / COR. 2) Pumili ng tax regime na aligned sa estimator. 3) Mag-file ng quarterly at annual returns — dito sa app, ma-prep mo ang numbers; sa{" "}
            <strong style={{ color: "#1A1A18" }}>eFPS o Taxumo</strong> mo isusubmit ang official filing. May tanong pa? Mag-consult sa CPA pag may edge case.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {user ? (
            <>
              <Link
                to="/app"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "#0B3D2C",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Balik sa app
              </Link>
              <Link
                to="/app?tab=cpa"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "1px solid #1A3A6E",
                  background: "#FFFFFF",
                  color: "#1A3A6E",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Buksan ang CPA pack
              </Link>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", fontSize: 13 }}>
                <Link to="/app?tab=income" style={{ color: "#1A3A6E", fontWeight: 500 }}>
                  Income dashboard
                </Link>
                <span style={{ color: "#C5C2BA" }}>·</span>
                <Link to="/app?tab=deadlines" style={{ color: "#1A3A6E", fontWeight: 500 }}>
                  BIR deadlines
                </Link>
                <span style={{ color: "#C5C2BA" }}>·</span>
                <Link to="/app?tab=books" style={{ color: "#1A3A6E", fontWeight: 500 }}>
                  Books
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/register"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "#0B3D2C",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Mag-create ng account — libre mag-start
              </Link>
              <Link
                to="/login"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "1px solid #E5E2D9",
                  background: "#FFFFFF",
                  color: "#1A1A18",
                  fontWeight: 500,
                  fontSize: 15,
                  textDecoration: "none",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                May account na ako — mag-login
              </Link>
            </>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", marginTop: 24, lineHeight: 1.65 }}>
          <strong style={{ color: "#9B9991" }}>Disclaimer:</strong> estimates and records only — not tax or legal advice, not a substitute for a licensed CPA or official BIR filing. Your CPA must validate all figures before submission. · IC Toolkit
        </p>
      </div>
    </div>
  );
}
