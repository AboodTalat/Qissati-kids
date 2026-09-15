const WORKER_PATH = "/qissati-sw.js";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function registerQissatiWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.reject(new Error("Service workers are not supported"));
  }
  return navigator.serviceWorker.register(WORKER_PATH, {
    scope: "/",
    updateViaCache: "none",
  });
}

/** Convert a base64url VAPID public key into PushManager's byte form. */
export function applicationServerKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
