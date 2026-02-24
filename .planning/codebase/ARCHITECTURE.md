# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** Astro SSR hybrid with React islands and Nano Stores client state

**Key Characteristics:**
- Server-side rendering (Astro 5.0 + Node.js adapter) for SEO and initial load
- React islands (client:load) for interactive components (forms, cart, admin panels)
- httpOnly cookies for auth tokens (CSRF-safe, server-managed)
- Nano Stores for persistent client state (cart with localStorage)
- Directus REST API for data (no SDK client-side, only server-side)
- B2B model: public catalog without prices, manual registration validation
- Dynamic pricing engine: three-tier discount hierarchy (product > category > group)

## Layers

**Middleware (Security & Auth):**
- Location: `frontend/src/middleware.ts`
- Purpose: Guard protected routes, validate sessions, refresh tokens, inject user into locals
- Contains: CSRF protection, origin validation, cache control headers, security headers (CSP, HSTS, etc.)
- Depends on: Auth helpers (`frontend/src/lib/auth.ts`), Directus API
- Used by: All routes via Astro SSR

**API Routes (Backend Logic):**
- Location: `frontend/src/pages/[category]-api/[endpoint].ts`
- Purpose: Server-side business logic separated from page rendering
- Contains: Cart submission, payment initiation, admin operations, user registration, order management
- Depends on: Directus admin token, Nano Stores store (cart only), pricing/shipping engines
- Used by: React island components via POST/GET requests

**Astro Pages (SSR Rendering):**
- Location: `frontend/src/pages/*.astro`
- Purpose: Server-rendered HTML with layout composition
- Contains: Product pages, category pages, checkout UI, admin dashboard UI, account pages
- Depends on: Directus API (public), pricing engine, middleware (locals.user)
- Used by: Browser (direct navigation or ViewTransitions)

**React Islands (Client Interactivity):**
- Location: `frontend/src/components/[category]/*.tsx`
- Purpose: Client-side interactivity for forms, cart management, product filtering
- Contains: LoginForm, RegisterForm, CartIcon, CartPage, CheckoutForm, admin panels
- Depends on: Nano Stores, fetch API to `/[category]-api/` endpoints
- Used by: Astro pages via `client:load` directive

**Shared Libraries:**
- Location: `frontend/src/lib/*.ts`
- Purpose: Business logic and utilities shared across layers
- Contains:
  - `auth.ts` - Session cookie management, token refresh, user fetching
  - `directus.ts` - Server-side Directus fetching (public, auth, admin modes)
  - `pricing.ts` - Discount resolution and price calculation
  - `shipping.ts` - Shipping cost logic
  - `types.ts` - TypeScript types (Directus collections + frontend models)
  - `schemas.ts` - Zod validation schemas for all API endpoints
  - `rateLimit.ts` - In-memory rate limiting per client IP
  - `email.ts` - Email service via Resend
  - `turnstile.ts` - Cloudflare Turnstile CAPTCHA verification
  - `sanitize.ts` - HTML/input sanitization

**Stores (Client State):**
- Location: `frontend/src/stores/*.ts`
- Purpose: Client-side persistent state for React islands
- Contains:
  - `cart.ts` - Nano Stores with localStorage persistence for cart items, computed totals
  - `auth.ts` - Client-side auth state (user info, login status - tokens in httpOnly cookies only)
- Depends on: @nanostores/persistent, @nanostores/react
- Used by: React islands only (not server-side)

**Layouts (UI Structure):**
- Location: `frontend/src/layouts/*.astro`
- Purpose: Page template composition for different sections
- Contains:
  - `BaseLayout.astro` - Root layout with Header, Footer, ViewTransitions
  - `CatalogLayout.astro` - Catalog pages with CategorySidebar
  - `AccountLayout.astro` - Account/account pages with navigation
  - `AdminLayout.astro` - Admin section with management panels
- Depends on: Components, Header, Footer, Directus data
- Used by: All pages via `<Layout>` wrapper

**Components (Reusable UI):**
- Location: `frontend/src/components/[category]/*.astro` or `*.tsx`
- Categories:
  - `layout/` - Header, Footer, CookieConsent (static Astro)
  - `catalog/` - ProductCard, ProductGrid, CategorySidebar (static Astro templates)
  - `cart/` - CartIcon (React island), CartPage (React island)
  - `checkout/` - CheckoutForm (React island with payment methods)
  - `auth/` - LoginForm, RegisterForm, UserMenu (React islands)
  - `admin/` - PedidoAdminPanel, ProductosAdminPanel, UsuariosAdminPanel (React islands)
  - `account/` - ProfileForm (React island)
  - `ui/` - Breadcrumb, generic UI helpers (Astro)

## Data Flow

**Product Catalog View (SSR):**

1. Browser requests `/catalogo`
2. Middleware verifies user (injects user into locals)
3. Astro page fetches products from Directus (public, cached)
4. If user logged in: fetch tarifas for user's grupo_cliente
5. Calculate display prices (apply discounts server-side)
6. Render HTML with ProductCard components + InfiniteProductGrid React island
7. InfiniteProductGrid uses `/products-api` endpoint for pagination
8. Browser receives HTML, React hydrates for scroll-triggered pagination

**Order Submission Flow:**

1. User clicks "Pedir" in CheckoutForm (React island)
2. CheckoutForm sends POST to `/cart/submit` with cart items + metadata
3. Middleware validates user + CSRF origin
4. API route re-calculates prices server-side (never trusts client)
5. Validates each product exists + applies permissions (professional-only check)
6. Resolves discounts based on user's grupo_cliente
7. Creates pedido + pedido_items in Directus (via admin token)
8. Sends email notifications (except for card/bizum - sent after payment webhook)
9. Returns { pedidoId, total, estado }
10. React navigates to `/pago/[pedidoId]` (Redsys payment) or success page

**Payment Flow (Card/Bizum):**

1. User selects tarjeta/bizum payment, enters /pago/[pedidoId]
2. CheckoutForm posts to `/pago-api/initiate`
3. API calls Redsys HMAC signature generation (redsys-easy library)
4. Returns form data for hidden redirect to sis-t.redsys.es (test) or sis.redsys.es (prod)
5. User completes payment at Redsys
6. Redsys POST to `/pago-api/webhook` with signed response
7. Webhook validates HMAC signature, updates pedido estado to "pagado"
8. Sends payment confirmation emails
9. Browser redirected to success page

**Admin Panel Data Flow:**

1. Admin posts to `/gestion-api/pedidos/[id]/estado` or `/productos/crear`
2. Middleware verifies isAdmin flag
3. API route validates data, updates Directus via admin token
4. Calls `purgeDirectusCache()` to ensure fresh reads
5. React admin panel polls or refetches state

**State Management:**

- **Server State:** Directus (source of truth for products, orders, users, pricing)
- **Session State:** httpOnly cookies (tokens never exposed to JavaScript)
- **Client State:** Nano Stores + localStorage (cart only - prices user-specific, cleared on logout)
- **Cache:** Directus Redis cache (bypassed on writes via cache-bust timestamps)

## Key Abstractions

**Pricing Engine:**
- Purpose: Resolve dynamic discounts based on user grupo_cliente and product/category
- Examples: `frontend/src/lib/pricing.ts`
- Pattern: Three-tier fallback (product-specific > category-specific > global group)
- Result: Consistent price calculation server-side + client display

**Directus API Client:**
- Purpose: Unified Directus access with three auth modes
- Examples: `frontend/src/lib/directus.ts`
- Pattern: Wrapper functions for collection-specific queries (getProductos, getCategorias, getTarifasForGrupo, etc.)
- Auth modes:
  - `directusPublic()` - No auth, cached
  - `directusAuth(token)` - User token, cache-busted
  - `directusAdmin()` - Admin token (server-side only), cache-busted

**Cart Store (Nano Stores):**
- Purpose: Persistent client-side cart without server-side session
- Examples: `frontend/src/stores/cart.ts`
- Pattern: persistentAtom with JSON encode/decode, computed derived values
- Computed: $cartCount, $cartSubtotal, $cartTotal, $shippingCost

**Auth Cookies:**
- Purpose: httpOnly, secure session tokens
- Examples: `frontend/src/lib/auth.ts`
- Pattern: setAuthCookies/clearAuthCookies helpers, 7-day refresh token expiry
- Refresh: Automatic in middleware if access token expired

**Rate Limiting:**
- Purpose: Protect API endpoints from abuse
- Examples: `frontend/src/lib/rateLimit.ts`
- Pattern: In-memory Map<key, { count, resetAt }> per client IP
- Cleanup: 5-minute interval timer removes expired entries

## Entry Points

**Web Server (Production):**
- Location: `frontend/app.js`
- Triggers: PM2/Plesk Node.js process manager
- Responsibilities: Load .env.production, start Astro SSR on PORT/HOST

**SSR Server Runtime:**
- Location: `frontend/dist/server/entry.mjs` (generated by `astro build`)
- Triggers: app.js import or direct node execution
- Responsibilities: HTTP server, middleware execution, page/API routing

**Page Routes:**
- Location: `frontend/src/pages/*.astro`
- Triggers: Browser navigation or ViewTransitions
- Responsibilities: Fetch data server-side, render HTML

**API Endpoints:**
- Location: `frontend/src/pages/[category]-api/*.ts`
- Triggers: fetch() from React island or form submission
- Responsibilities: Validate request, execute business logic, return JSON

**Middleware:**
- Location: `frontend/src/middleware.ts`
- Triggers: Every incoming request before route handler
- Responsibilities: Auth validation, user injection, route guards, security headers

## Error Handling

**Strategy:** Try-catch with specific error messages for user feedback, console logging for debugging

**Patterns:**

- **API Endpoints:** Return JSON with { error: "message" } and appropriate HTTP status
  - 400: Validation failed
  - 401: Not authenticated
  - 403: Not authorized (CSRF, permission denied)
  - 429: Rate limited
  - 500: Server error

- **Directus Fetches:** Catch errors, log, return null or empty array for graceful degradation

- **React Components:** Error boundaries NOT used; forms show inline validation errors via Zod

- **Async Operations:** All Promise-based operations wrapped in try-catch

## Cross-Cutting Concerns

**Logging:**
- Strategy: console.log/warn/error (no external logger, relies on PM2 log files)
- When: Auth failures, API errors, cache operations, payment webhooks

**Validation:**
- Framework: Zod schemas for all API inputs
- Location: `frontend/src/lib/schemas.ts`
- Pattern: validateSchema() helper that returns { valid, data, error }
- Client-side: React controlled forms with inline validation

**Authentication:**
- Framework: Directus JWT tokens (access + refresh)
- Location: `frontend/src/lib/auth.ts`, `frontend/src/middleware.ts`
- Pattern: httpOnly cookies for tokens, automatic refresh, scope detection (admin via role.policies)
- Tokens stored: NEVER in localStorage or JS-accessible variables

**Authorization:**
- Checks: isAdmin flag (from role policies), grupo_cliente (user group), status (active/pending)
- Location: Middleware (route guards), API endpoints (data access), pages (conditional rendering)
- Pattern: Middleware blocks unauthorized page access; endpoints re-validate before data mutation

**CSRF Protection:**
- Method: Origin header validation (Astro/Node CORS-like)
- Exempt: `/pago-api/webhook` (Redsys webhook, protected by HMAC signature instead)
- Location: `frontend/src/middleware.ts` lines 44-74

**Security Headers:**
- CSP: Allows 'self', Turnstile scripts, Redsys iframes, data: URIs
- HSTS: 1 year for production only
- X-Frame-Options: DENY (clickjacking protection)
- Permissions-Policy: Restricts camera, microphone, geolocation; allows payment API

**Cache Control:**
- Dynamic pages (user-specific): no-store, no-cache, must-revalidate (Middleware sets)
- Static assets: Astro default (versioned in dist/)
- Directus API: Redis cache with time-based expiry; bypassed on writes via _t parameter

---

*Architecture analysis: 2026-02-24*
