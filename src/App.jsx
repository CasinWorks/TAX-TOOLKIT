import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Intro from "./pages/Intro";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Businesses from "./pages/Businesses";

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F6F4EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', sans-serif",
          color: "#9B9991",
        }}
      >
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F6F4EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', sans-serif",
          color: "#9B9991",
        }}
      >
        Loading…
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <Intro />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route path="/intro" element={<Intro />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/businesses"
        element={
          <ProtectedRoute>
            <Businesses />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
