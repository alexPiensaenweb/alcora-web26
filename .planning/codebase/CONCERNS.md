# Codebase Concerns

**Analysis Date:** 2026-02-24

## Tech Debt

**Rate Limiting Implementation - In-Memory Store:**
- Issue: Rate limiting uses a simple in-memory Map that leaks memory entries and doesn't persist across restarts
- Files: `src/lib/rateLimit.ts`
- Impact: In production with multiple node instances, each server has independent rate limit state. Attackers can distribute requests across servers to bypass limits. Memory grows unbounded without proper cleanup.
- Fix approach: Migrate to Redis-backed rate limiting (use `redis` package with TTL). Store keys like `rate_limit:type:identifier` with automatic expiration. Requires REDIS_URL env var.

**Error Handling - Generic Catch Blocks:**
- Issue: Throughout codebase, try-catch blocks catch all errors and log only a generic message, then return 500 responses. No error tracking or structured logging.
- Files: `src/pages/cart/submit.ts` (line 219-224), `src/pages/pago-api/initiate.ts` (line 138-143), `src/pages/cuenta-api/register.ts` (no catch shown but pattern used), and many others
- Impact: Silent failures in production. Payment failures, order creation errors, and API integration issues are logged to console only. No visibility for admins.
- Fix approach: Implement structured logging (JSON format with severity, trace ID, context). Log to a dedicated service (e.g., BunyanLogger, Pino, or external service like Datadog). Provide admin dashboard to review application logs. Implement error tracking (Sentry-like).

**In-Memory Cache for Company Email:**
- Issue: Company email cached in module-level variable `_cachedCompanyEmail` with 5-minute TTL
- Files: `src/lib/email.ts` (lines 38-55)
- Impact: Changes to company email in Directus won't reflect for up to 5 minutes. Not a blocker but creates confusion. Multiple server instances have separate caches.
- Fix approach: Use Redis for distributed cache or reduce TTL to 1 minute. Consider bypassing cache entirely if calls are infrequent.

**No Request/Response Logging:**
- Issue: API routes log errors to console but don't track successful requests, request/response times, or payloads
- Files: All files under `src/pages/*/` and `src/pages/*-api/`
- Impact: No audit trail. Impossible to debug issues later ("customer says they tried to order"). No performance metrics.
- Fix approach: Add request ID generation in middleware. Log all API calls with timestamp, method, path, status, duration, and user ID.

**Admin Panel Component Complexity:**
- Issue: `PedidoAdminPanel.tsx` is 812 lines, `ProductosAdminPanel.tsx` is 860 lines. Multiple responsibilities (state management, UI, API calls, validation)
- Files: `src/components/admin/PedidoAdminPanel.tsx`, `src/components/admin/ProductosAdminPanel.tsx`
- Impact: Hard to test, maintain, and extend. Bug fixes risk breaking unrelated functionality. Single point of failure for critical admin UI.
- Fix approach: Split into smaller components per responsibility (OrderList, OrderDetails, OrderActions, OrderSearch). Extract business logic to `useOrder()` and `useOrderActions()` hooks. Move API calls to separate service layer.

**Missing Validation in Admin UI:**
- Issue: Admin components accept user input without comprehensive validation before API submission
- Files: `src/components/admin/PedidoAdminPanel.tsx` (product add, quantity update), `src/components/admin/NuevoProductoForm.tsx`
- Impact: Invalid data can be sent to API. Server-side validation catches it but creates poor UX (cryptic errors) and potential data corruption if validation is bypassed.
- Fix approach: Use same Zod schemas client-side. Parse and validate before submission. Show inline errors.

**Email Template HTML - Manual String Building:**
- Issue: Email HTML built with manual string concatenation in `buildPedidoHtml()` without proper escaping
- Files: `src/lib/email.ts` (22 KB file contains complex HTML templates)
- Impact: XSS vulnerability if user data (product names, addresses) contains HTML. Email injection if line breaks in fields.
- Fix approach: Use email template library (react-email, or MJML) or at minimum use `escapeHtml()` utility. Move templates to `.html` or `.mjml` files.

## Known Bugs

**Payment Reference Ambiguity:**
- Symptoms: When payment denied, `referencia_pago` is set to "DENEGADO - Codigo: {code} / Order: {orderId}". When approved, it's "{orderId} / Auth: {authCode}". Inconsistent format makes parsing impossible.
- Files: `src/pages/pago-api/webhook.ts` (lines 101-122)
- Trigger: Submit order with card payment. Payment gets denied, then retry with different card.
- Workaround: Check `estado` field instead. If `pagado`, reference contains auth code.
- Fix: Create separate fields: `referencia_pago_estado` (approved/denied/pending), `referencia_pago_codigo` (Redsys code), `referencia_pago_autorizacion` (auth code).

**Cart Persistence on Logout:**
- Symptoms: After user logs out, cart items remain in localStorage. If another user logs in on same device, they see previous user's cart.
- Files: `src/stores/cart.ts` (localStorage persistence), `src/pages/cuenta-api/logout.ts` (clears auth cookies only)
- Trigger: Add items to cart as User A. Log out. Log in as User B.
- Workaround: None. Users must manually clear items.
- Fix: In logout API, clear localStorage cart. Or clear on login if logged-in user differs from cart origin.

**Product Query Parameter Validation:**
- Symptoms: `/products-api.ts` accepts `limit` parameter (8-48) and `page` parameter (1+). No max for page. Could iterate through thousands of pages.
- Files: `src/pages/products-api.ts` (lines 37-41)
- Trigger: Request `?page=999999999&limit=48`
- Workaround: None, but impact is minimal (large DB query, caught by rate limit).
- Fix: Add reasonable page limit or use cursor-based pagination.

**Redsys Order ID Format - No Validation:**
- Symptoms: Redsys order ID created by padding pedido ID: "0042XXXX". Extract assumes format but no validation that extracted ID is valid.
- Files: `src/lib/redsys.ts`, `src/pages/pago-api/webhook.ts` (line 65)
- Trigger: If Redsys order ID is corrupted or modified, extraction returns invalid ID. Order update silently fails.
- Workaround: None.
- Fix: Query database to verify extracted pedido ID exists before updating.

## Security Considerations

**CSRF Protection Bypasses:**
- Risk: Redsys webhook endpoint is CSRF exempt (`/pago-api/webhook`), which is correct (verified by HMAC signature). BUT other state-changing endpoints might not be fully protected if Origin header is missing.
- Files: `src/middleware.ts` (lines 48-73)
- Current mitigation: Middleware checks Origin vs Host. BUT if Origin header is absent (browsers may omit in some cases), check is skipped. No fallback CSRF token.
- Recommendations: Add form-based CSRF token as fallback. Require explicit auth header presence for API endpoints. Consider SameSite=Strict for auth cookies.

**Admin Token Leakage Risk:**
- Risk: `DIRECTUS_ADMIN_TOKEN` used in `directusAdmin()` function called from many API routes. If logged, appears in error messages or stack traces.
- Files: `src/lib/directus.ts` (lines 105-119), `src/pages/cart/submit.ts` (lines 49, 118-123 error logging)
- Current mitigation: None. Errors logged to console include full error message.
- Recommendations: Never log error objects directly. Create error wrapper that strips sensitive values. Use environment variable validation at startup to fail fast if token missing.

**SQL Injection via Directus REST API:**
- Risk: Search queries concatenated directly: `/gestion-api/productos/buscar?q=${encodeURIComponent(q)}`. If Directus has filter injection vulnerabilities, crafted `q` could bypass access controls.
- Files: `src/pages/gestion-api/productos/buscar.ts`
- Current mitigation: `encodeURIComponent()` escapes URL params. Directus should validate server-side.
- Recommendations: Use Directus SDK instead of raw fetch. Add server-side allowlist for search fields. Log search queries for audit.

**User Status Bypass:**
- Risk: Middleware blocks inactive users from accessing `/cuenta` and `/checkout`: `if (user.status !== "active") redirect("/login?pendiente=1")` (line 154-157). But admin routes check `isAdmin` only, not `status`. Suspended admin could access admin panel.
- Files: `src/middleware.ts` (lines 149-157, 131-139)
- Current mitigation: Directus role permissions. But middleware doesn't verify.
- Recommendations: Check `user.status === "active"` for all protected routes including admin. Log when inactive users attempt access.

**Price Tampering - Client-Side Cart:**
- Risk: Cart stored in localStorage with `precioUnitario`. User could edit localStorage to change price before checkout.
- Files: `src/stores/cart.ts`, `src/pages/cart/submit.ts`
- Current mitigation: Server recalculates prices in `/cart/submit` (line 80-82), never trusts client prices.
- Status: Protected. Good practice evident.

**Professional Product Access Control:**
- Risk: `solo_profesional` field blocks particulares in order submission. But could be bypassed if user modifies product list response before sending to `/cart/submit`.
- Files: `src/pages/cart/submit.ts` (lines 67-73)
- Current mitigation: Server re-fetches product to check `solo_profesional` before order creation.
- Status: Protected. Good practice evident.

**Rate Limit Bypass - Distributed Attack:**
- Risk: Rate limiting stored per-instance in memory. Attacker distributes requests across multiple load balancer instances to bypass 10 requests/minute limit.
- Files: `src/lib/rateLimit.ts`, used in `/cart/submit` (10/min), `/pago-api/initiate` (10/min), `/cuenta-api/register` (3/5min)
- Current mitigation: None. In production, this fails completely.
- Recommendations: Migrate to Redis-backed rate limiting (see Tech Debt section above).

**Turnstile CAPTCHA Bypass:**
- Risk: Dev secret key check `isDevKey = TURNSTILE_SECRET.startsWith("1x00000")` allows bypass. If TURNSTILE_SECRET is dev key, verification is skipped.
- Files: `src/pages/cuenta-api/register.ts` (lines 75-77)
- Current mitigation: Only applies if dev key detected. Assumes dev key isn't used in production.
- Recommendations: Explicitly set TURNSTILE_SECRET in all non-dev environments. Fail fast at startup if empty in production.

## Performance Bottlenecks

**Category Hierarchy Traversal - O(n²) in Worst Case:**
- Problem: `collectDescendantIds()` uses inefficient tree traversal to find all child categories
- Files: `src/pages/products-api.ts` (lines 12-33)
- Cause: For each root category, iterates through entire category list for each child (nested loop). With 1000s of products/categories, becomes slow.
- Improvement path: Pre-compute category hierarchy at startup or cache. Use depth-first search once instead of repeated lookups. Or use SQL query with recursive CTE if available in Directus.

**Email Sending - Synchronous Blocking:**
- Problem: `/cart/submit` and webhook handler send emails in try-catch blocks, blocking order creation until emails sent
- Files: `src/pages/cart/submit.ts` (lines 185-205), `src/pages/pago-api/webhook.ts` (lines 144+)
- Cause: `await sendMail()` waits for Resend API response before returning. If Resend slow, user sees delayed response.
- Improvement path: Defer email sending to job queue (Bull, RabbitMQ, or Directus background jobs). Return order ID immediately, send email async. Implement retry logic for failed emails.

**Directus Admin Fetch - Redundant Calls:**
- Problem: For each order item in `/cart/submit`, calls `directusAdmin()` individually to fetch product. With 100 items, 100 sequential API calls.
- Files: `src/pages/cart/submit.ts` (lines 46-58)
- Cause: No batching or caching. Sequential `await` inside loop.
- Improvement path: Use Directus batch API or `Promise.all()` to fetch all products in parallel. Cache product data in Redis for 5 minutes.

**CSV Export - No Streaming:**
- Problem: ProductImport and exports load entire CSV into memory before processing
- Files: `src/pages/gestion-api/productos/importar.ts`
- Cause: Likely using `xlsx` package without streaming. Huge CSVs will cause memory issues.
- Improvement path: Use streaming CSV parser (fast-csv with streams). Process rows one at a time.

## Fragile Areas

**Payment State Machine - Race Condition:**
- Files: `src/pages/pago-api/webhook.ts`, `src/pages/cart/submit.ts`
- Why fragile: Redsys webhook and retry payment initiation can race. If user clicks "Retry Payment" while webhook processing: webhook may update to `pagado` while `/pago-api/initiate` is being called.
- Safe modification: Add optimistic locking (version field on pedido). Webhook should only update if estado is still `aprobado_pendiente_pago`. Lock order during payment processing.
- Test coverage: Gap - no tests for concurrent payment updates. Could add integration test with mocked delays.

**Email HTML Template - Complex String Manipulation:**
- Files: `src/lib/email.ts` (entire file is 22 KB of HTML template building)
- Why fragile: Template hardcoded with inline styling and complex HTML. No schema for template variables. Typos in variable names silently produce empty placeholders.
- Safe modification: Move to separate `.mjml` file or use react-email for type-safe templates. Export template as function with explicit parameters: `buildPedidoHtml({pedidoId, items, total, ...})` with TypeScript types.
- Test coverage: Gap - email templates not tested. Add snapshots for email output.

**Admin Panel Product Search - No Cancellation:**
- Files: `src/components/admin/PedidoAdminPanel.tsx` (lines 70-96)
- Why fragile: Search with 300ms debounce. If user types rapidly then stops, pending requests may arrive after UI state has changed. No AbortController.
- Safe modification: Add `const abortController = new AbortController()` and pass to fetch. Cancel previous request on new search.
- Test coverage: Gap - no tests for timing edge cases.

**Middleware User Loading - Token Refresh Loop:**
- Files: `src/middleware.ts` (lines 76-105)
- Why fragile: If refresh token is valid but returns invalid user, code doesn't handle it properly. Could infinite loop on subsequent requests.
- Safe modification: Add maximum retry count. If refresh fails 3 times, clear cookies. Log warnings.
- Test coverage: Gap - no tests for token refresh failure scenarios.

**Zod Schema Conditional Validation:**
- Files: `src/pages/cuenta-api/register.ts` (lines 52-71)
- Why fragile: Schema preprocess converts empty strings to undefined, then fields are optional. But register endpoint has additional validation checking if B2B. Validation logic split between Zod and endpoint. Easy to miss a field.
- Safe modification: Create separate schema for B2B registration. Use Zod `.refine()` or `.superRefine()` for conditional validation. Keep all validation in schema.
- Test coverage: Gap - no tests for B2B registration validation. Add test case with missing `razon_social`.

## Test Coverage Gaps

**Payment Webhook - No Signature Verification Tests:**
- What's not tested: Whether webhook properly verifies Redsys HMAC signature
- Files: `src/pages/pago-api/webhook.ts`, `src/lib/redsys.ts`
- Risk: If signature verification logic has bug, any third party could POST fake payment notifications
- Priority: High - Security critical

**Order Price Recalculation - No Tariff Tests:**
- What's not tested: Pricing logic with complex tariff scenarios (product-specific, category-specific, global discounts)
- Files: `src/lib/pricing.ts`, `src/pages/cart/submit.ts`
- Risk: Pricing bugs go undetected. Customer charged wrong amount or given wrong discount.
- Priority: High - Revenue impact

**Rate Limiting - No Concurrency Tests:**
- What's not tested: Whether rate limiting works correctly under concurrent requests
- Files: `src/lib/rateLimit.ts`
- Risk: Concurrent requests could bypass limit. Distributed attack bypasses in production.
- Priority: High - Security impact

**Cart Persistence - No Storage Corruption Tests:**
- What's not tested: What happens if localStorage is corrupted or quota exceeded
- Files: `src/stores/cart.ts`
- Risk: Invalid JSON in localStorage would crash app. No error boundary.
- Priority: Medium - User experience

**Email Sending - No Failure Tests:**
- What's not tested: Behavior when Resend API fails or times out
- Files: `src/lib/email.ts`, `src/pages/cart/submit.ts`
- Risk: If email send fails silently, no notification to user or admin that order emails weren't sent
- Priority: Medium - Operations

**Admin Role Detection - No Edge Case Tests:**
- What's not tested: Directus 10 vs 11 role structure differences
- Files: `src/lib/auth.ts` (lines 108-124)
- Risk: Role detection could fail on version mismatch
- Priority: Medium - User access

---

*Concerns audit: 2026-02-24*
