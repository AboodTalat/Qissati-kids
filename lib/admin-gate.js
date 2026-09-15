/**
 * The dashboard's shared-secret gate.
 *
 * **This is a screen in front of the sign-in form, not the security of the
 * dashboard.** The real credential check is the qissati API's — email and
 * password, a JWT it mints, roles it enforces, accounts it can deactivate —
 * and that API is on a different machine and is reachable directly, so a PIN
 * here cannot protect a single byte of it. What it does buy is that `/admin`
 * stops being a door anyone who guesses the URL can rattle: no login form to
 * fingerprint, no password field for a bot to spray, no dashboard shell
 * served to anyone but the team. That is worth having; it is not a second
 * factor, and it must never be treated as one.
 *
 * `ADMIN_GATE_PIN` is **not** `NEXT_PUBLIC_`, and that is the whole design.
 * A `NEXT_PUBLIC_` value is inlined into the JavaScript bundle in cleartext,
 * so a client-side PIN check would ship the PIN to everyone it was meant to
 * keep out. Everything here runs on the server: `proxy.js` verifies the
 * cookie, `app/api/admin-gate/route.js` verifies the PIN, and the browser
 * only ever holds an httpOnly cookie it cannot read.
 *
 * **The cookie is HMAC-signed with the PIN itself as the key**, so changing
 * the PIN invalidates every cookie ever issued — rotation is revocation, with
 * no session store to keep. The cost is that anyone who sees a cookie value
 * can brute-force a short PIN offline against the signature, which is why
 * `.env.example` asks for a passphrase rather than four digits.
 *
 * Web Crypto rather than `node:crypto` because `proxy.js` runs on the Edge
 * runtime and this module has to work in both.
 */

const ENCODER = new TextEncoder();

/** httpOnly, scoped to `/admin` — nothing outside the dashboard needs it. */
export const GATE_COOKIE = "qissati_admin_gate";

/** Long enough that the team unlocks a device, not every visit. */
export const GATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * The configured PIN, or `null` when there is none.
 *
 * Unset means the gate is off, and it fails open on purpose: the password
 * login behind it is the real gate, so a missing PIN leaves the dashboard
 * exactly as secure as it was before this file existed — whereas failing
 * closed would lock the team out of their own orders over a forgotten
 * environment variable. `.env.example` says so out loud.
 */
export function gatePin() {
  const pin = process.env.ADMIN_GATE_PIN;
  const trimmed = typeof pin === "string" ? pin.trim() : "";
  return trimmed === "" ? null : trimmed;
}

async function hmacHex(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, ENCODER.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compare without leaking where the strings diverged.
 *
 * Both arguments here are always hex digests of the same length, so the early
 * length check gives nothing away.
 */
function equalsConstantTime(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Is this what the owner set?
 *
 * Compares digests rather than the strings themselves: a plain `===` on the
 * PINs returns as soon as a character differs, which times how much of the
 * secret the guess got right.
 */
export async function pinMatches(candidate, pin) {
  if (typeof candidate !== "string" || candidate === "" || !pin) return false;
  const [a, b] = await Promise.all([
    hmacHex(candidate, "qissati-gate-pin"),
    hmacHex(pin, "qissati-gate-pin"),
  ]);
  return equalsConstantTime(a, b);
}

/** `<expiry>.<signature>` — the expiry is signed, so it cannot be extended. */
export async function signGateCookie(pin, expiresAt) {
  const exp = String(expiresAt);
  return `${exp}.${await hmacHex(pin, exp)}`;
}

export async function gateCookieValid(value, pin) {
  if (!value || !pin) return false;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return false;

  const exp = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!/^\d{1,15}$/.test(exp) || Number(exp) <= Date.now()) return false;

  return equalsConstantTime(signature, await hmacHex(pin, exp));
}
