# Coding Conventions

**Analysis Date:** 2026-02-24

## Naming Patterns

**Files:**
- Astro components: PascalCase with `.astro` extension (e.g., `ProductCard.astro`, `CartPage.astro`)
- React components: PascalCase with `.tsx` extension (e.g., `LoginForm.tsx`, `CheckoutForm.tsx`)
- Utility/library files: camelCase with `.ts` extension (e.g., `pricing.ts`, `directus.ts`, `auth.ts`)
- API route files: camelCase with descriptive names in path directories (e.g., `/cuenta-api/login.ts`, `/cart/submit.ts`)
- Store files: camelCase with descriptive prefix and `.ts` extension (e.g., `cart.ts`, `auth.ts`)

**Functions:**
- camelCase for all functions: `calculatePrice()`, `resolveDiscount()`, `getDirectusUrl()`
- Prefix fetch functions with `get` for queries: `getCategorias()`, `getProductos()`, `getProductoBySlug()`
- Async functions named normally (no "async" prefix): `loginWithCredentials()`, `refreshAccessToken()`
- Constants exported as UPPER_SNAKE_CASE: `COOKIE_SESSION`, `PROTECTED_ROUTES`, `FREE_SHIPPING_THRESHOLD`

**Variables:**
- camelCase: `items`, `tarifas`, `grupoCliente`, `isLoggedIn`, `métodoPago`
- Store atoms prefixed with `$`: `$cartItems`, `$isLoggedIn`, `$currentUser`
- Boolean variables prefixed with `is` or `has`: `isAdmin`, `isParticular`, `hasMore`
- Types for enums/unions use descriptive names: `MetodoPago`, `EstadoPedido`, `TipoPedido`

**Types/Interfaces:**
- PascalCase for all types and interfaces: `CartItem`, `DirectusUser`, `Producto`, `TarifaEspecial`
- Type/interface names match conceptual domain: `Categoria`, `Marca`, `Pedido`, `PedidoItem`
- Generic utility types with `Props` suffix: `CheckoutFormProps`, `NuevoProductoFormProps`

## Code Style

**Formatting:**
- No explicit formatter configured (Prettier not in package.json)
- Observed patterns: 2-space indentation, semicolons used consistently
- Line length: appears to be ~100-120 characters based on samples
- String quotes: double quotes for HTML attributes, single quotes in some JS literals (inconsistent)

**Linting:**
- No ESLint configuration file detected (no .eslintrc.*)
- TypeScript strict mode enabled in `tsconfig.json` via `extends: "astro/tsconfigs/strict"`
- Astro uses React JSX as primary templating with strict mode

## Import Organization

**Order (observed pattern):**
1. External packages (React, Astro, Directus, stores, utilities): `import { useState } from "react"`
2. Relative imports from lib: `import { resolveDiscount } from "../../lib/pricing"`
3. Relative imports from stores: `import { $cartList, addToCart } from "../../stores/cart"`
4. Type imports: `import type { Producto, TarifaEspecial } from "../../lib/types"`

**Path Aliases (configured in tsconfig.json):**
```json
"@/*": ["src/*"],
"@components/*": ["src/components/*"],
"@layouts/*": ["src/layouts/*"],
"@lib/*": ["src/lib/*"],
"@stores/*": ["src/stores/*"]
```

Usage example: `import { formatCurrency } from "@lib/pricing"` (not commonly used in codebase; relative imports preferred)

## Error Handling

**Patterns:**
- Async functions wrap fetches in try-catch blocks
- API routes catch JSON parse errors separately before schema validation
- Directus fetch errors throw with descriptive message including status code: `throw new Error("Directus GET /items/productos: 404 - Not Found")`
- Login errors caught separately to provide specific user-friendly messages (suspended vs invalid credentials)
- Non-critical errors logged to console.error() with context: `console.error("Products API error:", error instanceof Error ? error.message : "Unknown")`
- Email sending errors logged but not returned (non-blocking): `try { await sendMail(...) } catch (emailErr) { console.error(...) }`
- Rate limit errors return specific error response with retry-after header

**Response patterns in API routes:**
- Success: `new Response(JSON.stringify({ success: true, data: {...} }), { status: 200, headers: { "Content-Type": "application/json" } })`
- Validation error: `new Response(JSON.stringify({ error: "message" }), { status: 400 })`
- Auth required: `new Response(JSON.stringify({ error: "Debe iniciar sesion..." }), { status: 401 })`
- Not found: redirect or 404 in Astro pages via `Astro.redirect()`
- Server error: `new Response(JSON.stringify({ error: "Error al procesar..." }), { status: 500 })`

## Logging

**Framework:** `console` only - no dedicated logging library

**Patterns:**
- Errors logged with context: `console.error("[catalogo] Error fetching products:", error)`
- API errors: `console.error("Login error:", err instanceof Error ? err.message : "Unknown")`
- Non-critical warnings: `console.warn("[directus] Cache purge failed:", err.message)`
- Info-level: No console.log statements observed in production code (kept in comments for context)

**Logging locations:**
- `src/lib/directus.ts` - API errors, cache purge warnings
- `src/middleware.ts` - Authentication and routing errors
- API routes - Request processing errors
- Astro pages - Data fetching errors in try-catch blocks

## Comments

**When to Comment:**
- JSDoc blocks above exported functions describing purpose and parameters
- Inline comments for non-obvious logic (e.g., pricing priority algorithm)
- Comments explaining business rules: "// Detect admin: check role.admin_access (Directus 10) OR role.policies[].policy.admin_access (Directus 11)"
- Comments explaining why certain code exists (e.g., cache busting, CSRF handling)
- TODO/FIXME rarely used; typically inline documentation

**JSDoc/TSDoc:**
Minimal JSDoc usage observed. Example from `src/lib/pricing.ts`:
```typescript
/**
 * Pricing Engine - Calcula precios con descuentos por grupo de cliente
 *
 * Prioridad de descuento:
 * 1. Tarifa especifica para el producto
 * 2. Tarifa por categoria del producto
 * 3. Tarifa global del grupo (producto y categoria = null)
 */
```

Comments at file header document algorithm/domain logic rather than function-level JSDoc.

## Function Design

**Size:** Functions generally 20-100 lines; complex functions (like `handleSubmit` in forms) can reach 200+ lines in React components due to state management and UI render

**Parameters:**
- Prefer parameter objects for functions with 3+ parameters: `{ items, direccion_envio, metodo_pago, notas_cliente }`
- Type parameters explicitly: `function set(field: string, value: string)`
- Optional parameters use `?`: `tarifas?: TarifaEspecial[]`, `limit?: number`

**Return Values:**
- Explicit return types on all functions: `Promise<Pedido | null>`, `{ data: Producto[]; meta: { total_count: number } }`
- API routes return `Response` object with proper headers
- Utility functions return primitives or typed objects
- Async functions that may fail return `null` or throw (not optional)

**Async patterns:**
- API routes use top-level try-catch; don't use `.catch()`
- Schema validation happens immediately after JSON parse: validation before business logic
- Rate limiting checked before request processing
- Fallback operations (e.g., try user auth, fallback to admin token) use nested try-catch

## Module Design

**Exports:**
- Named exports for utility functions: `export function calculatePrice() {}`
- Default exports for components (Astro/React): `export default function LoginForm() {}`
- Type exports using `export type`: `export type EstadoPedido = "solicitado" | ...`
- Store exports are named: `export const $cartItems = ...`, `export function addToCart() {}`

**Barrel Files:**
- Not heavily used; most imports are direct from modules
- `src/lib/types.ts` serves as centralized type definitions
- Libraries grouped functionally: `lib/auth.ts`, `lib/pricing.ts`, `lib/directus.ts`

**File structure for related functionality:**
- Authentication: `src/lib/auth.ts` (cookie/token management), `src/stores/auth.ts` (client state), `src/pages/cuenta-api/login.ts` (API route)
- Pricing: `src/lib/pricing.ts` (calculation logic), used in Astro pages and React components
- Cart: `src/stores/cart.ts` (Nano Store), `src/components/cart/CartPage.tsx` (UI), `src/pages/cart/submit.ts` (API)

## Naming Conventions for Business Logic

**Database/Directus names (snake_case origin) preserved in code:**
- `precio_base`, `precio_unitario`, `costo_envio`, `grupo_cliente`, `razon_social`
- `direccion_envio`, `direccion_facturacion`
- `metodo_pago` (payment method)
- `fecha_creacion` becomes snake_case in API but camelCase in client code when possible

**Spanish language used for:**
- UI text: "Finalizar Compra", "Solicitar Presupuesto"
- Domain entities: "Presupuesto", "Pedido" (not translated to "Quote" or "Order")
- Function parameters and variable names in API business logic

**English used for:**
- Technical function names: `calculatePrice()`, `resolveDiscount()`, `validateSchema()`
- Astro/React component names
- Library/utility names

## Astro-Specific Patterns

**Component patterns:**
- Frontmatter (server code) uses strict TypeScript: all imports from lib/stores must be typed
- Props interface pattern: `interface Props { product: Producto; price?: number | null; }`
- Access props via destructuring: `const { product, price } = Astro.props`
- Client island registration: `<Component client:load />` for interactive React components
- Lazy loading: `const Turnstile = lazy(() => import("react-turnstile"))` for client-only libraries

**Layout patterns:**
- `BaseLayout.astro` wraps all pages with header, footer, metadata
- `CatalogLayout.astro` extends BaseLayout with sidebar
- `AccountLayout.astro` extends BaseLayout with account navigation
- `AdminLayout.astro` extends BaseLayout with admin panel
- Props passed to React islands: `<CartPage client:load isLoggedIn={isLoggedIn} grupoCliente={grupoCliente} />`

## React Component Patterns

**Hooks:**
- `useState()` for form state and UI state
- `useStore()` from `@nanostores/react` for global state (cart, auth)
- `useRef()` for file input refs in forms
- No custom hooks defined (logic kept in components)

**Props:**
- Explicit interfaces for component props: `interface CheckoutFormProps { user: {...} }`
- Props typed as interfaces (not Record types)

**Render logic:**
- Conditional rendering using ternary: `items.length === 0 ? <EmptyState /> : <CartList />`
- Complex conditions broken into variables: `const isParticular = grupoCliente === "particular"`
- Form submission handlers named `handleSubmit()`, `handleFileSelect()`, etc.
- Event handlers use arrow functions: `onClick={() => updateQuantity(...)}`

---

*Convention analysis: 2026-02-24*
