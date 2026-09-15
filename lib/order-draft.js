import { EMPTY_ORDER } from "./order";

/**
 * The parent's unfinished order, kept on this browser only.
 *
 * The version belongs in the key so a future incompatible form shape starts
 * cleanly instead of trying to interpret old answers. Only keys that still
 * exist in `EMPTY_ORDER` are restored; removed fields never leak back into a
 * submitted order, and malformed/non-string values are ignored.
 *
 * Photos are deliberately absent. A File cannot be restored from JSON, blob
 * URLs die with the document, and photographs of a child do not belong in
 * localStorage. The picker tells the parent to choose them again after reload.
 */
const STORAGE_KEY = "qissati.order.draft.v1";

function serialisableValues(values) {
  return Object.fromEntries(
    Object.keys(EMPTY_ORDER).map((key) => [
      key,
      typeof values?.[key] === "string" ? values[key] : EMPTY_ORDER[key],
    ])
  );
}

export function loadOrderDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return serialisableValues(parsed);
  } catch {
    // Storage can be blocked in private/restricted contexts, and a user may
    // have an old or manually edited value. Neither should stop the form.
    return null;
  }
}

export function saveOrderDraft(values) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisableValues(values)));
  } catch {
    // The live form remains usable even when storage is unavailable or full.
  }
}

export function clearOrderDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* See saveOrderDraft: storage failure must never block the order flow. */
  }
}
