---
phase: 03-b2c-product-catalog-and-pricing
plan: 01
subsystem: api
tags: [pricing, iva, segmento, b2c, filtering, vitest, tdd]

# Dependency graph
requires:
  - phase: 01-directus-schema-data-foundation
    provides: segmento_venta and tipo_iva fields on productos collection
provides:
  - calculateB2CPrice() utility for IVA-inclusive pricing
  - isProfessionalUser() utility for user type detection
  - Segmento-filtered products-api with dual pricing (B2C/B2B)
  - Segmento-filtered search/suggest endpoint
  - Segmento-validated cart/submit endpoint
affects: [03-b2c-product-catalog-and-pricing, 04-checkout-payments-guest]

# Tech tracking
tech-stack:
  added: [vitest (test runner, first project test file)]
  patterns: [TDD red-green for utility functions, segmento-based product filtering]

key-files:
  created:
    - frontend/src/lib/pricing.test.ts
  modified:
    - frontend/src/lib/pricing.ts
    - frontend/src/pages/products-api.ts
    - frontend/src/pages/search/suggest.ts
    - frontend/src/pages/cart/submit.ts

key-decisions:
  - "Visitors/particulares see IVA-inclusive prices via calculateB2CPrice; professionals see tarifa prices sin IVA (unchanged)"
  - "Removed solo_profesional from products-api response; replaced by segmento_venta filtering"
  - "Added priceLabel field ('IVA incluido' or 'sin IVA') to products-api response for UI consumption"
  - "segmento_venta check in cart/submit coexists with solo_profesional check for backward compatibility"

patterns-established:
  - "Segmento filtering pattern: isProfessional ? undefined : 'b2c_ambos' passed to getProductos"
  - "Dual pricing pattern: professionals get tarifa-discounted precio_base; visitors get calculateB2CPrice with IVA"
  - "TDD with Vitest: red-green commit pattern for utility functions"

requirements-completed: [FR-1.3, FR-1.4, FR-2.1, FR-2.3, FR-2.4, NFR-1.3, NFR-3.1]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 3 Plan 1: B2C Pricing and Segmento Filtering Summary

**B2C IVA-inclusive pricing utilities and segmento-based product filtering across all server-side endpoints (products-api, search/suggest, cart/submit)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T12:20:33Z
- **Completed:** 2026-03-09T12:25:26Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- calculateB2CPrice() applies IVA (21%/10%/4%) to precio_base for consumer-facing display, with 14 unit tests
- products-api returns segmento-filtered results and dual pricing: "IVA incluido" for visitors, "sin IVA" for professionals
- search/suggest filters out b2b-only products for non-professional users
- cart/submit validates segmento_venta and rejects b2b products ordered by non-professionals

## Task Commits

Each task was committed atomically:

1. **Task 1: Add calculateB2CPrice() and isProfessionalUser() [TDD]**
   - `4353f04` (test: failing tests - RED phase)
   - `39cf088` (feat: implementation - GREEN phase)
2. **Task 2: Update products-api.ts with segmento filter and dual pricing** - `d3995d9` (feat)
3. **Task 3: Add segmento filter to search/suggest and validation to cart/submit** - `89c0c81` (feat)

## Files Created/Modified
- `frontend/src/lib/pricing.ts` - Added calculateB2CPrice() and isProfessionalUser() utility functions
- `frontend/src/lib/pricing.test.ts` - 14 Vitest unit tests covering all pricing and user-type behaviors
- `frontend/src/pages/products-api.ts` - Segmento filter, dual pricing with priceLabel, removed solo_profesional
- `frontend/src/pages/search/suggest.ts` - Segmento filter for non-professionals, reads locals for auth state
- `frontend/src/pages/cart/submit.ts` - segmento_venta validation alongside existing solo_profesional check

## Decisions Made
- Visitors and particulares see IVA-inclusive prices via calculateB2CPrice; professionals see tarifa-discounted sin IVA prices (existing B2B behavior unchanged)
- Removed solo_profesional from products-api response shape per user decision (no segment badges)
- Added priceLabel field to response for UI to display correct tax label
- segmento_venta check in cart/submit coexists with solo_profesional for backward compatibility during migration
- search/suggest now reads locals (added to destructured params) to detect user auth state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- B2C pricing and filtering foundation is complete
- All server-side endpoints now respect segmento_venta
- Ready for Plan 02 (B2C catalog pages and UI components) to consume the priceLabel and filtered products-api
- Pre-existing 56 TypeScript errors in other files (admin panel, etc.) are unrelated to this plan's changes

## Self-Check: PASSED

All 6 files verified present. All 4 commits verified in git log.

---
*Phase: 03-b2c-product-catalog-and-pricing*
*Completed: 2026-03-09*
