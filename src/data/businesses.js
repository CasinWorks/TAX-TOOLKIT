import { formatTinInput, sanitizePhPhone, sanitizeRdo } from "../utils/phInputs";

const businessesKey = (userId) => `ict_businesses_${userId}`;
const selectedKey = (userId) => `ict_selected_business_${userId}`;
const legacyProfileKey = (userId) => `ict_inv_profile_${userId}`;

export function loadBusinesses(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(businessesKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBusinesses(userId, list) {
  if (!userId) return;
  localStorage.setItem(businessesKey(userId), JSON.stringify(list));
}

export function loadSelectedBusinessId(userId) {
  if (!userId) return null;
  return localStorage.getItem(selectedKey(userId));
}

export function saveSelectedBusinessId(userId, id) {
  if (!userId) return;
  if (id) localStorage.setItem(selectedKey(userId), id);
  else localStorage.removeItem(selectedKey(userId));
}

/** One-time migration from single-profile storage to businesses array. */
export function migrateLegacyBusinessProfile(userId) {
  if (!userId) return;
  const existing = loadBusinesses(userId);
  if (existing.length > 0) return;

  try {
    const raw = localStorage.getItem(legacyProfileKey(userId));
    if (!raw) return;
    const p = JSON.parse(raw);
    const hasData =
      (p.businessName && String(p.businessName).trim()) ||
      (p.tin && String(p.tin).trim()) ||
      (p.address && String(p.address).trim());
    if (!hasData) {
      localStorage.removeItem(legacyProfileKey(userId));
      return;
    }

    const id = crypto.randomUUID();
    const row = {
      id,
      businessName: String(p.businessName || "").trim(),
      tin: formatTinInput(p.tin || ""),
      rdo: sanitizeRdo(p.rdo || ""),
      address: String(p.address || "").trim(),
      phone: sanitizePhPhone(p.phone || ""),
      email: String(p.email || "").trim(),
      createdAt: Date.now(),
    };
    saveBusinesses(userId, [row]);
    saveSelectedBusinessId(userId, id);
    localStorage.removeItem(legacyProfileKey(userId));
  } catch {
    /* ignore */
  }
}

export function emptyBusinessForm() {
  return {
    businessName: "",
    tin: "",
    rdo: "",
    address: "",
    phone: "",
    email: "",
  };
}
