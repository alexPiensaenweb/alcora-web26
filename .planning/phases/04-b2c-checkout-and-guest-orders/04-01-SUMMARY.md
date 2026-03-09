---
phase: 04-b2c-checkout-and-guest-orders
plan: 01
subsystem: ui, api
tags: [checkout, guest, iva, cart, zod, middleware, payment-methods]

# Dependency graph
requires:
  - phase: 03-b2c-product-catalog-and-pricing
    provides: calculateB2CPrice, tipo_iva on products, segmento_venta filtering
provides:
  - Pedido type with guest_token field
  - CartItem type with tipoIva field
  - acepta_legal on both order schemas (pedidoSubmitSchema, pedidoGuestSchema)
  - /checkout accessible without auth (middleware updated)
  - getAllowedPaymentMethods utility for B2C/B2B payment restrictions
  - computeIvaBreakdown and computeCheckoutSummary for IVA-aware pricing
  - resolveUserType utility for auth-to-user-type mapping
  - B2C-compatible CartPage with IVA breakdown sidebar
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [IVA breakdown computation, payment method restrictions by user type, B2C/B2B sidebar branching]

key-files:
  created: []
  modified:
    - frontend/src/lib/types.ts
    - frontend/src/lib/schemas.ts
    - frontend/src/middleware.ts
    - frontend/src/lib/pricing.ts
    - frontend/src/lib/pricing.test.ts
    - frontend/src/components/cart/CartPage.tsx
    - frontend/src/pages/catalogo/[slug].astro

key-decisions:
  - "IVA breakdown computed at checkout summary level using computeCheckoutSummary (single source of truth for both cart and checkout)"
  - "Shipping IVA at 21% for transport services (standard Spanish rate)"
  - "Presupuesto button restricted to professional users only (not particulares or guests)"
  - "tipoIva defaults to 21 via || fallback for backward compatibility with existing localStorage cart data"

patterns-established:
  - "computeCheckoutSummary pattern: single function returns full checkout breakdown (subtotal, IVA groups, shipping, total) for both B2C and B2B"
  - "getAllowedPaymentMethods pattern: centralized payment method restriction by user type, used by both UI and server validation"
  - "isB2C determination: !isLoggedIn || grupoCliente === 'particular' || !grupoCliente"

requirements-completed: [FR-4.1, FR-4.7, FR-5.5, NFR-1.4]

# Metrics
duration: 6min
completed: 2026-03-09
---

# Phase 4 Plan 1: Guest Checkout Foundation Summary

**Guest checkout types (guest_token, tipoIva on CartItem), IVA-aware cart sidebar with breakdown by tax rate, payment method restrictions, and /checkout opened to unauthenticated users**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T15:09:24Z
- **Completed:** 2026-03-09T15:16:10Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Pedido type extended with guest_token; CartItem extended with tipoIva for IVA-aware cart
- Both order schemas (pedidoSubmitSchema, pedidoGuestSchema) now require acepta_legal: true
- /checkout removed from PROTECTED_ROUTES, enabling guest access; /pedido/ added to dynamic cache control
- getAllowedPaymentMethods restricts B2C to tarjeta+bizum, allows professionals pendiente
- computeIvaBreakdown groups items by IVA rate with correct rounding; computeCheckoutSummary adds shipping IVA
- CartPage renders for unauthenticated users (no clearCart wipe); B2C sidebar shows full IVA breakdown
- Product detail page passes tipoIva to addToCart via data-product-tipo-iva attribute

## Task Commits

Each task was committed atomically:

1. **Task 1: Update types, schemas, and middleware** - `1dbfb4e` (feat)
2. **Task 2: Add payment methods and IVA breakdown** - `cd7814c` (test, RED) + `21c4986` (feat, GREEN)
3. **Task 3: Update CartPage for B2C guests** - `920ac46` (feat)

_Note: Task 2 used TDD with separate RED and GREEN commits_

## Files Created/Modified
- `frontend/src/lib/types.ts` - Added guest_token to Pedido, tipoIva to CartItem
- `frontend/src/lib/schemas.ts` - Added acepta_legal to pedidoSubmitSchema and pedidoGuestSchema
- `frontend/src/middleware.ts` - Removed /checkout from PROTECTED_ROUTES, added /pedido/ to dynamic pages
- `frontend/src/lib/pricing.ts` - Added getAllowedPaymentMethods, resolveUserType, computeIvaBreakdown, computeCheckoutSummary
- `frontend/src/lib/pricing.test.ts` - Added 16 tests for new pricing functions (30 total)
- `frontend/src/components/cart/CartPage.tsx` - B2C-compatible cart with IVA breakdown sidebar
- `frontend/src/pages/catalogo/[slug].astro` - Pass tipoIva to addToCart

## Decisions Made
- IVA breakdown computed at checkout summary level using computeCheckoutSummary (single source of truth)
- Shipping IVA at 21% for transport services per Spanish standard rate
- Presupuesto button restricted to professional users only (not particulares or guests)
- tipoIva defaults to 21 via || fallback for backward compatibility with existing localStorage cart data
- addToCart caller in [slug].astro updated to pass tipoIva (deviation Rule 3 - blocking fix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tipoIva to addToCart call in product detail page**
- **Found during:** Task 3 (CartPage update)
- **Issue:** CartItem type now requires tipoIva, but the addToCart call in [slug].astro did not pass it
- **Fix:** Added `tipoIva: (parseInt(section.dataset.productTipoIva!) || 21) as 21 | 10 | 4` to the addToCart object
- **Files modified:** frontend/src/pages/catalogo/[slug].astro
- **Verification:** npx astro check passes with no errors in modified files
- **Committed in:** 920ac46 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for TypeScript correctness. The data-product-tipo-iva attribute already existed from Phase 3; this deviation only wired it into the addToCart call.

## Issues Encountered
None - all pre-existing astro check errors (57) are in unrelated files (Header.astro, redsys.ts, AdminLayout.astro, etc.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundation types, schemas, middleware, and pricing utilities are in place
- Plan 04-02 (guest checkout form) can build on guest_token, acepta_legal, getAllowedPaymentMethods
- Plan 04-03 (payment restrictions) can use getAllowedPaymentMethods for server validation
- Plan 04-04 (confirmation pages) can use /pedido/ dynamic route with guest_token

## Self-Check: PASSED

All 7 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 04-b2c-checkout-and-guest-orders*
*Completed: 2026-03-09*
