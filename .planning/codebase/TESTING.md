# Testing Patterns

**Analysis Date:** 2026-02-24

## Test Framework

**Runner:**
- Not detected - no test framework configured
- `package.json` contains no testing dependencies (Jest, Vitest, Playwright, etc.)
- No test configuration files found (jest.config.*, vitest.config.*)

**Assertion Library:**
- Not applicable - no testing framework installed

**Run Commands:**
- No test scripts in `package.json`
- Development: `npm run dev` (Astro dev server)
- Build: `npm run build` (Astro production build)
- Preview: `npm run preview` (preview production build)

## Test File Organization

**Status:** No test files present in codebase

**Current Situation:**
- Zero test coverage across all modules
- No `.test.ts`, `.spec.ts`, `.test.tsx`, or `.spec.tsx` files found
- No test directories (`__tests__`, `tests/`, `test/`)

## Testing Gap Analysis

### Critical Untested Areas

**1. API Routes (High Priority)**
- Location: `src/pages/cuenta-api/`, `src/pages/cart/`, `src/pages/gestion-api/`, `src/pages/pago-api/`
- Current state: Complex business logic with no unit tests
- What's not tested:
  - Authentication flow (`src/pages/cuenta-api/login.ts`): rate limiting, credential validation, token issuance, suspended user detection
  - Cart submission (`src/pages/cart/submit.ts`): price recalculation, inventory validation, shipping cost calculation, payment method routing
  - Form validation: schema validation paths, edge cases, malformed input handling
  - Error responses: proper HTTP status codes, error message formats
  - Rate limiting: enforcement, retry-after headers
  - CSRF protection middleware

**Example untested API logic (from `src/pages/cart/submit.ts`):**
```typescript
// No tests for:
// - Price recalculation with tarifas
// - Professional-only product restrictions
// - Shipping cost calculation logic
// - Order status determination based on payment method
// - Email notification fallback behavior
// - Database write consistency across pedidos + pedidos_items
```

**2. Pricing Engine (High Priority)**
- Location: `src/lib/pricing.ts`
- Current state: Critical business logic, zero tests
- What's not tested:
  - `resolveDiscount()`: priority order (product > category > global)
  - `calculatePrice()`: rounding behavior, discount boundary conditions
  - Discount application with edge cases (0%, 100%, invalid percentages)
  - Integration in product rendering

**Example untested function (from `src/lib/pricing.ts`):**
```typescript
export function calculatePrice(
  precioBase: number,
  descuentoPorcentaje: number
): number {
  const discount = Math.max(0, Math.min(100, descuentoPorcentaje));
  return Math.round(precioBase * (1 - discount / 100) * 100) / 100;
}
// No tests for: rounding at different scales, floating point precision
```

**3. Authentication & Authorization**
- Location: `src/lib/auth.ts`, `src/middleware.ts`
- Current state: Security-critical code, no tests
- What's not tested:
  - Cookie serialization/deserialization
  - Token refresh logic and expiration handling
  - Admin detection from Directus role policies
  - Protected route access control
  - Session persistence across requests
  - CSRF protection on POST/PUT/DELETE

**4. Directus Integration**
- Location: `src/lib/directus.ts`
- Current state: Data layer with no tests
- What's not tested:
  - Error handling for failed API calls
  - Cache busting with `_t` parameter
  - Field selection queries
  - Filter and search parameter construction
  - Response parsing for null/empty bodies
  - Rate limit resilience

**5. Form Validation**
- Locations: `src/lib/schemas.ts`, `src/pages/cuenta-api/register.ts`, React forms
- Current state: Zod schema validation, no tests
- What's not tested:
  - Email format validation
  - Password strength requirements
  - Address field formatting
  - CIF/NIF validation (Spanish tax ID)
  - Phone number validation
  - Turnstile token verification

**6. React Component Logic**
- Locations: `src/components/auth/LoginForm.tsx`, `src/components/cart/CartPage.tsx`, `src/components/checkout/CheckoutForm.tsx`
- Current state: State management, no tests
- What's not tested:
  - Form submission error handling
  - State transitions (loading → success/error)
  - Cart updates reflected in UI
  - Conditional rendering based on auth state
  - Open redirect prevention in LoginForm

**Example untested React logic (from `src/components/auth/LoginForm.tsx`):**
```typescript
// No tests for:
// - Token error handling
// - setUser() store update
// - Redirect logic (admin vs user vs custom redirect)
// - Turnstile token expiration
// - Network error recovery
```

**7. Store State Management (Nano Stores)**
- Locations: `src/stores/cart.ts`, `src/stores/auth.ts`
- Current state: Observable stores, no tests
- What's not tested:
  - Cart persistence to localStorage
  - Store updates triggered by mutations
  - Computed store values ($cartTotal, $cartSubtotal, $shippingCost)
  - Cart clearing on logout
  - Quantity updates and item removal

**Example untested store logic (from `src/stores/cart.ts`):**
```typescript
export const $cartList = computed($cartItems, (items) => items);
export const $cartSubtotal = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
);
// No tests for: computed value update triggers, derivation correctness
```

### Medium Priority Untested Areas

**8. Admin Panel Components**
- Locations: `src/components/admin/*.tsx`
- Largest file: `ProductosAdminPanel.tsx` (860 lines)
- What's not tested: CRUD operations, form submission, error handling, data table interactions

**9. Middleware Security**
- Location: `src/middleware.ts` (222 lines)
- What's not tested:
  - CSRF origin validation
  - Route protection enforcement
  - Admin access checks
  - Security headers attachment
  - Cache control headers on dynamic pages

**10. Email Templates**
- Location: `src/lib/email.ts`
- What's not tested: HTML rendering, variable interpolation, missing email addresses

### Lower Priority (No Async/External Deps)

**11. Utility Functions**
- `src/lib/utils.ts`: date formatting, status labels, color mapping
- `src/lib/shipping.ts`: shipping cost calculation
- `src/lib/sanitize.ts`: HTML sanitization
- Risk: Low (deterministic, testable in isolation)

## Recommended Testing Strategy

### Phase 1: Foundation (Weeks 1-2)
1. **Install testing framework:**
   ```bash
   npm install --save-dev vitest @vitest/ui happy-dom
   ```
   - Vitest chosen for Astro compatibility and TypeScript support

2. **Add test scripts to `package.json`:**
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:coverage": "vitest --coverage"
   ```

3. **Create test configuration `vitest.config.ts`:**
   ```typescript
   import { defineConfig } from 'vitest/config';
   import { getViteConfig } from 'astro/config';

   export default defineConfig(
     getViteConfig({
       test: {
         globals: true,
         environment: 'happy-dom',
       },
     })
   );
   ```

### Phase 2: Critical Path (Weeks 3-4)
1. **Pricing engine tests** (`src/lib/pricing.ts`)
   - 10-15 unit tests covering discount resolution and price calculation
   - Edge cases: 0 products, 100% discount, rounding

2. **API route tests** (`src/pages/cart/submit.ts`, `src/pages/cuenta-api/login.ts`)
   - Mock Directus responses
   - Test validation paths
   - Rate limit behavior

3. **Auth flow tests** (`src/lib/auth.ts`)
   - Cookie handling
   - Token refresh
   - Current user parsing

### Phase 3: Integration (Weeks 5-6)
1. **Store tests** (Nano Stores)
   - Cart state mutations
   - Persistence to localStorage
   - Computed values

2. **Middleware tests** (CSRF, auth, routing)
   - Protected route access
   - Security header attachment

3. **Admin panel component tests** (snapshot/integration)

## Test Structure (When Implemented)

**Recommended directory layout:**
```
frontend/
├── src/
│   ├── lib/
│   │   ├── pricing.ts
│   │   └── pricing.test.ts          # Unit test
│   ├── pages/
│   │   ├── cart/
│   │   │   ├── submit.ts
│   │   │   └── submit.test.ts       # API route test
│   │   └── cuenta-api/
│   │       ├── login.ts
│   │       └── login.test.ts        # API route test
│   └── stores/
│       ├── cart.ts
│       └── cart.test.ts             # Store test
└── vitest.config.ts
```

**Test file colocation:** Unit tests live alongside source files with `.test.ts` suffix

## Mocking Strategy (When Implemented)

**External APIs (Directus):**
```typescript
// Mock getProductos, getTarifasForGrupo, etc. using vitest.mock()
vi.mock('../../lib/directus', () => ({
  getProductos: vi.fn(),
  getTarifasForGrupo: vi.fn(),
  // ...
}));
```

**Browser APIs (localStorage):**
```typescript
// Use happy-dom environment which provides localStorage stub
// Mock localStorage for Nano Store persistence tests
```

**HTTP requests:**
```typescript
// Mock fetch() for API route tests
global.fetch = vi.fn();
```

**What NOT to mock:**
- Pure functions like `calculatePrice()`, `resolveDiscount()` - test directly
- Nano Store API itself - test against real store instances
- Date utilities (use concrete dates in fixtures)

## Fixtures & Test Data (When Implemented)

**Factory patterns for test data:**
```typescript
// src/lib/test-factories.ts
export function createMockProduct(overrides = {}): Producto {
  return {
    id: "1",
    sku: "TEST-SKU",
    nombre: "Test Product",
    precio_base: 100,
    ...overrides,
  };
}

export function createMockTarifa(overrides = {}): TarifaEspecial {
  return {
    id: 1,
    grupo_cliente: "distribuidor",
    descuento_porcentaje: 10,
    producto: null,
    categoria: null,
    ...overrides,
  };
}
```

**Fixture location:** `src/lib/test-factories.ts` (or `src/__fixtures__/`)

## Coverage Goals (When Implemented)

**Target metrics:**
- Overall: 70% by end of Phase 3
- Critical paths (auth, payment, pricing): 90%+
- API routes: 80%+
- React components: 60% (UI is hard to test)

**Excluded from coverage:**
- Astro pages (SSR rendering)
- UI-only components without logic
- Configuration files

## Current State: No Testing Infrastructure

**Risk implications:**
- Price calculation bugs could silently break order totals
- Auth issues could expose user data or break access control
- API validation gaps could allow malformed orders
- Form validation errors could crash submission
- Payment flow errors would directly impact revenue

**Recommendation:** Establish testing framework in next sprint before adding complex features.

---

*Testing analysis: 2026-02-24*
