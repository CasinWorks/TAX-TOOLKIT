/** Last tax estimator snapshot for CPA export (localStorage). */

const key = (userId) => `ict_tax_snapshot_${userId}`;

/**
 * @param {object} data - Serializable fields only
 */
export function saveTaxSnapshot(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(
      key(userId),
      JSON.stringify({
        ...data,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota */
  }
}

export function loadTaxSnapshot(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
