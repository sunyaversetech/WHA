import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Automatically looks for UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  // Allow 10 requests per 10 seconds
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@ratelimit",
});
