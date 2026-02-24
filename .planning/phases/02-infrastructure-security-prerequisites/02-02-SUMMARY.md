---
phase: 02-infrastructure-security-prerequisites
plan: 02
subsystem: infra
tags: [nanostores, resend, email, cart, logging, retry, smoke-test]

# Dependency graph
requires:
  - phase: 01-directus-schema-data-foundation
    provides: "DirectusUser type, cart store with clearCart(), email.ts with Resend integration"
provides:
  - "Cart-clear-on-logout fix using clearCart() from Nano Stores (not raw localStorage)"
  - "Email sendMail with structured JSON logging and 1-retry (30s delay)"
  - "B2B smoke test regression checklist"
  - "Resend plan capacity verification (free plan sufficient for current volume)"
affects: [03-b2c-product-catalog, 04-b2c-checkout-guest-orders]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Structured email logging with [email] prefix and JSON context", "Email retry pattern: 1 retry after 30s, no throw on final failure"]

key-files:
  created:
    - ".planning/phases/02-infrastructure-security-prerequisites/B2B-SMOKE-TEST.md"
  modified:
    - "frontend/src/stores/auth.ts"
    - "frontend/src/lib/email.ts"

key-decisions:
  - "Free Resend plan (100/day, 3,000/month) sufficient for current B2C volume -- no upgrade needed yet"
  - "Email retry uses 30s delay and never throws on final failure to protect order/payment flows"
  - "B2B smoke test is manual checklist only, no automation"

patterns-established:
  - "Email logging: [email] prefix + JSON.stringify({ recipients, subject, error }) for structured log search"
  - "Cart clearing: always use clearCart() from cart store, never raw localStorage.removeItem"

requirements-completed: [NFR-1.5, NFR-3.1, NFR-3.2, NFR-5.1, NFR-5.2]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 2 Plan 2: Cart-clear-on-logout fix, email retry with structured logging, and B2B smoke test checklist

**Logout clears cart via Nano Stores clearCart(), email sendMail retries once with structured JSON logs, B2B regression checklist documented, Resend free plan confirmed sufficient**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T14:07:20Z
- **Completed:** 2026-02-24T14:10:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Cart-clear-on-logout bug fixed: `auth.ts` logout() now calls `clearCart()` from the cart store instead of raw `localStorage.removeItem`, ensuring both the in-memory Nano Store atom and localStorage are cleared in one step
- Email failure logging enhanced: `sendMail()` logs structured JSON on every attempt with `[email]` prefix, retries once after 30s on failure, and never throws on final failure
- B2B smoke test checklist created covering all critical flows: authentication, catalog with prices, cart operations, checkout "Confirmar pedido sin pago", presupuesto, logout with cart clearing, and anonymous price hiding
- Resend free plan verified as sufficient for current B2C traffic volume (100/day, 3,000/month)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix cart-clear-on-logout, enhance email logging/retry, create smoke test checklist** - `b82d580` (feat)
2. **Task 2: Verify Resend plan and confirm B2B smoke test** - checkpoint approved (human-verify, no commit needed)

**Plan metadata:** (see final docs commit below)

## Files Created/Modified
- `frontend/src/stores/auth.ts` - Replaced raw localStorage.removeItem("alcora-cart") with clearCart() import from cart store
- `frontend/src/lib/email.ts` - Extracted _sendViaResend helper, added structured JSON logging with [email] prefix, added 1-retry with 30s delay, swallows final failure
- `.planning/phases/02-infrastructure-security-prerequisites/B2B-SMOKE-TEST.md` - Manual regression checklist for B2B flows (7 sections, results table)

## Decisions Made
- **Resend plan:** Free plan (100 emails/day, 3,000/month) is sufficient for current expected B2C volume. Upgrade to Starter ($20/month) deferred until traffic warrants it.
- **Email retry:** 30s delay between attempts. Only 1 retry to avoid blocking request threads too long. No exception on final failure since email failures must not break order submission or payment flows.
- **Smoke test format:** Manual checklist only (per user decision), no automated tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `PedidoAdminPanel.tsx` (null check on `pedido.user_created`) and `redsys.ts` (type mismatch with `redsys-easy` library types) are unrelated to this plan's changes. Logged as out-of-scope.

## User Setup Required

None - Resend free plan confirmed sufficient. No environment variable changes needed.

## Next Phase Readiness
- Phase 2 is now complete. All infrastructure and security prerequisites are in place.
- Redis-backed rate limiting (02-01) and cart/email/smoke-test hardening (02-02) ready for Phase 3 (B2C catalog) and Phase 4 (B2C checkout).
- B2B smoke test checklist available for regression validation before each B2C merge.

## Self-Check: PASSED

- FOUND: frontend/src/stores/auth.ts
- FOUND: frontend/src/lib/email.ts
- FOUND: B2B-SMOKE-TEST.md
- FOUND: 02-02-SUMMARY.md
- FOUND: commit b82d580

---
*Phase: 02-infrastructure-security-prerequisites*
*Completed: 2026-02-24*
