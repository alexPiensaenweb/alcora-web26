# Codebase Structure

**Analysis Date:** 2026-02-24

## Directory Layout

```
frontend/
├── src/
│   ├── pages/                    # Astro file-based routing
│   │   ├── *.astro              # Top-level pages (index, login, checkout, etc.)
│   │   ├── catalogo/            # Catalog pages (/catalogo, /catalogo/[slug])
│   │   ├── categoria/           # Category pages (/categoria/[slug])
│   │   ├── marca/               # Brand pages (/marca/[slug])
│   │   ├── cuenta/              # User account pages (protected)
│   │   ├── gestion/             # Admin pages (protected)
│   │   ├── checkout-api/        # Checkout API endpoints
│   │   ├── cuenta-api/          # Account/Auth API endpoints
│   │   ├── cart/                # Cart API endpoints
│   │   ├── products-api/        # Product search/pagination API
│   │   ├── search/              # Search API endpoints
│   │   ├── pago-api/            # Payment (Redsys) API endpoints
│   │   └── gestion-api/         # Admin API endpoints
│   ├── components/              # Reusable UI components
│   │   ├── layout/              # Header, Footer, CookieConsent (Astro)
│   │   ├── catalog/             # ProductCard, ProductGrid, CategorySidebar (Astro)
│   │   ├── cart/                # CartIcon, CartPage (React)
│   │   ├── checkout/            # CheckoutForm (React)
│   │   ├── auth/                # LoginForm, RegisterForm, UserMenu (React)
│   │   ├── admin/               # Admin panels (React)
│   │   ├── account/             # Account forms (React)
│   │   └── ui/                  # Generic UI helpers (Astro)
│   ├── layouts/                 # Page templates
│   │   ├── BaseLayout.astro     # Root layout (Header, Footer, meta, ViewTransitions)
│   │   ├── CatalogLayout.astro  # Catalog section (sidebar, breadcrumbs)
│   │   ├── AccountLayout.astro  # Account section (navigation)
│   │   └── AdminLayout.astro    # Admin section (dashboard)
│   ├── lib/                     # Server-side utilities and business logic
│   │   ├── auth.ts              # Session cookies, token refresh, user fetch
│   │   ├── directus.ts          # Directus REST API client (public/auth/admin)
│   │   ├── pricing.ts           # Discount resolution, price calculation
│   │   ├── shipping.ts          # Shipping cost logic
│   │   ├── types.ts             # TypeScript types (Directus collections + models)
│   │   ├── schemas.ts           # Zod validation schemas for all endpoints
│   │   ├── rateLimit.ts         # In-memory rate limiting
│   │   ├── email.ts             # Resend email service
│   │   ├── redsys.ts            # Redsys payment integration
│   │   ├── turnstile.ts         # Cloudflare Turnstile verification
│   │   ├── sanitize.ts          # HTML/input sanitization
│   │   └── utils.ts             # Generic helpers
│   ├── stores/                  # Nano Stores (client-side state)
│   │   ├── cart.ts              # Cart items + computed totals (localStorage)
│   │   └── auth.ts              # Auth state (user info, login flag)
│   ├── middleware.ts            # Astro middleware (auth guard, security headers)
│   ├── env.d.ts                 # TypeScript environment declarations
│   └── public/                  # Static assets (images, fonts, etc.)
├── dist/                        # Build output (generated)
│   ├── client/                  # Client-side bundle
│   └── server/                  # Server-side entry point
├── package.json                 # Dependencies (Astro, React, Nano Stores, Directus SDK)
├── tsconfig.json                # TypeScript config with path aliases
├── astro.config.mjs             # Astro config (Node adapter, React islands)
├── tailwind.config.mjs          # TailwindCSS config
├── app.js                       # Plesk/PM2 entry point (loads .env.production)
└── .env.production              # Production environment variables

migration/                       # Database migration scripts (at project root)
scripts/                         # Utility scripts (at project root)
```

## Directory Purposes

**`frontend/src/pages/`:**
- Purpose: File-based routing (each file = route)
- Contains: Page components (.astro) and API endpoints (.ts)
- Key files:
  - `index.astro` - Home page
  - `login.astro` - Login page (React LoginForm island)
  - `catalogo/index.astro` - Product catalog with pagination
  - `checkout.astro` - Checkout page with payment method selection
  - `cuenta/index.astro` - Account dashboard (protected)
  - `gestion/pedidos.astro` - Admin orders panel (protected + admin-only)

**`frontend/src/components/`:**
- Purpose: Reusable UI components (mix of Astro static and React interactive)
- Static (.astro): ProductCard, ProductGrid, CategorySidebar, Header, Footer
- Interactive (.tsx): LoginForm, CartIcon, CheckoutForm, admin panels
- Naming: PascalCase, descriptive names matching their purpose

**`frontend/src/layouts/`:**
- Purpose: Shared page templates
- Pattern: Wraps content with common header/footer/nav
- Usage: Pages import layout and nest content: `<BaseLayout><h1>Content</h1></BaseLayout>`

**`frontend/src/lib/`:**
- Purpose: Business logic and utilities (never imported in React, only server)
- Categories:
  - `auth.*` - Session/token management
  - `directus.*` - Data fetching (single source of truth)
  - `pricing.*` - Discount/price calculations
  - `*Schema.ts` - Zod validation schemas

**`frontend/src/stores/`:**
- Purpose: Client-side state management (Nano Stores)
- Pattern: Atoms and computed stores exported for React islands to use
- Storage: localStorage for cart persistence across sessions

**`frontend/dist/`:**
- Purpose: Compiled output (generated by `astro build`)
- Not committed: Listed in .gitignore
- Contains: dist/server/entry.mjs for SSR, dist/client/ for static assets

## Key File Locations

**Entry Points:**

- `frontend/app.js` - Plesk/PM2 entry point (loads env, starts server)
- `frontend/dist/server/entry.mjs` - Generated SSR server (called by app.js)
- `frontend/src/middleware.ts` - Auth guard + security headers (runs on every request)

**Configuration:**

- `frontend/package.json` - Dependencies, dev scripts
- `frontend/tsconfig.json` - TS compiler options, path aliases (@/, @components/*, etc.)
- `frontend/astro.config.mjs` - Astro SSR mode, Node adapter, security config
- `frontend/tailwind.config.mjs` - Alcora color palette (navy, action, text-muted, etc.)

**Core Logic:**

- `frontend/src/lib/auth.ts` - setAuthCookies, getSessionToken, refreshAccessToken, getCurrentUser
- `frontend/src/lib/directus.ts` - directusPublic, directusAuth, directusAdmin, collection fetchers
- `frontend/src/lib/pricing.ts` - resolveDiscount, calculatePrice (implements 3-tier hierarchy)
- `frontend/src/lib/schemas.ts` - All Zod validation schemas (login, register, pedido, etc.)
- `frontend/src/pages/cart/submit.ts` - Order submission (re-calculates prices server-side)

**Testing & Data:**

- `frontend/src/lib/types.ts` - TypeScript interfaces for all data models
- `migration/` - Database schema and initialization scripts
- `scripts/` - Utility scripts for bulk operations

## Naming Conventions

**Files:**

- Pages: `index.astro`, `[slug].astro`, `[id]/nested.ts`
- Components: `ProductCard.astro`, `LoginForm.tsx` (PascalCase)
- API routes: `login.ts`, `submit.ts`, `[id].ts` (camelCase, descriptive)
- Libraries: `auth.ts`, `directus.ts`, `pricing.ts` (camelCase)
- Stores: `cart.ts`, `auth.ts` (camelCase)
- Schema files: `schemas.ts` or `loginSchema` (camelCase with Zod convention)

**Directories:**

- Component categories: `catalog/`, `auth/`, `admin/`, `layout/` (kebab-case, singular or plural)
- API category routes: `cart/`, `cuenta-api/`, `gestion-api/` (kebab-case)
- Stores: Always `stores/` (plural)

**TypeScript:**

- Interfaces: `DirectusUser`, `Producto`, `CartItem` (PascalCase)
- Types: `EstadoPedido`, `TipoPedido` (PascalCase)
- Functions: `addToCart`, `resolveDiscount`, `calculatePrice` (camelCase)
- Constants: `COOKIE_SESSION`, `FREE_SHIPPING_THRESHOLD` (UPPER_SNAKE_CASE)
- React components: `export default function CartIcon() {}` (PascalCase function name)

## Where to Add New Code

**New Feature (e.g., wishlist):**
- Primary code: `frontend/src/lib/wishlist.ts` (business logic)
- Store: `frontend/src/stores/wishlist.ts` (client state, if needed)
- Components: `frontend/src/components/catalog/WishlistButton.tsx` (React island)
- Page: `frontend/src/pages/mi-lista.astro` (SSR page with WishlistPage React island)
- API: `frontend/src/pages/wishlist-api/add.ts`, `remove.ts` (if POST needed)
- Schema: Add `wishlistSchema` to `frontend/src/lib/schemas.ts`

**New Component/Module:**
- Pure Astro (static): `frontend/src/components/[category]/ComponentName.astro`
- React interactive: `frontend/src/components/[category]/ComponentName.tsx` with `client:load`
- Shared logic: Create utility in `frontend/src/lib/` or generic component in `frontend/src/components/ui/`

**Utilities:**
- Server-side only: `frontend/src/lib/[name].ts`
- Shared with React: Still in `frontend/src/lib/` but ensure no server-only imports (fs, directus admin tokens, etc.)
- Client-side only: `frontend/src/stores/` (if state) or `frontend/src/components/` (if component-specific)

**API Endpoints:**
- Location: `frontend/src/pages/[category]-api/[endpoint].ts`
- Pattern: Exported `POST: APIRoute` or `GET: APIRoute` functions
- Validation: Use Zod schema from `frontend/src/lib/schemas.ts`, call `validateSchema(schema, body)`
- Auth: Check `locals.user` and `locals.token` for protected endpoints
- Response: Return JSON wrapped in new Response(), set "Content-Type": "application/json"

**Validation:**
- Framework: Zod (imported from 'zod')
- Location: `frontend/src/lib/schemas.ts`
- Usage: `const validation = validateSchema(schema, input); if (!validation.valid) return error`

## Special Directories

**`frontend/.astro/`:**
- Purpose: Generated Astro cache and temporary files
- Generated: Yes
- Committed: No (in .gitignore)

**`frontend/dist/`:**
- Purpose: Build output (SSR server + client assets)
- Generated: Yes (`astro build`)
- Committed: No (in .gitignore)

**`frontend/node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (`npm install`)
- Committed: No (in .gitignore)

**`frontend/public/`:**
- Purpose: Static assets (served as-is, never processed)
- Files: Logo, favicon, placeholder images
- URL access: `/filename` → served directly

**`frontend/src/env.d.ts`:**
- Purpose: TypeScript environment declarations for Astro globals
- Auto-generated: On `astro dev`/`build`
- Do not edit manually (Astro updates it automatically)

**`scripts/` (project root):**
- Purpose: Utility scripts for batch operations
- Examples: Product imports, user bulk updates
- Note: Not npm scripts; run with `node` or `npx tsx`

**`migration/` (project root):**
- Purpose: Database schema initialization and migrations
- Contains: SQL files, seeding scripts
- Run: Manual execution during deployment

## Import Aliases

Configured in `frontend/tsconfig.json`:

- `@/*` → `src/*` (root utilities, types, lib)
- `@components/*` → `src/components/*` (components)
- `@layouts/*` → `src/layouts/*` (layouts)
- `@lib/*` → `src/lib/*` (lib utilities)
- `@stores/*` → `src/stores/*` (stores)

**Usage in components:**
```typescript
import { $cartCount } from "@stores/cart";
import { calculatePrice } from "@lib/pricing";
import ProductCard from "@components/catalog/ProductCard.astro";
```

---

*Structure analysis: 2026-02-24*
