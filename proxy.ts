import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
// Edge-safe: verifyAccessToken imports ONLY `jose`, nothing Mongoose-dependent — see
// the comment at the top of that file. Never import mobileTokens.ts here instead.
import { verifyAccessToken } from "@/server/lib/mobileJwt";

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimiter = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "@booking-proxy-limiter",
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.warn(
        "Upstash Redis environment variables are missing! Rate limiting skipped.",
      );
      return NextResponse.next();
    }

    // Key by authenticated user id when the request carries a valid mobile bearer
    // token, so many devices sharing one carrier/NAT IP don't collide against a
    // single shared budget — otherwise fall back to IP exactly as before. The limit
    // itself (20 req/10s) is unchanged either way; only the key differs. A malformed,
    // expired, or absent token just falls through to the IP-keyed path — this never
    // rejects a request on token grounds, that's each route's own job.
    let rateLimitKey: string;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const claims = await verifyAccessToken(authHeader.slice("Bearer ".length).trim());
        rateLimitKey = claims ? `user:${claims.sub}` : `ip:${getClientIp(request)}`;
      } catch {
        // MobileAuthConfigError (MOBILE_JWT_SECRET missing) or any other failure —
        // don't let a rate-limiter concern block the request or crash the proxy.
        rateLimitKey = `ip:${getClientIp(request)}`;
      }
    } else {
      rateLimitKey = `ip:${getClientIp(request)}`;
    }

    const { success } = await ratelimiter.limit(rateLimitKey);

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please slow down.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
