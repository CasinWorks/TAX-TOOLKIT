import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BusinessesPanel from "../components/BusinessesPanel";
import CpaHandoffPanel from "../components/CpaHandoffPanel";
import ClientsPanel from "../components/ClientsPanel";
import LegalDisclaimer from "../components/LegalDisclaimer";
import TaxEstimator from "../components/TaxEstimator";
import Form2307Tracker from "../components/Form2307Tracker";
import DeadlineCalendar from "../components/DeadlineCalendar";
import IncomeDashboard from "../components/IncomeDashboard";
import InvoiceOrGenerator from "../components/InvoiceOrGenerator";
import SimplifiedBooks from "../components/SimplifiedBooks";
import { theme } from "../theme";

const TAB_IDS = ["estimator", "2307", "businesses", "clients", "invoices", "income", "deadlines", "books", "cpa"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TAB_IDS.includes(tabParam) ? tabParam : "estimator";

  const setTab = (id) => {
    if (id === "estimator") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: id }, { replace: true });
    }
  };

  const S = {
    root: theme.root,
    container: {
      ...theme.container,
      maxWidth:
        tab === "invoices" || tab === "income" || tab === "deadlines" || tab === "books"
          ? 880
          : tab === "businesses" || tab === "clients" || tab === "cpa"
            ? 640
            : theme.container.maxWidth,
    },
    card: theme.card,
    toggleWrap: {
      ...theme.toggleWrap,
      flexWrap: "wrap",
      gap: 4,
      maxWidth: "100%",
    },
  };

  const tabMeta = {
    estimator: {
      title: "BIR Tax Estimator",
      subtitle: "YTD log · 2307 credits · 8% flat vs graduated (OSD)",
    },
    "2307": {
      title: "Form 2307 Tracker",
      subtitle: "Track withholding credits from your clients",
    },
    businesses: {
      title: "My businesses",
      subtitle: "Register TIN, RDO, and contact once — maraming entity, isang account",
    },
    clients: {
      title: "My clients",
      subtitle: "Saved payors for faster invoicing — auto-updates kapag nag-save ng invoice",
    },
    invoices: {
      title: "Invoice & Official Receipt",
      subtitle: "Professional invoices, OR template, PDF export · Paid / unpaid",
    },
    income: {
      title: "Income dashboard",
      subtitle: "Per quarter: gross, 2307, est. tax, take-home · by client & invoice",
    },
    deadlines: {
      title: "BIR deadlines",
      subtitle: "1701Q · 1701 · 2551Q / VAT (optional) · .ics export",
    },
    books: {
      title: "Simplified books",
      subtitle: "Revenue from invoices · expense log · CSV & PDF for your CPA",
    },
    cpa: {
      title: "CPA handoff",
      subtitle: "Legal disclaimer · CPA-ready export pack · validation checklist",
    },
  };
  const meta = tabMeta[tab] || tabMeta.estimator;

  return (
    <div style={S.root}>
      <div style={S.container}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.13em", textTransform: "uppercase", color: "#9B9991" }}>
                  IC Toolkit
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A18" }}>Kumusta, {user?.name?.split(" ")[0] || "boss"} 👋</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#9B9991", maxWidth: 200, textAlign: "right", wordBreak: "break-all" }}>{user?.email}</span>
              <button
                type="button"
                onClick={logout}
                style={{
                  fontSize: 12,
                  color: "#6B6B66",
                  background: "none",
                  border: "1px solid #E5E2D9",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Log out
              </button>
            </div>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 34,
              fontWeight: 600,
              lineHeight: 1.1,
              color: "#0B3D2C",
              margin: "0 0 8px",
            }}
          >
            {meta.title}
          </h1>
          <p style={{ fontSize: 13, color: "#9B9991", margin: "0 0 1rem", lineHeight: 1.55 }}>{meta.subtitle}</p>

          {tab !== "cpa" && <LegalDisclaimer variant="banner" />}

          <div style={S.toggleWrap}>
            {[
              { id: "estimator", label: "Tax estimator" },
              { id: "2307", label: "2307 tracker" },
              { id: "businesses", label: "My businesses" },
              { id: "clients", label: "My clients" },
              { id: "invoices", label: "Invoices & OR" },
              { id: "income", label: "Income" },
              { id: "deadlines", label: "Deadlines" },
              { id: "books", label: "Books" },
              { id: "cpa", label: "CPA pack" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Outfit', sans-serif",
                  background: tab === t.id ? "#0B3D2C" : "transparent",
                  color: tab === t.id ? "#FFFFFF" : "#6B6B66",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid #EDE9E2",
            }}
          >
            <Link
              to="/intro"
              style={{
                fontSize: 12,
                color: "#9B9991",
                textDecoration: "none",
                display: "block",
              }}
            >
              Read intro ulit
            </Link>
          </div>
        </div>

        {tab === "estimator" && <TaxEstimator userId={user?.id} />}
        {tab === "2307" && <Form2307Tracker userId={user?.id} />}
        {tab === "businesses" && <BusinessesPanel userId={user?.id} />}
        {tab === "clients" && <ClientsPanel userId={user?.id} />}
        {tab === "invoices" && <InvoiceOrGenerator userId={user?.id} />}
        {tab === "income" && <IncomeDashboard userId={user?.id} />}
        {tab === "deadlines" && <DeadlineCalendar userId={user?.id} />}
        {tab === "books" && <SimplifiedBooks userId={user?.id} />}
        {tab === "cpa" && <CpaHandoffPanel userId={user?.id} user={user} />}
      </div>
    </div>
  );
}
