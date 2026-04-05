/** Simplified expense log for books of accounts (localStorage). */

const key = (userId) => `ict_expenses_${userId}`;

export function loadExpenses(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(userId, list) {
  if (!userId) return;
  localStorage.setItem(key(userId), JSON.stringify(list));
}

export const EXPENSE_CATEGORIES = [
  { id: "office", label: "Office & supplies" },
  { id: "software", label: "Software & subscriptions" },
  { id: "professional", label: "Professional / training" },
  { id: "utilities", label: "Utilities & comms" },
  { id: "other", label: "Other business" },
];

export function emptyExpenseForm() {
  return {
    date: new Date().toISOString().slice(0, 10),
    payee: "",
    description: "",
    amount: "",
    category: "other",
  };
}
