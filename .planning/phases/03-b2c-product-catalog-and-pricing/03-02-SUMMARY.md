---
phase: 03-b2c-product-catalog-and-pricing
plan: 02
subsystem: ui
tags: [b2c, pricing, iva, segmento, productcard, catalog, astro, react]

# Dependency graph
requires:
  - phase: 03-b2c-product-catalog-and-pricing
    plan: 01
    provides: calculateB2CPrice(), isProfessionalUser(), segmento-filtered products-api with priceLabel
provides:
  - Dual B2C/B2B pricing display across all catalog surfaces (homepage, catalog, category, brand, product detail)
  - Segmento filtering on all 4 listing pages (non-professionals see only b2c/ambos products)
  - B2B product redirect for non-professional direct URL access
  - priceLabel rendering in ProductCard, ProductGrid, and InfiniteProductGrid
  - Schema.org JSON-LD with IVA-inclusive priceSpecification for B2C visitors
affects: [04-checkout-payments-guest]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-pricing display pattern with priceLabel prop, segmento-based page filtering, B2B redirect guard]

key-files:
  created: []
  modified:
    - frontend/src/components/catalog/ProductCard.astro
    - frontend/src/components/catalog/ProductGrid.astro
    - frontend/src/components/catalog/InfiniteProductGrid.tsx
    - frontend/src/pages/catalogo/index.astro
    - frontend/src/pages/catalogo/[slug].astro
    - frontend/src/pages/categoria/[slug].astro
    - frontend/src/pages/marca/[slug].astro
    - frontend/src/pages/index.astro

key-decisions:
  - "Cart stores sin-IVA precio_base for B2C users; IVA breakdown computed at checkout (Phase 4)"
  - "data-product-tipo-iva attribute added to cart section for future Phase 4 IVA calculation"
  - "Solo profesionales badge removed from all three components and product detail per user decision"
  - "B2B product detail redirect uses Astro.redirect('/catalogo') not 403, per user decision"
  - "Removed solo_profesional-based cart restriction; replaced by segmento_venta + isProfessional redirect"

patterns-established:
  - "Dual pricing display: isProfessional gets tarifa sin IVA; visitors/particulares get calculateB2CPrice with IVA incluido label"
  - "Segmento page filtering: const segmento = isProfessional ? undefined : 'b2c_ambos' passed to every getProductos call"
  - "B2B redirect guard: product.segmento_venta === 'b2b' && !isProfessional triggers Astro.redirect"

requirements-completed: [FR-2.2, FR-2.5, FR-3.1, FR-3.2, FR-3.3, FR-3.4, NFR-2.3, NFR-4.1]

# Metrics
duration: 7min
completed: 2026-03-09
---

# Phase 3 Plan 2: B2C Catalog Pages and Dual Pricing UI Summary

**Dual B2C/B2B price display with IVA labels across all catalog surfaces, segmento filtering on 4 listing pages, and B2B product redirect for non-professionals**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-09T12:35:35Z
- **Completed:** 2026-03-09T12:42:12Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- ProductCard, ProductGrid, and InfiniteProductGrid now display priceLabel ("IVA incluido" / "sin IVA") below prices
- All 4 listing pages (catalogo, categoria, marca, homepage) pass segmento filter to getProductos, hiding B2B products from non-professionals
- Product detail page redirects non-professionals from B2B product URLs to /catalogo
- Product detail shows IVA-inclusive B2C price for visitors/particulares, tarifa price for professionals
- Schema.org JSON-LD includes priceSpecification with valueAddedTaxIncluded:true for B2C visitors
- "Solo profesionales" badge completely removed from all UI components

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ProductCard, ProductGrid, InfiniteProductGrid components** - `58c4b12` (feat)
2. **Task 2a: Update 4 listing pages with segmento filter and dual pricing** - `cba6035` (feat)
3. **Task 2b: Update product detail page with B2B redirect and dual pricing** - `e6646b8` (feat)

## Files Created/Modified
- `frontend/src/components/catalog/ProductCard.astro` - Added priceLabel prop, removed Solo profesionales badge
- `frontend/src/components/catalog/ProductGrid.astro` - Added isProfessional prop, B2C price calculation with calculateB2CPrice
- `frontend/src/components/catalog/InfiniteProductGrid.tsx` - Updated interface with priceLabel, removed solo_profesional, updated price rendering
- `frontend/src/pages/catalogo/index.astro` - Segmento filter, dual pricing in initialItems
- `frontend/src/pages/catalogo/[slug].astro` - B2B redirect, dual pricing, Schema.org priceSpecification, cart stores sin-IVA price
- `frontend/src/pages/categoria/[slug].astro` - Segmento filter, dual pricing in initialItems
- `frontend/src/pages/marca/[slug].astro` - Segmento filter, dual pricing in initialItems
- `frontend/src/pages/index.astro` - Segmento-filtered featured products with B2C prices

## Decisions Made
- Cart stores sin-IVA (precio_base) for B2C users so IVA breakdown can be computed at checkout time (Phase 4 concern)
- Added data-product-tipo-iva attribute for Phase 4 to know which IVA rate applies
- Solo profesionales badge removed from all 3 components + product detail page (user decision: NO badges)
- Product detail B2B redirect uses Astro.redirect not 403 page (user decision: silent redirect)
- Replaced solo_profesional-based cart restriction with segmento_venta check + isProfessional redirect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused TarifaEspecial import from product detail**
- **Found during:** Task 2b
- **Issue:** After refactoring price calculation, TarifaEspecial type import was no longer used, causing TypeScript warning
- **Fix:** Removed TarifaEspecial from import, kept Categoria
- **Files modified:** frontend/src/pages/catalogo/[slug].astro
- **Committed in:** e6646b8 (part of Task 2b commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial cleanup. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All catalog UI surfaces now display correct B2C prices with IVA labels
- Segmento filtering active on all listing pages
- B2B product redirect protects non-professional access
- Cart stores sin-IVA price with tipo_iva attribute ready for Phase 4 checkout IVA calculation
- Pre-existing TypeScript errors (56 total) in admin panel, Header, register, etc. are unrelated

---
*Phase: 03-b2c-product-catalog-and-pricing*
*Completed: 2026-03-09*
