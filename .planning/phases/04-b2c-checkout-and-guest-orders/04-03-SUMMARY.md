---
phase: 04-b2c-checkout-and-guest-orders
plan: 03
subsystem: payments
tags: [redsys, guest-checkout, email, b2c, webhook]

# Dependency graph
requires:
  - phase: 04-02
    provides: "Guest checkout form, guest-submit endpoint, guest pedido fields in Directus"
provides:
  - "Guest-compatible payment initiation with token-based ownership verification"
  - "Guest-compatible webhook with guest_email notification and buildGuestPedidoHtml template"
  - "Payment result pages (ok/ko) supporting both auth and guest users"
affects: [04-04-guest-order-status-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Guest token-based ownership verification for payment endpoints", "Dual-path email templates (B2B sin IVA vs B2C IVA incluido)"]

key-files:
  created: []
  modified:
    - frontend/src/pages/pago-api/initiate.ts
    - frontend/src/pages/pago-api/webhook.ts
    - frontend/src/lib/email.ts
    - frontend/src/pages/pago/ok.astro
    - frontend/src/pages/pago/ko.astro

key-decisions:
  - "Guest payment initiation uses guest_token body param instead of auth session for ownership"
  - "Guest Redsys return URLs use /pedido/[token]?status=ok|ko (non-guessable, NFR-1.4)"
  - "Webhook branches on tipo_cliente=invitado: guest uses pedido guest_* fields, auth fetches /users/{id}"
  - "Admin email always uses buildPedidoHtml; guest client email uses buildGuestPedidoHtml with IVA-inclusive pricing"
  - "pago/ok and pago/ko no longer redirect unauthenticated users to login"

patterns-established:
  - "Guest ownership pattern: verify guest_token from request body against pedido.guest_token"
  - "Email branching: tipo_cliente check determines which email template and data source to use"
  - "Payment result pages: show generic message for unauthenticated users instead of login redirect"

requirements-completed: [FR-4.1, FR-4.5, NFR-1.4]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 04 Plan 03: Guest Payment Flow Summary

**Guest-compatible Redsys payment initiation with token-based ownership, webhook email routing by tipo_cliente, and buildGuestPedidoHtml IVA-inclusive template**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T15:27:52Z
- **Completed:** 2026-03-09T15:32:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Payment initiation endpoint now supports guest orders via guest_token body parameter for ownership verification
- Webhook correctly routes confirmation emails: guest orders use guest_email/guest_nombre from pedido, auth orders fetch from Directus /users
- New buildGuestPedidoHtml email template with IVA-inclusive pricing and token-based CTA link
- Payment result pages (ok/ko) no longer redirect unauthenticated users to login, showing generic messages instead

## Task Commits

Each task was committed atomically:

1. **Task 1: Update pago-api/initiate.ts for guest order support** - `887ba09` (feat)
2. **Task 2: Add buildGuestPedidoHtml, update webhook, update pago result pages** - `99a6526` (feat)

## Files Created/Modified
- `frontend/src/pages/pago-api/initiate.ts` - Guest token ownership verification, token-based Redsys return URLs
- `frontend/src/pages/pago-api/webhook.ts` - Guest/auth branching in sendPaymentEmails, guest field fetching
- `frontend/src/lib/email.ts` - New buildGuestPedidoHtml function for B2C IVA-inclusive guest order emails
- `frontend/src/pages/pago/ok.astro` - Removed login redirect for unauthenticated users, conditional action buttons
- `frontend/src/pages/pago/ko.astro` - Removed login redirect, added guest-friendly contact support messaging

## Decisions Made
- Guest payment initiation uses guest_token from request body (not query param or header) for consistency with guest-submit endpoint
- Guest Redsys return URLs point to /pedido/[token]?status=ok|ko (handled by 04-04's dynamic route) rather than /pago/ok|ko
- Admin company email always uses buildPedidoHtml regardless of guest/auth (admin sees B2B-style data); guest client email uses dedicated buildGuestPedidoHtml
- Admin email subject prefixed with "Invitado: [name]" for guest orders to distinguish in inbox
- pago/ok and pago/ko show generic messages without order details for unauthenticated access (security: no data leak)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guest payment flow is complete end-to-end (initiation through webhook email)
- Ready for 04-04: Guest order status page (/pedido/[token]) which handles the token-based return URLs
- Auth payment flow is fully backward compatible

## Self-Check: PASSED

- All 5 modified files exist on disk
- Commit 887ba09 (Task 1) verified in git log
- Commit 99a6526 (Task 2) verified in git log
- buildGuestPedidoHtml found in email.ts and webhook.ts
- guest_token references found in initiate.ts (7 occurrences)
- tipo_cliente invitado check found in webhook.ts

---
*Phase: 04-b2c-checkout-and-guest-orders*
*Completed: 2026-03-09*
