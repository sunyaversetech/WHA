import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Stricter than proxy.ts's global 20-req/10s-per-IP limiter — specifically for the
// two unauthenticated mobile endpoints most attractive to abuse (cheap account/guest
// creation, no password guess required): /auth/register and /auth/guest. This is on
// top of, not instead of, the global limiter.
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const authAbuseLimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  analytics: true,
  prefix: "@mobile-auth-limiter",
});

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Returns true if the request should proceed, false if it should be rejected (429).
 * `bucket` keeps register/guest counted separately from each other. Fails open (same
 * as proxy.ts's own global limiter) if Upstash isn't configured, so local dev without
 * Redis credentials doesn't hard-block these routes.
 */
export async function checkAuthAbuseLimit(
  req: Request,
  bucket: "register" | "guest",
): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return true;
  }
  const ip = getClientIp(req);
  const { success } = await authAbuseLimiter.limit(`${bucket}:${ip}`);
  return success;
}
