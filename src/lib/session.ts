import { createHmac, timingSafeEqual } from "node:crypto";

// Signed session cookie helpers, shared by auth.ts (pages, actions) and proxy.ts.
// Cookie value: "<expiry ms>.<HMAC-SHA256 of expiry>".

export const SESSION_COOKIE = "bathrdv_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set (at least 32 characters).");
  }
  return value;
}

export function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function createSessionValue(expires: number) {
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

/** True when the cookie value has a valid signature and is not expired. */
export function isValidSessionValue(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  return Number(payload) > Date.now();
}
