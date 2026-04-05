import { formatTinInput } from "../utils/phInputs";

const clientsKey = (userId) => `ict_clients_${userId}`;

export function normalizeClientNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function loadClients(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(clientsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveClients(userId, list) {
  if (!userId) return;
  localStorage.setItem(clientsKey(userId), JSON.stringify(list));
}

export function emptyClientForm() {
  return { name: "", tin: "", address: "" };
}

/**
 * Create or update client from invoice "bill to" fields.
 * Matches by normalized name (case-insensitive, collapse spaces).
 */
export function upsertClientFromInvoice(userId, { clientName, clientTin, clientAddress }) {
  const name = String(clientName || "").trim();
  if (!name) return null;

  const key = normalizeClientNameKey(name);
  const tin = formatTinInput(clientTin || "");
  const address = String(clientAddress || "").trim();

  const list = loadClients(userId);
  const idx = list.findIndex((c) => normalizeClientNameKey(c.name) === key);

  if (idx >= 0) {
    const prev = list[idx];
    list[idx] = {
      ...prev,
      name,
      tin: tin || prev.tin,
      address: address || prev.address,
      updatedAt: Date.now(),
    };
  } else {
    list.unshift({
      id: crypto.randomUUID(),
      name,
      tin,
      address,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  saveClients(userId, list);
  return list;
}

/** Find client id by normalized name, or null */
export function findClientIdByName(userId, clientName) {
  const key = normalizeClientNameKey(clientName);
  if (!key) return null;
  const list = loadClients(userId);
  const c = list.find((x) => normalizeClientNameKey(x.name) === key);
  return c?.id ?? null;
}
