import { getRedis } from "./redis";

/**
 * Redis-backed rate limiter using atomic INCR + EXPIRE.
 * Counters persist across Node process restarts.
 * Fails open on Redis errors (allows request, logs error).
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const redisKey = `rl:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    const redis = getRedis();
    const count = await redis.incr(redisKey);

    // Set expiry only on the first request in the window
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (count > maxRequests) {
      const ttl = await redis.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: ttl > 0 ? ttl * 1000 : windowMs,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      retryAfterMs: 0,
    };
  } catch (err) {
    // Fail open: allow the request if Redis is unavailable
    console.error("[rateLimit] Redis error, failing open:", err);
    return { allowed: true, remaining: maxRequests, retryAfterMs: 0 };
  }
}

export function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: "Demasiados intentos. Espere un momento antes de reintentar.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
