// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" } // readable logs in dev
      : undefined, // raw JSON in production (for log aggregators)
});

export default logger;
