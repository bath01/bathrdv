import "server-only";
import { headers } from "next/headers";

// In-memory rate limiter (one app instance). Fixed window per key.
// Counters reset when the app restarts, which is acceptable for this use.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/**
 * Counts one hit for `key`. Returns ok=false when more than `limit` hits
 * happened in the last `windowMs`, with the seconds left before retry.
 */
export function hit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count++;
  return { ok: bucket.count <= limit, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
}

/** Clears a key, e.g. after a successful login. */
export function reset(key: string) {
  buckets.delete(key);
}

/**
 * Visitor IP. In production the main Caddy proxy sets X-Forwarded-For to the
 * real client address (it ignores any value sent by the client).
 */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export function minutes(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60));
}
