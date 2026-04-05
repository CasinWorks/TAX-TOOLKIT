import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_USERS = "ict_users";
const STORAGE_SESSION = "ict_session";

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_SESSION);
    if (!raw) {
      setReady(true);
      return;
    }
    try {
      const session = JSON.parse(raw);
      const users = loadUsers();
      const u = users.find((x) => x.id === session.userId);
      if (u) {
        setUser({ id: u.id, name: u.name, email: u.email });
      } else {
        localStorage.removeItem(STORAGE_SESSION);
      }
    } catch {
      localStorage.removeItem(STORAGE_SESSION);
    }
    setReady(true);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const normalized = email.trim().toLowerCase();
    if (!name.trim() || !normalized || password.length < 6) {
      return { ok: false, error: "Please fill all fields. Password must be at least 6 characters." };
    }
    const users = loadUsers();
    if (users.some((u) => u.email === normalized)) {
      return { ok: false, error: "May account na with that email. Try logging in instead." };
    }
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    users.push({ id, name: name.trim(), email: normalized, passwordHash });
    saveUsers(users);
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({ userId: id }));
    setUser({ id, name: name.trim(), email: normalized });
    return { ok: true };
  }, []);

  const login = useCallback(async (email, password) => {
    const normalized = email.trim().toLowerCase();
    const users = loadUsers();
    const u = users.find((x) => x.email === normalized);
    if (!u) {
      return { ok: false, error: "Walang nahanap na account with that email." };
    }
    const h = await hashPassword(password);
    if (h !== u.passwordHash) {
      return { ok: false, error: "Mali ang password. Subukan ulit." };
    }
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({ userId: u.id }));
    setUser({ id: u.id, name: u.name, email: u.email });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_SESSION);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, register, login, logout }),
    [user, ready, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
