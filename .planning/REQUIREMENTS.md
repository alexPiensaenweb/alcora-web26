# Requirements — Tienda Alcora Dual B2B+B2C

**Version:** 1.1
**Last updated:** 2026-02-24
**Source:** User questioning + 4-agent research synthesis + client feedback (Miguel Angel, 24/02/2026)

---

## Functional Requirements

### FR-1: Product Segmentation
- FR-1.1: Each product has a `segmento_venta` field: `b2b` | `b2c` | `ambos`
- FR-1.2: All existing products default to `b2b` on migration (safe default)
- FR-1.3: Catalog filters products by segment based on user type (guest/particular see b2c+ambos, professional sees b2b+ambos)
- FR-1.4: Products-API enforces segment filter server-side (not CSS-only)
- FR-1.5: Each product has a `tipo_iva` field: `21` | `10` | `4` (default 21)

### FR-2: B2C Price Display
- FR-2.1: Unauthenticated visitors and particulares see PVP con IVA (precio_base × tipo_iva)
- FR-2.2: Professionals see their tarifa price sin IVA (unchanged behavior)
- FR-2.3: B2B negotiated prices never exposed in API responses to unauthenticated users
- FR-2.4: Price calculation always server-side; client display only
- FR-2.5: Price label shows "IVA incluido" for B2C, "sin IVA" for B2B

### FR-3: Professional-Only Product UX
- FR-3.1: When a guest/particular views a b2b-only product, show product info without price
- FR-3.2: Show message: "Este producto es de uso profesional" with CTA to register as professional
- FR-3.3: Show link to B2C alternatives: "Ver productos para particulares"
- FR-3.4: Never show a 403/404 for professional-only products — always informative

### FR-4: Guest Checkout
- FR-4.1: Unauthenticated users can complete a purchase without registering
- FR-4.2: Guest provides: email, nombre, apellidos, dirección envío, teléfono
- FR-4.3: Guest data stored on `pedidos` record (guest_email, guest_nombre, guest_telefono, guest_direccion)
- FR-4.4: `pedidos.user_created` is nullable for guest orders
- FR-4.5: Guest order confirmation email sent to guest_email
- FR-4.6: Guest checkout protected by Cloudflare Turnstile CAPTCHA
- FR-4.7: Checkout page offers: "Iniciar sesión" | "Registrarse" | "Continuar como invitado"

### FR-5: B2C Checkout Flow
- FR-5.1: Particulares and guests can only pay with tarjeta or Bizum (no transferencia, no "sin pago")
- FR-5.2: Payment method restriction enforced server-side in cart/submit
- FR-5.3: Order summary shows IVA breakdown (base + IVA = total)
- FR-5.4: Checkout includes legal checkboxes: condiciones de venta, política devoluciones (14 días), RGPD
- FR-5.5: Shipping cost visible in cart and checkout before payment step

### FR-6: B2B Checkout Flow (enhanced)
- FR-6.1: Professionals see two options at checkout: "Confirmar pedido" (sin pago) and "Solicitar presupuesto"
- FR-6.2: "Confirmar pedido" creates order with estado appropriate for deferred payment (recibos, SEPA)
- FR-6.3: "Solicitar presupuesto" sends quote request for negotiation
- FR-6.4: Professionals retain all existing payment options (tarjeta, Bizum, transferencia)

### FR-7: Blog / SEO Content
- FR-7.1: `articulos` collection in Directus (titulo, slug, cuerpo, imagen, categoria_blog, fecha_publicacion, meta_description, productos_relacionados)
- FR-7.2: `/blog` index page with article listing
- FR-7.3: `/blog/[slug]` article pages with full content rendering
- FR-7.4: Related products section at bottom of articles (linking to product pages)
- FR-7.5: Article Schema.org structured data (JSON-LD)
- FR-7.6: Blog RSS feed at `/blog/rss.xml`

### FR-8: Product Structured Data
- FR-8.1: Product pages include Schema.org Product + Offer JSON-LD
- FR-8.2: Category pages include BreadcrumbList JSON-LD
- FR-8.3: Structured data uses correct price (B2C PVP con IVA for public pages)

### FR-9: Registration Flow
- FR-9.1: Registration page offers type selector: "Particular" / "Profesional"
- FR-9.2: Particulares activate automatically (no admin validation)
- FR-9.3: Profesionales require manual admin validation (unchanged)
- FR-9.4: B2C registration collects minimal fields (nombre, email, password, dirección)
- FR-9.5: B2B registration collects business fields (empresa, CIF/NIF, etc. — unchanged)

---

## Non-Functional Requirements

### NFR-1: Security
- NFR-1.1: Rate limiting backed by Redis (not in-memory) — prerequisite for guest checkout
- NFR-1.2: Turnstile CAPTCHA on guest checkout form
- NFR-1.3: Server-side validation of product segment + payment method per user type
- NFR-1.4: Guest order confirmation URLs include token (not just numeric pedidoId)
- NFR-1.5: Cart cleared properly on logout (fix existing bug before B2C launch)

### NFR-2: Performance
- NFR-2.1: No additional npm packages for core B2C features
- NFR-2.2: Blog pages server-rendered (no React islands)
- NFR-2.3: Product images: maintain existing loading patterns

### NFR-3: Compatibility
- NFR-3.1: All existing B2B flows must work unchanged after B2C additions
- NFR-3.2: B2B smoke test checklist before each B2C merge (login → browse → cart → checkout → "sin pago" available)
- NFR-3.3: Existing API endpoints backward-compatible

### NFR-4: Legal (Spain)
- NFR-4.1: B2C prices displayed with IVA included (Ley 7/1996 + Directiva UE 98/6/CE)
- NFR-4.2: 14-day return right visible before purchase (LGDCU RDL 1/2007)
- NFR-4.3: Terms of sale, privacy policy, returns policy pages accessible from checkout
- NFR-4.4: Cookie consent already implemented (vanilla-cookieconsent v3)

### NFR-5: Email
- NFR-5.1: Resend plan upgrade to Starter ($20/month) before B2C launch
- NFR-5.2: Email failure logging/alerting to prevent silent delivery failures

---

## Open Decisions (require client input)

| ID | Decision | Impact | Default if no answer |
|----|----------|--------|---------------------|
| OD-1 | B2C shipping rates | Blocks checkout implementation | 6.99€ flat, free >= 100€ |
| OD-2 | IVA rates per product category | Affects pricing accuracy | 21% for all (safe default) |
| OD-3 | Blog managed via Directus or Markdown files | Affects content workflow | Directus (client can edit) |
| OD-4 | Legal pages (condiciones venta, devoluciones) already drafted? | Blocks checkout legal checkboxes | Create placeholder pages |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FR-1.1 | Phase 1 | Complete |
| FR-1.2 | Phase 1 | Complete |
| FR-1.3 | Phase 3 | Complete |
| FR-1.4 | Phase 3 | Complete |
| FR-1.5 | Phase 1 | Complete |
| FR-2.1 | Phase 3 | Complete |
| FR-2.2 | Phase 3 | Pending |
| FR-2.3 | Phase 3 | Complete |
| FR-2.4 | Phase 3 | Complete |
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
| FR-9.1 | Phase 3 | Complete |
| FR-9.2 | Phase 3 | Complete |
| FR-9.3 | Phase 3 | Complete |
| FR-9.4 | Phase 3 | Complete |
| FR-9.5 | Phase 3 | Complete |
| NFR-1.1 | Phase 2 | Complete |
| NFR-1.2 | Phase 4 | Pending |
| NFR-1.3 | Phase 3 | Complete |
| NFR-1.4 | Phase 4 | Pending |
| NFR-1.5 | Phase 2 | Complete |
| NFR-2.1 | Phase 1 | Complete |
| NFR-2.2 | Phase 5 | Pending |
| NFR-2.3 | Phase 3 | Pending |
| NFR-3.1 | Phase 2 | Complete |
| NFR-3.2 | Phase 2 | Complete |
| NFR-3.3 | Phase 2 | Complete |
| NFR-4.1 | Phase 3 | Pending |
| NFR-4.2 | Phase 4 | Pending |
| NFR-4.3 | Phase 4 | Pending |
| NFR-4.4 | Phase 1 | Complete |
| NFR-5.1 | Phase 2 | Complete |
| NFR-5.2 | Phase 2 | Complete |

---

*Requirements derived from: PROJECT.md decisions + research SUMMARY.md findings + PITFALLS.md prevention strategies*
