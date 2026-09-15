import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  GATE_TTL_MS,
  gatePin,
  pinMatches,
  signGateCookie,
} from "@/lib/admin-gate";

/**
 * Verifies the PIN and hands back the cookie `proxy.js` checks.
 *
 * It lives at `/api/admin-gate`, outside the proxy's `/admin` matcher, so the
 * gate never has to carve an exception out of its own guard.
 *
 * The PIN itself never leaves the server: the browser posts a guess and gets
 * back an httpOnly cookie it cannot read, which is the entire reason
 * `ADMIN_GATE_PIN` is not a `NEXT_PUBLIC_` variable checked in the client.
 */

/**
 * Online brute force is the only attack a short PIN really faces, so it is
 * the one worth spending code on: five wrong guesses buys a fifteen-minute
 * pause for that address.
 *
 * **This map is per instance.** On a serverless host each cold start begins
 * with an empty one, so treat it as a speed bump rather than a lockout — the
 * length of the PIN is what actually decides this, which is why
 * `.env.example` asks for a passphrase.
 */
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0].trim();
  // Whichever header the host in front of us sets. When neither is set every
  // caller shares one bucket, so a stranger guessing wrong can make the team
  // wait fifteen minutes — annoying, and still the right trade against
  // leaving an unlimited guessing endpoint open.
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function throttled(key) {
  const now = Date.now();

  // Sweep on the way past — this map is only ever as big as the addresses
  // that have guessed wrong in the last quarter hour.
  for (const [k, entry] of attempts) {
    if (entry.until <= now) attempts.delete(k);
  }

  const entry = attempts.get(key);
  return Boolean(entry && entry.count >= MAX_ATTEMPTS && entry.until > now);
}

function recordFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  const count = entry && entry.until > now ? entry.count + 1 : 1;
  attempts.set(key, { count, until: now + ATTEMPT_WINDOW_MS });
}

export async function POST(request) {
  const pin = gatePin();
  if (pin === null) {
    // Nothing to unlock: the gate is off, so say so rather than failing in a
    // way that reads as a wrong PIN.
    return NextResponse.json({ ok: true, gate: "off" });
  }

  const key = clientKey(request);
  if (throttled(key)) {
    return NextResponse.json({ ok: false, error: "throttled" }, { status: 429 });
  }

  let candidate = "";
  try {
    const body = await request.json();
    candidate = typeof body?.pin === "string" ? body.pin.trim() : "";
  } catch {
    candidate = "";
  }

  if (!(await pinMatches(candidate, pin))) {
    recordFailure(key);
    return NextResponse.json({ ok: false, error: "wrong-pin" }, { status: 401 });
  }

  attempts.delete(key);

  const expiresAt = Date.now() + GATE_TTL_MS;
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: GATE_COOKIE,
    value: await signGateCookie(pin, expiresAt),
    httpOnly: true,
    sameSite: "lax",
    // Plain HTTP on localhost would otherwise never receive the cookie.
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: Math.floor(GATE_TTL_MS / 1000),
  });
  return response;
}
