# Tienda Alcora — eCommerce Dual B2B+B2C

## What This Is

Tienda online de Alcora Salud Ambiental (Zaragoza, España) que vende productos de sanidad ambiental y control de plagas. Originalmente B2B puro con catálogo público sin precios y validación manual de profesionales. Ahora evoluciona a modelo dual B2B+B2C: algunos productos pueden venderse también a particulares, con experiencia adaptada a cada tipo de cliente.

## Core Value

Los profesionales del sector deben poder hacer pedidos y presupuestos de forma ágil, mientras que los particulares deben poder comprar productos disponibles para ellos sin fricción — todo en una sola tienda con tono profesional pero inclusivo.

## Requirements

### Validated

<!-- Funcionalidad existente, confirmada en codebase map -->

- ✓ **Catálogo público** con productos, categorías, marcas y búsqueda — existing
- ✓ **Infinite scroll** en listado de productos con paginación por API — existing
- ✓ **Ficha de producto** con imágenes, descripción, categoría y marca — existing
- ✓ **Sistema de precios B2B** con descuento 3 niveles (producto > categoría > grupo global) — existing
- ✓ **Auth con cookies httpOnly** (access + refresh), auto-refresh en middleware — existing
- ✓ **Registro B2B** con validación manual por admin — existing
- ✓ **Registro B2C** con activación automática — existing
- ✓ **Carrito persistente** en localStorage (Nano Stores) con recálculo server-side — existing
- ✓ **Checkout** con selección de método de pago — existing
- ✓ **Pago con tarjeta/Bizum** via Redsys (HMAC SHA-256) — existing
- ✓ **Pago por transferencia** con IBAN visible — existing
- ✓ **Presupuestos** (crear, editar items, convertir a pedido) — existing
- ✓ **Panel admin** (pedidos, productos, usuarios, importar Excel) — existing
- ✓ **Emails transaccionales** via Resend (pedido, presupuesto, activación, bienvenida) — existing
- ✓ **CAPTCHA** Cloudflare Turnstile en formularios — existing
- ✓ **Seguridad** CSP, CSRF, rate limiting, Zod validation, sanitización — existing
- ✓ **SEO básico** con astro-seo y sitemap dinámico — existing
- ✓ **Cookie consent** con vanilla-cookieconsent v3 — existing
- ✓ **Deploy** en Plesk con PM2 + Nginx reverse proxy — existing

### Active

<!-- Nuevo scope: adaptación dual B2B+B2C -->

- [ ] Flag por producto: `b2b`, `b2c`, `ambos` — segmentación de catálogo por tipo de cliente
- [ ] Precios diferenciados: PVP con IVA para particulares, precio negociado sin IVA para profesionales
- [ ] Compra como invitado para particulares (sin registro obligatorio)
- [ ] Checkout dual: particulares pagan obligatoriamente (tarjeta/Bizum); profesionales pueden hacer pedido sin pago (recibos, SEPA) o solicitar presupuesto
- [ ] UX para productos solo-profesional cuando un particular los ve
- [ ] Home y textos con tono profesional principal pero inclusivo para particulares
- [ ] Sección blog/guías con contenido SEO evergreen (informacional + producto)
- [ ] Fichas de producto optimizadas para SEO (meta tags, structured data, contenido)
- [ ] Condiciones de envío adaptadas para B2C (por definir, Claude propone)
- [ ] Adaptación de registro: flujo diferenciado particular vs profesional
- [ ] Métodos de pago por tipo: particulares (tarjeta + Bizum), profesionales (pedido sin pago + presupuesto + transferencia)

### Out of Scope

- **PayPal** — no solicitado por el cliente, Redsys cubre tarjeta y Bizum
- **App móvil** — web responsive es suficiente
- **Marketplace multi-vendor** — Alcora es el único vendedor
- **Chat en vivo** — no prioritario para esta fase
- **Multi-idioma** — solo español
- **Stripe** — eliminado, Redsys es el procesador elegido

## Context

- **Cliente**: Alcora Salud Ambiental, empresa de Zaragoza especializada en productos de sanidad ambiental
- **Motivo del cambio**: uno de los proveedores principales permite venta a particular, lo que abre el mercado B2C para parte del catálogo
- **Situación actual**: tienda funcional en producción (tienda.alcora.es) con ~30 commits de evolución
- **Stack**: Astro 5.0 SSR + React islands + Directus 11 + PostgreSQL 16 + Redis 7 + TailwindCSS
- **Codebase map**: 7 documentos en `.planning/codebase/` con análisis completo
- **Contenido SEO**: se contrata generación de contenido evergreen para búsquedas de alto potencial
- **No todos los productos son B2C**: la segmentación es producto a producto según proveedor

## Constraints

- **Stack fijo**: Astro 5.0 + Directus 11 + Redsys — no cambiar framework ni CMS ni pasarela
- **Hosting**: Plesk con PM2 + Nginx, Docker para desarrollo — no cambiar infraestructura
- **Emails**: Resend free plan (100/día, 3.000/mes) — considerar si B2C aumenta volumen
- **Directus**: sin SDK client-side, solo fetch directo — mantener patrón existente
- **Compatibilidad**: no romper funcionalidad B2B existente durante la migración a dual

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Flag producto b2b/b2c/ambos en Directus | Segmentación flexible por producto, no por categoría | — Pending |
| PVP con IVA para B2C, sin IVA para B2B | Estándar del sector en España | — Pending |
| Particulares pagan siempre (tarjeta/Bizum) | Sin relación comercial previa, pago inmediato obligatorio | — Pending |
| Profesionales pueden pedir sin pago | Tienen relación comercial (recibos, SEPA, domiciliación) | — Pending |
| Home tono profesional pero inclusiva | El público principal sigue siendo B2B, B2C es complementario | — Pending |
| Contenido SEO evergreen precreado | Inversión única en contenido de alto valor para posicionamiento | — Pending |
| Compra como invitado para B2C | Reducir fricción, aumentar conversión de particulares | — Pending |
| Envío B2C — Claude propone | Cliente aún no ha definido tarifas para particulares | — Pending |
| UX productos solo-profesional — Claude decide | El cliente prefiere que se aplique el mejor criterio UX | — Pending |

---
*Last updated: 2026-02-24 after initialization*
