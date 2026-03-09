---
phase: 04-b2c-checkout-and-guest-orders
plan: 02
subsystem: ui, api
tags: [checkout, guest, iva, turnstile, payment-methods, redsys, b2c, b2b]

# Dependency graph
requires:
  - phase: 04-b2c-checkout-and-guest-orders
    provides: guest_token type, tipoIva on CartItem, acepta_legal schemas, getAllowedPaymentMethods, computeCheckoutSummary, resolveUserType
  - phase: 03-b2c-product-catalog-and-pricing
    provides: calculateB2CPrice, tipo_iva on products, segmento_venta filtering
provides:
  - Unified checkout page accepting both auth and guest users
  - CheckoutForm with guest/particular/professional 3-way branching
  - Guest order submission endpoint with Turnstile verification and guest_token
  - Payment method server-side validation per user type
  - B2C IVA-inclusive price computation in cart/submit
  - tipo_cliente field on pedido records
affects: [04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-way checkout branching, guest order submission with Turnstile, server-side payment method validation]

key-files:
  created:
    - frontend/src/pages/cart/guest-submit.ts
  modified:
    - frontend/src/pages/checkout.astro
    - frontend/src/components/checkout/CheckoutForm.tsx
    - frontend/src/pages/cart/submit.ts

key-decisions:
  - "Guest checkout uses inline fork UI (choosing/guest/authenticated modes) rather than separate pages"
  - "Guest orders submit to separate /cart/guest-submit endpoint (not shared with auth submit)"
  - "Payment initiate for guests passes guest_token for Redsys reconciliation"
  - "B2C shipping includes 21% IVA in cart/submit (matching guest-submit behavior)"

patterns-established:
  - "3-way checkout mode pattern: CheckoutForm determines mode from user prop (null=choosing, non-null=authenticated, user-click=guest)"
  - "Server-side payment validation pattern: resolveUserType + getAllowedPaymentMethods used in both UI and API"
  - "Guest token generation pattern: randomUUID from node:crypto for cryptographically secure guest order tokens"

requirements-completed: [FR-4.1, FR-4.2, FR-4.6, FR-4.7, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-6.1, FR-6.2, FR-6.3, FR-6.4, NFR-1.2, NFR-1.4]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 4 Plan 2: Unified Checkout and Guest Submit Summary

**Unified checkout with 3-way branching (guest/particular/professional), guest order endpoint with Turnstile+guest_token, payment method validation, and IVA-inclusive B2C pricing in both submit endpoints**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T15:19:33Z
- **Completed:** 2026-03-09T15:24:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- checkout.astro passes user|null and turnstileSiteKey (no auth redirect for guests)
- CheckoutForm rewritten with inline fork: "Iniciar sesion" + secondary "Registrarse" link + "Continuar como invitado"
- Guest form collects nombre, email, telefono, direccion with Cloudflare Turnstile widget
- Payment methods dynamically filtered per user type via getAllowedPaymentMethods
- IVA breakdown in order summary sidebar for B2C users (base imponible, IVA groups, shipping con IVA)
- Legal checkbox required for all user types before submission
- Professionals see "Confirmar pedido" + "Solicitar presupuesto" options
- New /cart/guest-submit endpoint: validates pedidoGuestSchema, verifies Turnstile, blocks B2B products, generates guest_token UUID, creates pedido with tipo_cliente='invitado'
- cart/submit.ts: rejects invalid payment methods per user type, computes IVA-inclusive prices for B2C users, adds tipo_cliente to pedido

## Task Commits

Each task was committed atomically:

1. **Task 1: Update checkout.astro and build unified CheckoutForm.tsx** - `3ecc17b` (feat)
2. **Task 2: Create guest-submit.ts and update cart/submit.ts** - `098a28e` (feat)

## Files Created/Modified
- `frontend/src/pages/checkout.astro` - Passes user|null and turnstileSiteKey (no auth redirect)
- `frontend/src/components/checkout/CheckoutForm.tsx` - Complete rewrite with 3-way branching, guest form, IVA sidebar
- `frontend/src/pages/cart/guest-submit.ts` - New guest order endpoint with Turnstile and guest_token
- `frontend/src/pages/cart/submit.ts` - Added payment validation, B2C IVA pricing, tipo_cliente

## Decisions Made
- Guest checkout uses inline fork UI with three modes (choosing/guest/authenticated) in a single component rather than separate pages, keeping the UX seamless
- Guest orders use a dedicated /cart/guest-submit endpoint rather than sharing the auth submit endpoint, keeping concerns cleanly separated
- Payment initiate request for guests includes guest_token for Redsys return URL reconciliation
- B2C shipping includes 21% IVA in cart/submit.ts to match the guest-submit behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Removed unused `isProfessionalUser` import from CheckoutForm.tsx that triggered an astro check warning (ts(6133)). The function is used internally by `resolveUserType` but not directly needed in the component.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Checkout page and both submit endpoints are fully operational
- Plan 04-03 (payment flow and Redsys integration for guests) can build on guest_token and payment initiate flow
- Plan 04-04 (confirmation pages) can use /pedido/ dynamic route with guest_token from guest-submit response

## Self-Check: PASSED

All 4 files verified present. All 2 commit hashes verified in git log.

---
*Phase: 04-b2c-checkout-and-guest-orders*
*Completed: 2026-03-09*
