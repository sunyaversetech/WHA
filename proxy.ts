import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success } = await ratelimiter.limit(`ip:${clientIp}`);

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
