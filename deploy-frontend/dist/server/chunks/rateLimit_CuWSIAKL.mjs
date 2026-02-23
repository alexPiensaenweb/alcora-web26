const store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1e3);
function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now
    };
  }
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0
  };
}
function rateLimitResponse(retryAfterMs) {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1e3);
  return new Response(
    JSON.stringify({
      error: "Demasiados intentos. Espere un momento antes de reintentar."
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}

export { rateLimitResponse as a, rateLimit as r };
