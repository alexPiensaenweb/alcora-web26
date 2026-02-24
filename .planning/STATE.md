# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Professionals order and quote efficiently; consumers buy B2C-eligible products without friction — one store, professional tone, dual audience.
**Current focus:** Phase 2 — Infrastructure and Security Prerequisites

## Current Position

Phase: 2 of 5 (Infrastructure and Security Prerequisites)
Plan: 2 of 2 in current phase
Status: Ready
Last activity: 2026-02-24 — Completed 02-01 (Redis rate limiting)

Progress: [████░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 2.5min
- Total execution time: 10min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-directus-schema-data-foundation | 3 | 7min | 2.3min |
| 02-infrastructure-security-prerequisites | 1 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (2min), 01-03 (2min), 02-01 (3min)
- Trend: Stable

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- **OD-1**: B2C shipping rates unconfirmed by client — proposal is 6.99 flat, free >= 100. Must resolve before Phase 4 implementation.
- **OD-2**: IVA rates per product category — default 21% is safe but may overcharge on some hygiene products. Confirm with Alcora's asesor fiscal.
- **OD-4**: Legal pages (condiciones de venta, devoluciones) — may need to be drafted. Blocks Phase 4 legal checkboxes.
- **Phase 4 research flag**: Redsys guest order reconciliation behavior (stateless pedidoId-in-return-URL) has not been verified empirically in this environment. Plan 04-01 is a verification step before implementation.

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 02-01-PLAN.md (Redis rate limiting)
Resume file: None
