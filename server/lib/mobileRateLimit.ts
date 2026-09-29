import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Stricter than proxy.ts's global 20-req/10s-per-IP limiter — specifically for the
// two unauthenticated mobile endpoints most attractive to abuse (cheap account/guest
// creation, no password guess required): /auth/register and /auth/guest. This is on
// top of, not instead of, the global limiter.
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  // Without this, Next.js's fetch patching can cache the Upstash REST calls
  // underneath the rate limiter, silently breaking the count — found while
  // testing the new ticket-price limiter (30/min never actually tripped; the
  // pre-existing 10/10min auth limiter happened not to expose it in casual use,
  // but the same risk applies to it too, hence fixing it here for both).
  cache: "no-store",
});

const authAbuseLimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  analytics: true,
  prefix: "@mobile-auth-limiter",
});

// Separate, more generous limiter for event ticket pricing — legitimate checkout
// activity (promo code retries, quantity changes) calls this repeatedly, but each
// call creates a real Stripe PaymentIntent, which has a cost — bound it without
// getting in the way of normal use.
const ticketPriceLimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "@mobile-ticket-price-limiter",
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

/**
 * 30 requests/minute, keyed by user id when authenticated (matches proxy.ts's own
 * principle of keying by identity over IP once known), else by IP for guests.
 */
export async function checkTicketPriceLimit(
  req: Request,
  userId?: string | null,
): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return true;
  }
  const key = userId ? `user:${userId}` : `ip:${getClientIp(req)}`;
  const { success } = await ticketPriceLimiter.limit(key);
  return success;
}
