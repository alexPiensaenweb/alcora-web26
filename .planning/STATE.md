---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-09T15:31:00.000Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Professionals order and quote efficiently; consumers buy B2C-eligible products without friction — one store, professional tone, dual audience.
**Current focus:** Phase 4 — B2C Checkout and Guest Orders

## Current Position

Phase: 4 of 5 (B2C Checkout and Guest Orders) -- COMPLETE
Plan: 4 of 4 in current phase
Status: Phase 04 Complete
Last activity: 2026-03-09 — Completed 04-04 (Guest order confirmation page and legal pages)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 3.8min
- Total execution time: 46min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-directus-schema-data-foundation | 3 | 7min | 2.3min |
| 02-infrastructure-security-prerequisites | 2 | 6min | 3min |

| 03-b2c-product-catalog-and-pricing | 3 | 15min | 5min |

**Recent Trend:**
- Last 5 plans: 03-02 (7min), 04-01 (6min), 04-02 (5min), 04-03 (4min), 04-04 (3min)
- Trend: Stable

*Updated after each plan completion*
| Phase 03 P02 | 7min | 3 tasks | 8 files |
| Phase 04 P01 | 6min | 3 tasks | 7 files |
| Phase 04 P02 | 5min | 2 tasks | 4 files |
| Phase 04 P03 | 4min | 2 tasks | 5 files |
| Phase 04 P04 | 3min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All existing products default to `b2b` on `segmento_venta` migration (safe default — prevents accidental B2C exposure)
- All prices stored sin IVA; `tipo_iva` field per product; IVA applied at display time only
- Guest checkout is stateless — guest fields on `pedidos`, no temporary Directus users
- pedidoGuestSchema restricts metodo_pago to tarjeta/bizum (no transferencia for guests) enforcing FR-5.1 at schema level
- Zod schemas self-describing — no type imports from types.ts, avoids circular dependency risk
- Blog listing (getArticulos) excludes contenido field for performance — only detail view (getArticuloBySlug) fetches full HTML
- Segmento filter uses _in operator for composite b2c_ambos visibility; specific values use _eq
- Schema changes applied directly to production Directus via REST API rather than local Docker instance
- articulos public permissions filtered by status=published to prevent draft exposure
- articulos_productos junction table given public read permission to enable M2M deep fetch
- Rate limit windows widened across endpoints for brute-force protection (login 15min, register 15min, profile 5min, submit 5min, pago-init 15min)
- Payment endpoint locked at 5 req/15min per user decision (NFR-3.3)
- Fail-open on Redis errors to avoid blocking legitimate requests during transient outages
- Production Redis bound to 127.0.0.1 only to prevent internet exposure
- Free Resend plan (100/day, 3,000/month) sufficient for current B2C volume -- upgrade deferred until traffic warrants it
- Email retry: 30s delay, 1 retry max, never throws on final failure to protect order/payment flows
- B2B smoke test is manual checklist only, no automation
- Visitors/particulares see IVA-inclusive prices via calculateB2CPrice; professionals see tarifa prices sin IVA (unchanged)
- Removed solo_profesional from products-api response; replaced by segmento_venta filtering
- Added priceLabel field ('IVA incluido' or 'sin IVA') to products-api response for UI consumption
- segmento_venta check in cart/submit coexists with solo_profesional check for backward compatibility
- B2C address collected at checkout, not registration -- minimizes friction for particulares
- Address fields conditionally sent to Directus only when provided -- prevents empty strings in DB
- Cart stores sin-IVA precio_base for B2C users; IVA breakdown computed at checkout time (Phase 4)
- data-product-tipo-iva attribute added to cart section for future Phase 4 IVA calculation
- Solo profesionales badge removed from all catalog components per user decision (NO badges)
- B2B product detail redirect uses Astro.redirect('/catalogo') not 403, per user decision
- [Phase 03]: Cart stores sin-IVA precio_base for B2C users; IVA breakdown computed at checkout (Phase 4)
- [Phase 04]: IVA breakdown computed via computeCheckoutSummary (single source of truth for cart and checkout)
- [Phase 04]: Shipping IVA at 21% for transport services (standard Spanish rate)
- [Phase 04]: Presupuesto button restricted to professional users only (not particulares or guests)
- [Phase 04]: tipoIva defaults to 21 via || fallback for backward compat with existing localStorage cart data
- [Phase 04]: Guest checkout inline fork UI with three modes (choosing/guest/authenticated) in single CheckoutForm component
- [Phase 04]: Guest orders use dedicated /cart/guest-submit endpoint (separate from auth submit)
- [Phase 04]: Payment initiate for guests passes guest_token for Redsys return URL reconciliation
- [Phase 04]: B2C shipping includes 21% IVA in cart/submit.ts (matching guest-submit behavior)
- [Phase 04]: Guest payment initiation uses guest_token body param for ownership verification (not auth session)
- [Phase 04]: Guest Redsys return URLs use /pedido/[token]?status=ok|ko (non-guessable, NFR-1.4)
- [Phase 04]: Webhook branches on tipo_cliente=invitado for email routing: guests use pedido guest_* fields, auth fetches /users/{id}
- [Phase 04]: Admin email always uses buildPedidoHtml; guest client email uses buildGuestPedidoHtml with IVA-inclusive pricing
- [Phase 04]: pago/ok and pago/ko no longer redirect unauthenticated users to login
- [Phase 04]: Guest order page fetches by guest_token filter (not numeric ID) for security -- prevents enumeration attacks
- [Phase 04]: Legal pages contain substantive Spanish law references (LGDCU RDL 1/2007, RGPD) with advisory disclaimer

### Pending Todos

None yet.

### Blockers/Concerns

- **OD-1**: B2C shipping rates unconfirmed by client — proposal is 6.99 flat, free >= 100. Must resolve before Phase 4 implementation.
- **OD-2**: IVA rates per product category — default 21% is safe but may overcharge on some hygiene products. Confirm with Alcora's asesor fiscal.
- **OD-4**: ~~Legal pages (condiciones de venta, devoluciones) — may need to be drafted. Blocks Phase 4 legal checkboxes.~~ RESOLVED in 04-04.
- **Phase 4 research flag**: Redsys guest order reconciliation behavior (stateless pedidoId-in-return-URL) has not been verified empirically in this environment. Plan 04-01 is a verification step before implementation.

## Session Continuity

Last session: 2026-03-09
Stopped at: Completed 04-03-PLAN.md (Guest payment flow - initiation, webhook, email, result pages)
Resume file: None
