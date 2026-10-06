import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => (attempt <= 2 ? attempt * 100 : null),
});

redis.on("error", (error: Error) => {
  logger.warn("Redis connection failed", {
    errorName: error.name,
  });
});
