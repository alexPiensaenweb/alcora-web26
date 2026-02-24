# Roadmap: Tienda Alcora — Dual B2B+B2C

## Overview

The existing B2B-only tienda (live in production) gains a consumer-facing layer without breaking professional workflows. Five phases follow a strict dependency chain: the Directus data model must exist before any UI references new fields; infrastructure vulnerabilities must be fixed before unauthenticated users can initiate payments; the catalog must show correct prices before a checkout flow can convert anyone; the B2C checkout is the commerce core; and SEO content infrastructure delivers long-term consumer acquisition with no dependency on the checkout path.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Directus Schema and Data Foundation** - Add all new Directus fields and collections required by B2C before any frontend code ships
- [ ] **Phase 2: Infrastructure and Security Prerequisites** - Harden pre-existing vulnerabilities that become critical once unauthenticated users can initiate payments
- [ ] **Phase 3: B2C Product Catalog and Pricing** - Make products visible with correct prices to consumers and enforce the B2B/B2C segmentation boundary
- [ ] **Phase 4: B2C Checkout and Guest Orders** - Deliver the complete end-to-end B2C purchase path with guest checkout, payment restriction, and legal compliance
- [ ] **Phase 5: SEO Content Infrastructure and Blog** - Build the technical blog and structured data layer that turns content investment into organic consumer acquisition

## Phase Details

### Phase 1: Directus Schema and Data Foundation
**Goal**: All Directus schema changes required by B2C are deployed to production so downstream phases can build on stable field definitions.
**Depends on**: Nothing (first phase)
**Requirements**: FR-1.1, FR-1.2, FR-1.5, FR-4.3, FR-4.4, FR-7.1, NFR-2.1, NFR-4.4
**Success Criteria** (what must be TRUE):
  1. `productos` collection has `segmento_venta` field (`b2b | b2c | ambos`) and all existing records default to `b2b`
  2. `productos` collection has `tipo_iva` field (`21 | 10 | 4`) and all existing records default to `21`
  3. `pedidos` collection has `tipo_cliente`, `guest_email`, `guest_nombre`, `guest_telefono`, `guest_direccion` fields; `user_created` is nullable
  4. `articulos` collection exists in Directus with all required fields (titulo, slug, cuerpo, imagen, categoria_blog, fecha_publicacion, meta_description, productos_relacionados)
  5. Directus field permissions are set: B2C price fields visible to public role; B2B tarifa fields restricted to authenticated professionals
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Add B2C type definitions to types.ts (segmento_venta, tipo_iva on Producto; guest fields on Pedido; ArticuloBlog, GuestPedidoData) and Zod schemas to schemas.ts (pedidoGuestSchema, articuloSchema)
- [x] 01-02-PLAN.md — Add segmento filter param to getProductos(); add getArticulos() and getArticuloBySlug() to directus.ts
- [x] 01-03-PLAN.md — Verify Directus schema via API and human checkpoint: confirm all fields exist with correct names, types, and defaults; confirm articulos collection permissions

### Phase 2: Infrastructure and Security Prerequisites
**Goal**: Pre-existing vulnerabilities that are low-severity for authenticated B2B traffic become critical when unauthenticated users can initiate Redsys payments — fix them all before any guest-facing feature ships.
**Depends on**: Phase 1
**Requirements**: NFR-1.1, NFR-1.5, NFR-3.1, NFR-3.2, NFR-3.3, NFR-5.1, NFR-5.2
**Success Criteria** (what must be TRUE):
  1. Rate limiting on `/pago-api/initiate` is backed by Redis (not in-memory) — verify by restarting the Node process and confirming rate limit counters persist
  2. Logging out clears the cart in localStorage — verify by adding items, logging out, and confirming cart count resets to 0
  3. Email send failures are logged with enough context (recipient, template, error) that a failed transactional email is detectable within 24 hours
  4. All existing B2B flows pass smoke test checklist: login → browse catalog → add to cart → checkout → confirm "Confirmar pedido sin pago" option is present
  5. Resend account is on Starter plan ($20/month) with daily limit sufficient for B2C order volume
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Install ioredis, create Redis singleton client, rewrite rateLimit.ts with Redis INCR+EXPIRE, update all 6 call sites to async, expose Redis port in docker-compose, add REDIS_URL env vars
- [ ] 02-02-PLAN.md — Fix cart-clear-on-logout with clearCart() from Nano Stores, enhance email.ts with structured logging and 1-retry, create B2B smoke test checklist, verify Resend plan capacity

### Phase 3: B2C Product Catalog and Pricing
**Goal**: Consumers and guests see correct IVA-inclusive prices on B2C-eligible products and are shown an informative, conversion-friendly screen when they reach a professional-only product.
**Depends on**: Phase 1, Phase 2
**Requirements**: FR-1.3, FR-1.4, FR-2.1, FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-3.1, FR-3.2, FR-3.3, FR-3.4, FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-9.5, NFR-1.3, NFR-2.3, NFR-3.1, NFR-4.1
**Success Criteria** (what must be TRUE):
  1. An unauthenticated visitor browsing the catalog sees only `b2c` and `ambos` products; `b2b`-only products do not appear in listings
  2. A visitor viewing a B2C-eligible product sees the price with IVA included and the label "IVA incluido"; a logged-in professional sees their tarifa price with the label "sin IVA"
  3. A GET request to `/products-api` without authentication returns no `precio_profesional` or tarifa-related fields — only `pvp_con_iva`
  4. When a guest or particular navigates directly to a `b2b`-only product URL, they see the product name and description plus the message "Este producto es de uso profesional" with a CTA to register as professional — no 403 or blank page
  5. The registration page shows a "Particular / Profesional" type selector; selecting Particular activates the account immediately without admin validation
**Plans**: TBD

Plans:
- [ ] 03-01: Add `calculateB2CPrice()` and `calculateB2CShipping()` utilities; update `getProductos()` with `segmento` filter param; update `products-api.ts` to restrict price fields per auth state
- [ ] 03-02: Update `ProductCard.astro` and `ProductGrid.astro` to receive `userType` prop and show B2C price or B2B tarifa; add `ProfessionalLockOverlay` component for B2B-only products
- [ ] 03-03: Update registration flow with Particular/Profesional type selector and differentiated field sets and activation logic

### Phase 4: B2C Checkout and Guest Orders
**Goal**: A consumer — with or without an account — can complete a purchase end-to-end: fill a cart, check out, pay by card or Bizum, and receive an order confirmation email; professionals retain all existing checkout options.
**Depends on**: Phase 2, Phase 3
**Requirements**: FR-4.1, FR-4.2, FR-4.5, FR-4.6, FR-4.7, FR-5.1, FR-5.2, FR-5.3, FR-5.4, FR-5.5, FR-6.1, FR-6.2, FR-6.3, FR-6.4, NFR-1.2, NFR-1.4, NFR-4.2, NFR-4.3
**Success Criteria** (what must be TRUE):
  1. An unauthenticated user can reach `/checkout`, choose "Continuar como invitado", fill name/email/phone/address, and complete a Redsys card payment — receiving a confirmation email at the provided address with an order token URL
  2. A `particular` logged-in user reaches checkout and sees only tarjeta and Bizum as payment options — transferencia and "sin pago" are absent from the UI and blocked server-side
  3. A `profesional` logged-in user reaches checkout and sees "Confirmar pedido" (sin pago) and "Solicitar presupuesto" options alongside all existing payment methods
  4. The checkout order summary displays IVA breakdown (base imponible + IVA + shipping = total) and shipping cost before the payment step
  5. The checkout form includes and requires acceptance of: condiciones de venta, politica de devoluciones (14 days), and RGPD — links to each policy page are present and reachable
  6. The guest checkout form is protected by Cloudflare Turnstile; guest order confirmation URLs include a non-guessable token
**Plans**: TBD

Plans:
- [ ] 04-01: Verify Redsys guest order reconciliation behavior in staging (stateless pedidoId-in-return-URL pattern); document findings before implementation
- [ ] 04-02: Build `GuestCheckoutForm.tsx` component and `checkout-guest-api/submit.ts` endpoint; update middleware to allow unauthenticated access to `/checkout`
- [ ] 04-03: Add payment method restriction to `cart/submit.ts` (server-side enforcement per user type); add IVA breakdown to order summary; add legal checkboxes
- [ ] 04-04: Create guest `pedido-confirmado` page with token validation; implement `buildPedidoGuestHtml()` email template; create placeholder legal pages (condiciones, devoluciones, privacidad)

### Phase 5: SEO Content Infrastructure and Blog
**Goal**: The blog and product structured data infrastructure is live so that content published by Alcora immediately benefits from Article and Product schema.org markup, a working RSS feed, and correct sitemap entries.
**Depends on**: Phase 1
**Requirements**: FR-7.2, FR-7.3, FR-7.4, FR-7.5, FR-7.6, FR-8.1, FR-8.2, FR-8.3, NFR-2.2
**Success Criteria** (what must be TRUE):
  1. `/blog` renders a paginated article listing fetching from the Directus `articulos` collection; the page is server-rendered with no React islands
  2. `/blog/[slug]` renders a full article with body content, publication date, and a related products section using existing `ProductCard` components
  3. Every article page includes valid Article JSON-LD that Google Rich Results Test accepts without errors
  4. Every product detail page includes valid Product + Offer JSON-LD with the correct B2C IVA-inclusive price for public pages
  5. `/blog/rss.xml` returns a valid RSS 2.0 feed; the sitemap includes all blog URLs and product category pages with BreadcrumbList JSON-LD
**Plans**: TBD

Plans:
- [ ] 05-01: Build `lib/structuredData.ts` with typed JSON-LD builder functions (Product, Offer, Article, BreadcrumbList); add Product JSON-LD to existing product detail pages; add BreadcrumbList JSON-LD to category pages
- [ ] 05-02: Build `blog/index.astro`, `blog/[slug].astro`, `ArticleCard.astro`, `ArticleContent.astro`; wire to Directus `articulos`; add Article JSON-LD; implement RSS feed; extend sitemap with blog URLs

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5
Note: Phase 5 depends only on Phase 1 and can run in parallel with Phase 4 if needed.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Directus Schema and Data Foundation | 3/3 | Complete | 2026-02-24 |
| 2. Infrastructure and Security Prerequisites | 0/2 | Not started | - |
| 3. B2C Product Catalog and Pricing | 0/3 | Not started | - |
| 4. B2C Checkout and Guest Orders | 0/4 | Not started | - |
| 5. SEO Content Infrastructure and Blog | 0/2 | Not started | - |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FR-1.1 | Phase 1 | Complete |
| FR-1.2 | Phase 1 | Complete |
| FR-1.3 | Phase 3 | Pending |
| FR-1.4 | Phase 3 | Pending |
| FR-1.5 | Phase 1 | Complete |
| FR-2.1 | Phase 3 | Pending |
| FR-2.2 | Phase 3 | Pending |
| FR-2.3 | Phase 3 | Pending |
| FR-2.4 | Phase 3 | Pending |
| FR-2.5 | Phase 3 | Pending |
| FR-3.1 | Phase 3 | Pending |
| FR-3.2 | Phase 3 | Pending |
| FR-3.3 | Phase 3 | Pending |
| FR-3.4 | Phase 3 | Pending |
| FR-4.1 | Phase 4 | Pending |
| FR-4.2 | Phase 4 | Pending |
| FR-4.3 | Phase 1 | Complete |
| FR-4.4 | Phase 1 | Complete |
| FR-4.5 | Phase 4 | Pending |
| FR-4.6 | Phase 4 | Pending |
| FR-4.7 | Phase 4 | Pending |
| FR-5.1 | Phase 4 | Pending |
| FR-5.2 | Phase 4 | Pending |
| FR-5.3 | Phase 4 | Pending |
| FR-5.4 | Phase 4 | Pending |
| FR-5.5 | Phase 4 | Pending |
| FR-6.1 | Phase 4 | Pending |
| FR-6.2 | Phase 4 | Pending |
| FR-6.3 | Phase 4 | Pending |
| FR-6.4 | Phase 4 | Pending |
| FR-7.1 | Phase 1 | Complete |
| FR-7.2 | Phase 5 | Pending |
| FR-7.3 | Phase 5 | Pending |
| FR-7.4 | Phase 5 | Pending |
| FR-7.5 | Phase 5 | Pending |
| FR-7.6 | Phase 5 | Pending |
| FR-8.1 | Phase 5 | Pending |
| FR-8.2 | Phase 5 | Pending |
| FR-8.3 | Phase 5 | Pending |
| FR-9.1 | Phase 3 | Pending |
| FR-9.2 | Phase 3 | Pending |
| FR-9.3 | Phase 3 | Pending |
| FR-9.4 | Phase 3 | Pending |
| FR-9.5 | Phase 3 | Pending |
| NFR-1.1 | Phase 2 | Pending |
| NFR-1.2 | Phase 4 | Pending |
| NFR-1.3 | Phase 3 | Pending |
| NFR-1.4 | Phase 4 | Pending |
| NFR-1.5 | Phase 2 | Pending |
| NFR-2.1 | Phase 1 | Complete |
| NFR-2.2 | Phase 5 | Pending |
| NFR-2.3 | Phase 3 | Pending |
| NFR-3.1 | Phase 2 | Pending |
| NFR-3.2 | Phase 2 | Pending |
| NFR-3.3 | Phase 2 | Pending |
| NFR-4.1 | Phase 3 | Pending |
| NFR-4.2 | Phase 4 | Pending |
| NFR-4.3 | Phase 4 | Pending |
| NFR-4.4 | Phase 1 | Complete |
| NFR-5.1 | Phase 2 | Pending |
| NFR-5.2 | Phase 2 | Pending |
