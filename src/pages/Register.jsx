import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) navigate("/app", { replace: true });
    else setError(res.error);
  };

  const S = { root: theme.root, container: theme.container, card: theme.card };

  return (
    <div style={S.root}>
      <div style={S.container}>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: "#6B6B66",
            textDecoration: "none",
            marginBottom: "1.5rem",
            display: "inline-block",
          }}
        >
          ← Balik sa intro
        </Link>

        <div style={{ marginBottom: "1.5rem" }}>
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
              fontSize: 32,
              fontWeight: 600,
              color: "#0B3D2C",
              margin: "0 0 8px",
            }}
          >
            Gawa tayo ng account
          </h1>
          <p style={{ fontSize: 14, color: "#9B9991", margin: 0 }}>
            Isang beses lang — tapos naka-save na ang 2307 entries mo sa device na ito.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={S.card}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Pangalan mo</label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1.5px solid #E5E2D9",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              marginBottom: 14,
              background: "#FAFAF8",
            }}
          />

          <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1.5px solid #E5E2D9",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              marginBottom: 14,
              background: "#FAFAF8",
            }}
          />

          <label style={{ display: "block", fontSize: 12, color: "#9B9991", marginBottom: 6 }}>Password (min. 6 characters)</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1.5px solid #E5E2D9",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              marginBottom: 18,
              background: "#FAFAF8",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#6B8A7E" : "#0B3D2C",
              color: "#FFFFFF",
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 16, marginBottom: 0, fontSize: 14, color: "#6B6B66" }}>
            May account na?{" "}
            <Link to="/login" style={{ color: "#0B3D2C", fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </form>

        <p style={{ fontSize: 11, color: "#C5C2BA", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Local demo: data stays in this browser unless you add a backend later.
        </p>
      </div>
    </div>
  );
}
