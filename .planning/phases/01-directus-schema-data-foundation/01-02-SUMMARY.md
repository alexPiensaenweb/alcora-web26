---
phase: 01-directus-schema-data-foundation
plan: "02"
subsystem: api
tags: [typescript, directus, b2c, segmento, blog, fetcher]

# Dependency graph
requires:
  - phase: 01-01
    provides: "B2C type definitions (segmento_venta, tipo_iva on Producto), ArticuloBlog interface"
provides:
  - "getProductos() segmento filter param for B2C/B2B catalog visibility"
  - "getArticulos() function for blog article listings"
  - "getArticuloBySlug() function for single article with related products"
  - "segmento_venta and tipo_iva fields in getProductos response"
affects: [02-catalog-ssr, 03-blog-seo, 04-checkout-guest]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Segmento filter: b2c_ambos uses _in operator for composite visibility; specific values use _eq"
    - "Blog listing excludes contenido (heavy HTML) for performance; detail view fetches all fields"
    - "M2M deep fetch: productos_relacionados.productos_id.field for junction table traversal"

key-files:
  created: []
  modified:
    - frontend/src/lib/directus.ts

key-decisions:
  - "Simplified else-if guard to remove redundant b2c_ambos comparison — TypeScript narrowing made the explicit check unnecessary after the first branch"
  - "getArticulos excludes contenido field from listing queries — rich HTML is only fetched on getArticuloBySlug detail view"

patterns-established:
  - "Segmento filter pattern: callers pass segmento param, fetcher builds appropriate Directus filter"
  - "Blog fetcher pattern: listing (subset fields) vs detail (all fields + related products)"

requirements-completed: [FR-7.1]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 1 Plan 02: Directus Fetcher Functions Summary

**Segmento visibility filter on getProductos() plus getArticulos/getArticuloBySlug blog fetchers added to directus.ts for downstream catalog and blog pages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T11:32:56Z
- **Completed:** 2026-02-24T11:35:32Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- Added optional `segmento` param to `getProductos()` enabling B2C/B2B catalog filtering without breaking existing callers
- Added `segmento_venta` and `tipo_iva` to getProductos fetched fields for downstream price/visibility logic
- Created `getArticulos()` for paginated blog listings with category filter and published-only status
- Created `getArticuloBySlug()` for single article detail with deep-fetched related products via M2M junction

## Task Commits

Each task was committed atomically:

1. **Task 1: Add segmento filter param to getProductos()** - `396d8b5` (feat)
2. **Task 2: Add getArticulos() and getArticuloBySlug() to directus.ts** - `7ebad06` (feat)

## Files Created/Modified
- `frontend/src/lib/directus.ts` - Added segmento param to getProductos, segmento_venta/tipo_iva to fields, getArticulos and getArticuloBySlug blog fetcher functions, ArticuloBlog import

## Decisions Made
- Simplified the else-if branch for segmento filter: the plan specified `params.segmento !== 'b2c_ambos'` in the else-if guard, but TypeScript correctly narrows the type after the first `=== 'b2c_ambos'` check, making the comparison unreachable (TS2367). Removed the redundant guard — logic is identical.
- Blog listing (`getArticulos`) intentionally excludes `contenido` field to avoid fetching large HTML payloads for list views.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed redundant b2c_ambos comparison in else-if branch**
- **Found during:** Task 1 (segmento filter implementation)
- **Issue:** Plan specified `else if (params?.segmento && params.segmento !== 'b2c_ambos')` but TypeScript correctly flags this as TS2367 — after the first `if` checks `=== 'b2c_ambos'`, the narrowed type can never be `'b2c_ambos'` in the else branch, making the comparison unintentional.
- **Fix:** Simplified to `else if (params?.segmento)` — logically equivalent since b2c_ambos is already handled
- **Files modified:** frontend/src/lib/directus.ts
- **Verification:** npx tsc --noEmit shows 0 directus.ts errors
- **Committed in:** 396d8b5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor syntactic fix to satisfy TypeScript strict checking. Logic unchanged.

## Issues Encountered
- 17 pre-existing TypeScript errors across redsys.ts, register.ts, PedidoAdminPanel.tsx remain unchanged. Same count as documented in 01-01-SUMMARY.md. None introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `getProductos()` segmento filter ready for Phase 2 catalog SSR pages to pass B2C visibility context
- `getArticulos()` and `getArticuloBySlug()` ready for Phase 3 blog/SEO page implementation
- All existing directus.ts functions compile unchanged — no downstream breakage

## Self-Check: PASSED

- FOUND: frontend/src/lib/directus.ts
- FOUND: .planning/phases/01-directus-schema-data-foundation/01-02-SUMMARY.md
- FOUND: commit 396d8b5
- FOUND: commit 7ebad06

---
*Phase: 01-directus-schema-data-foundation*
*Completed: 2026-02-24*
