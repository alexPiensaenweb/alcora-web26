---
phase: 02-infrastructure-security-prerequisites
plan: 01
subsystem: infra
tags: [redis, ioredis, rate-limiting, docker]

# Dependency graph
requires:
  - phase: 01-directus-schema-data-foundation
    provides: "Existing API endpoints with in-memory rate limiting"
provides:
  - "Redis singleton client (getRedis) for any future Redis usage"
  - "Async Redis-backed rate limiter with INCR+EXPIRE and fail-open"
  - "Redis port exposed in docker-compose for frontend access"
affects: [03-b2c-guest-storefront, 04-payment-order-flow, 05-ui-polish-launch]

# Tech tracking
tech-stack:
  added: [ioredis]
  patterns: [redis-singleton, async-rate-limit, fail-open-on-redis-error, atomic-incr-expire]

key-files:
  created:
    - frontend/src/lib/redis.ts
  modified:
    - frontend/src/lib/rateLimit.ts
    - frontend/src/pages/cuenta-api/login.ts
    - frontend/src/pages/cuenta-api/register.ts
    - frontend/src/pages/cuenta-api/profile.ts
    - frontend/src/pages/cart/submit.ts
    - frontend/src/pages/cart/presupuesto.ts
    - frontend/src/pages/pago-api/initiate.ts
    - docker-compose.yml
    - docker-compose.production.yml

key-decisions:
  - "Rate limit windows increased across endpoints to prevent brute force with longer windows"
  - "Payment endpoint locked at 5/15min per user decision (NFR-3.3)"
  - "Fail-open on Redis errors to avoid blocking legitimate requests during transient outages"
  - "Production Redis bound to 127.0.0.1 only to prevent internet exposure"

patterns-established:
  - "Redis singleton: import { getRedis } from '../lib/redis' for any future Redis usage"
  - "Async rate limit: always await rateLimit() -- returns Promise<{allowed, remaining, retryAfterMs}>"
  - "Fail-open pattern: Redis errors allow request through, logged to console.error"

requirements-completed: [NFR-1.1, NFR-3.3]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 2 Plan 1: Redis Rate Limiting Summary

**Redis-backed async rate limiting with ioredis singleton, INCR+EXPIRE counters, fail-open resilience, and 6 endpoints migrated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T13:43:41Z
- **Completed:** 2026-02-24T13:46:22Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Replaced in-memory Map rate limiter with Redis-backed INCR+EXPIRE counters that persist across Node restarts
- All 6 sensitive API endpoints migrated to async rate limiting with tightened windows
- Payment endpoint `/pago-api/initiate` locked to 5 requests per 15 minutes per IP (user decision)
- Fail-open behavior ensures requests pass through during Redis outages

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ioredis, create Redis singleton, and rewrite rateLimit.ts** - `531a198` (feat)
2. **Task 2: Update all 6 call sites to await rateLimit(), adjust limits, configure infra** - `3dc8ac2` (feat)

## Files Created/Modified
- `frontend/src/lib/redis.ts` - ioredis singleton with reconnect strategy and lazy init
- `frontend/src/lib/rateLimit.ts` - Async Redis-backed rate limiter with INCR+EXPIRE and fail-open
- `frontend/src/pages/cuenta-api/login.ts` - await rateLimit, 10 req/15min
- `frontend/src/pages/cuenta-api/register.ts` - await rateLimit, 3 req/15min
- `frontend/src/pages/cuenta-api/profile.ts` - await rateLimit, 10 req/5min
- `frontend/src/pages/cart/submit.ts` - await rateLimit, 5 req/5min
- `frontend/src/pages/cart/presupuesto.ts` - await rateLimit, 3 req/5min (unchanged limits)
- `frontend/src/pages/pago-api/initiate.ts` - await rateLimit, 5 req/15min (user decision)
- `docker-compose.yml` - Redis port 6379 exposed for dev frontend access
- `docker-compose.production.yml` - Redis bound to 127.0.0.1:6379 (security)
- `frontend/.env` - REDIS_URL added (gitignored)
- `frontend/.env.production` - REDIS_URL added (gitignored)

## Decisions Made
- Rate limit windows widened for longer brute-force protection: login 1min->15min, register 5min->15min, profile 1min->5min, submit 1min->5min, pago-init 1min->15min
- Payment endpoint strict at 5/15min per user decision (NFR-3.3)
- Submit endpoint tightened from 10 to 5 requests per window
- .env files not committed (gitignored, contain secrets) -- REDIS_URL documented in commit message

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `.env` and `.env.production` are gitignored (correctly, they contain API keys). REDIS_URL was added to both files on disk but cannot be committed. This is expected behavior -- documented in Task 2 commit message.

## User Setup Required

None - REDIS_URL is already set in local .env files. Redis is available via docker-compose.

## Next Phase Readiness
- Redis singleton available for any future feature needing Redis (sessions, caching, pub/sub)
- All rate limiting is now persistent across Node restarts
- Ready for Phase 2 Plan 2 (remaining infrastructure/security work)

## Self-Check: PASSED

All 10 source files verified present. Both commits (531a198, 3dc8ac2) verified in git log. Summary file exists.

---
*Phase: 02-infrastructure-security-prerequisites*
*Completed: 2026-02-24*
