---
phase: 04-b2c-checkout-and-guest-orders
plan: 04
subsystem: ui
tags: [astro, legal, guest-orders, redsys, ssr]

# Dependency graph
requires:
  - phase: 04-02
    provides: "Guest checkout form and guest-submit endpoint with guest_token on pedidos"
provides:
  - "/pedido/[token] guest order confirmation page with status banners"
  - "/condiciones-venta Spanish ecommerce terms of sale"
  - "/politica-devoluciones 14-day return policy per LGDCU"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["guest_token-based page access (filter not ID)", "legal page pattern (BaseLayout, no React islands)"]

key-files:
  created:
    - frontend/src/pages/pedido/[token].astro
    - frontend/src/pages/condiciones-venta.astro
    - frontend/src/pages/politica-devoluciones.astro
  modified: []

key-decisions:
  - "Guest order page fetches by guest_token filter (not numeric ID) for security"
  - "Legal pages contain substantive Spanish law references (LGDCU RDL 1/2007, RGPD) with advisory disclaimer"

patterns-established:
  - "Guest token page access: filter[guest_token][_eq] pattern for non-authenticated order views"
  - "Legal pages: server-rendered with BaseLayout, no React islands, prose styling"

requirements-completed: [FR-4.5, NFR-1.4, NFR-4.2, NFR-4.3]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 04 Plan 04: Guest Order Confirmation and Legal Pages Summary

**Guest order confirmation page at /pedido/[token] with Redsys status banners, plus Spanish legal pages (condiciones-venta, politica-devoluciones) for checkout compliance**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T15:28:00Z
- **Completed:** 2026-03-09T15:31:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Guest order confirmation page at /pedido/[token] with green/red status banners for Redsys payment results
- Order display with items, images, quantities, totals, guest contact info, and shipping address
- Subtle register CTA for guest-to-account conversion
- Terms of sale page covering 10 sections of Spanish ecommerce law
- Returns policy page covering 14-day desistimiento right per LGDCU

## Task Commits

Each task was committed atomically:

1. **Task 1: Create guest order confirmation page /pedido/[token].astro** - `c70092e` (feat)
2. **Task 2: Create legal pages (condiciones-venta and politica-devoluciones)** - `3d3bac3` (feat)

## Files Created/Modified
- `frontend/src/pages/pedido/[token].astro` - Guest order confirmation page with status banners, items display, totals, guest info, register CTA
- `frontend/src/pages/condiciones-venta.astro` - Spanish ecommerce terms of sale (10 sections)
- `frontend/src/pages/politica-devoluciones.astro` - 14-day return policy per LGDCU RDL 1/2007

## Decisions Made
- Guest order page fetches by guest_token filter (not numeric ID) for security -- prevents enumeration attacks
- Legal pages contain substantive Spanish law references with advisory disclaimer recommending lawyer review
- Processing note shown when estado is aprobado_pendiente_pago (async webhook hasn't updated yet)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Guest flow end-state is complete: checkout -> Redsys -> /pedido/[token]?status=ok|ko
- Legal pages linked from checkout legal checkbox now resolve (no 404s)
- OD-4 blocker (legal pages) is resolved
- Phase 04 plans complete; ready for Phase 05

## Self-Check: PASSED

All 3 created files verified on disk. Both task commits (c70092e, 3d3bac3) verified in git log.

---
*Phase: 04-b2c-checkout-and-guest-orders*
*Completed: 2026-03-09*
