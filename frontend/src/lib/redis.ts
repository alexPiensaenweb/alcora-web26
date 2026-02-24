import Redis from "ioredis";

const REDIS_URL =
  process.env.REDIS_URL ||
  (import.meta as any).env?.REDIS_URL ||
  "redis://127.0.0.1:6379";

let instance: Redis | null = null;

/**
 * Returns a singleton ioredis client.
 * Lazily created on first call; reused thereafter.
 */
export function getRedis(): Redis {
  if (instance) return instance;

  instance = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    retryStrategy(times: number) {
      if (times > 5) return null; // stop retrying after 5 attempts
      return Math.min(times * 200, 2000); // 200, 400, 600, 800, 1000 (capped at 2000)
    },
  });

  instance.on("connect", () => {
    console.log(`[redis] Connected to ${REDIS_URL}`);
  });

  instance.on("error", (err: Error) => {
    console.error(`[redis] Connection error: ${err.message}`);
  });

  return instance;
}
