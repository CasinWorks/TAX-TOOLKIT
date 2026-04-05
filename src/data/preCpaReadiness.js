/** User checklist: items to complete before CPA consult (persisted per user). */

const storageKey = (userId) => `ict_pre_cpa_checklist_${userId}`;

export const PRE_CPA_ITEMS = [
  {
    id: "bir_cor",
    label: "May BIR Certificate of Registration (COR) / Form 2303 (o katumbas) at alam ko ang registered line of business / tax type.",
  },
  {
    id: "businesses_profile",
    label: "My businesses — kumpleto ang TIN, RDO, address, at contact (tugma sa hawak kong docs).",
  },
  {
    id: "regime_choice",
    label: "Naintindihan ko kung 8% flat vs graduated ang pinag-uusapan (at kung VAT-registered ba ako o hindi).",
  },
  {
    id: "income_record",
    label: "May malinaw na income figure: manual input o YTD log sa Tax estimator para sa tax year.",
  },
  {
    id: "invoices_or_docs",
    label: "Invoices / OR sa app (o labas) ay naka-lista; kaya kong i-reconcile sa bank o proof of payment.",
  },
  {
    id: "2307_certs",
    label: "Form 2307: naka-log ang withholding; may hawak akong copy ng certificate kung saan applicable.",
  },
  {
    id: "expenses_decision",
    label: "Alam ko kung OSD (40%) o itemized ang pinag-uusapan sa graduated path — o nagtatanong ako sa CPA.",
  },
  {
    id: "other_income",
    label: "Na-disclose ko sa sarili ko (at sa CPA) ang ibang income sources kung meron (employment, rentals, etc.).",
  },
  {
    id: "deadlines",
    label: "Alam ko (o tinanong ko) ang 1701Q / 1701 / 2551Q deadlines na applicable sa akin.",
  },
  {
    id: "questions_ready",
    label: "May listahan na ako ng tanong para sa CPA (edge cases, mixed clients, foreign payors, etc.).",
  },
  {
    id: "export_pack",
    label: "Na-download ko ang CPA pack (ZIP) o handang i-share ang files sa CPA.",
  },
  {
    id: "no_substitute",
    label: "Naiintindihan kong ang app ay organizer/estimate lang — hindi pinal na BIR filing hangga’t hindi na-review ng CPA.",
  },
];

export function loadPreCpaChecks(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, boolean>} checks */
export function savePreCpaChecks(userId, checks) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(checks));
  } catch {
    /* ignore */
  }
}

export function preCpaCompletion(checks) {
  const total = PRE_CPA_ITEMS.length;
  const done = PRE_CPA_ITEMS.filter((item) => checks[item.id]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
