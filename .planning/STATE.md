# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** Professionals order and quote efficiently; consumers buy B2C-eligible products without friction — one store, professional tone, dual audience.
**Current focus:** Phase 1 — Directus Schema and Data Foundation

## Current Position

Phase: 1 of 5 (Directus Schema and Data Foundation)
Plan: 2 of 3 in current phase
Status: Executing
Last activity: 2026-02-24 — Completed 01-02-PLAN.md (Directus fetcher functions)

Progress: [██░░░░░░░░] 13%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 2.5min
- Total execution time: 5min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-directus-schema-data-foundation | 2 | 5min | 2.5min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (2min)
- Trend: Accelerating

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

### Pending Todos

None yet.

### Blockers/Concerns

- **OD-1**: B2C shipping rates unconfirmed by client — proposal is 6.99€ flat, free >= 100€. Must resolve before Phase 4 implementation.
- **OD-2**: IVA rates per product category — default 21% is safe but may overcharge on some hygiene products. Confirm with Alcora's asesor fiscal.
- **OD-4**: Legal pages (condiciones de venta, devoluciones) — may need to be drafted. Blocks Phase 4 legal checkboxes.
- **Phase 4 research flag**: Redsys guest order reconciliation behavior (stateless pedidoId-in-return-URL) has not been verified empirically in this environment. Plan 04-01 is a verification step before implementation.

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 01-02-PLAN.md
Resume file: None
