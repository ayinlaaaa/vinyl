import "server-only";
import { headers } from "next/headers";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_KEY = 10;

/** Small process-local guard for auth actions. Deployments with several instances should
 * replace this with a shared store, but this still protects a single instance and preview. */
export function consumeAuthRateLimit(
  key: string,
  now = Date.now(),
  maxAttempts = MAX_ATTEMPTS_PER_KEY,
  windowMs = WINDOW_MS,
): { allowed: boolean; retryAfterSeconds: number } {
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  bucket.count++;
  buckets.set(key, bucket);

  if (bucket.count <= maxAttempts) return { allowed: true, retryAfterSeconds: 0 };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Rate-limit both the client address and the normalized email. */
export async function checkAuthRateLimit(email: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const byAddress = consumeAuthRateLimit(`auth:ip:${address}`);
  const byEmail = consumeAuthRateLimit(`auth:email:${email}`);

  if (!byAddress.allowed) return byAddress;
  if (!byEmail.allowed) return byEmail;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Exposed for deterministic tests and for short-lived development processes. */
export function clearAuthRateLimit(): void {
  buckets.clear();
}
