# External Integrations

**Analysis Date:** 2026-02-24

## APIs & External Services

**Headless CMS:**
- Directus 11 - Content/product/user/order management, authentication
  - SDK/Client: Raw `fetch()` via `frontend/src/lib/directus.ts` (not SDK)
  - Auth: Bearer token in Authorization header
  - Endpoints: `/items/productos`, `/items/categorias`, `/items/tarifas_especiales`, `/items/pedidos`, `/auth/login`, `/auth/refresh`, `/users/me`
  - Admin Token: `DIRECTUS_ADMIN_TOKEN` env var for privileged operations (reads tarifas_especiales)

**Payment Gateway:**
- Redsys (Spanish payment processor) - Card/Bizum payments
  - SDK/Client: `redsys-easy` 5.3.2 package
  - Auth: HMAC SHA-256 signing with merchant secret key
  - Configuration: `REDSYS_MERCHANT_CODE`, `REDSYS_SECRET_KEY`, `REDSYS_TERMINAL` (default "001"), `REDSYS_ENV` (production/sandbox)
  - Webhook: POST to `/pago-api/webhook` for payment notifications
  - Redirect: Form submission to `sis-t.redsys.es` (test) or production Redsys URL
  - Test URLs: SANDBOX_URLS | Production: PRODUCTION_URLS
  - Payment Methods: "C" (card/Visa/MC), "z" (Bizum), "T" (transfer)
  - Order ID Format: 4-12 alphanumeric, starts with 4 digits (format: `${pedidoId}${randomSuffix}`)

**Email Service:**
- Resend - Email delivery
  - SDK/Client: `resend` 6.9.2 package
  - Auth: `RESEND_API_KEY` env var
  - From Address: `EMAIL_FROM` env var (e.g., "Alcora Salud Ambiental <noreply@tienda.alcora.es>")
  - Rate Limits: Free plan 100/day, 3,000/month
  - Implementation: `frontend/src/lib/email.ts` with template builders (presupuesto, pedido, activación, bienvenida, registro)

**Security/Bot Prevention:**
- Cloudflare Turnstile - CAPTCHA for forms
  - Site Key: `PUBLIC_TURNSTILE_SITE_KEY` (public, client-side)
  - Secret Key: `TURNSTILE_SECRET_KEY` (server-side only)
  - Verify URL: `https://challenges.cloudflare.com/turnstile/v0/siteverify` (POST)
  - Implementation: `frontend/src/lib/turnstile.ts`
  - Test Mode: Keys starting with "1x00000" skip verification

## Data Storage

**Databases:**

Primary:
- PostgreSQL 16 (Alpine Linux image)
  - Connection: Via docker-compose service `db`
  - Client: Directus built-in PostgreSQL driver
  - Host (dev): `db:5432`
  - Host (prod): Docker network `alcora-net`
  - Config via env: `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`
  - Schema: Managed by Directus migrations

Caching:
- Redis 7 (Alpine Linux image)
  - Purpose: Directus cache store, rate limiter
  - Connection: Via docker-compose service `cache`
  - URL (dev/prod): `redis://cache:6379`
  - Config: `CACHE_ENABLED=true`, `CACHE_STORE=redis`, `RATE_LIMITER_STORE=redis`
  - Use: Session caching, query caching (when `CACHE_AUTO_PURGE=false`)

**File Storage:**
- Local filesystem in Docker volume
  - Uploads: `./directus/uploads:/directus/uploads` (persistent volume mount)
  - Extensions: `./directus/extensions:/directus/extensions`
  - Database backups: `pgdata:/var/lib/postgresql/data` (persistent volume)

**Client-side State:**
- LocalStorage (via Nano Stores with @nanostores/persistent)
  - Cart items stored in browser localStorage
  - Syncs across tabs/windows within same domain

## Authentication & Identity

**Auth Provider:**
- Custom via Directus
  - Implementation: `frontend/src/lib/auth.ts`
  - Login: POST `/auth/login` with email/password → returns `access_token`, `refresh_token`, `expires`
  - Refresh: POST `/auth/refresh` with `refresh_token` → new `access_token`
  - Token TTL: `AUTH_ACCESS_TOKEN_TTL=15m`, `AUTH_REFRESH_TOKEN_TTL=7d` (Directus config)
  - Session Cookies: httpOnly, secure (production), sameSite=lax
    - `alcora_session`: access_token (15 min expiry)
    - `alcora_refresh`: refresh_token (7 day expiry)
  - User Profile: GET `/users/me` with Bearer token → user object with role, policies, status, grupo_cliente
  - Admin Detection: Checks `role.admin_access` (Directus 10) or `role.policies[].policy.admin_access` (Directus 11)
  - User Types: B2B (groups: "particulares", "profesionales", "mayoristas"), B2C auto-activated
  - Approval Workflow: B2B users await manual admin activation (status: active/inactive)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar configured

**Logs:**
- Server-side: `console.log()` / `console.error()` to stdout (captured by PM2 or Docker)
- Client-side: Browser console (React/Astro components)
- Directus: Built-in logs table in PostgreSQL
- Key logs: `[directus]`, `[auth]`, `[redsys]`, `[turnstile]`, `[email]` prefixes in code

## CI/CD & Deployment

**Hosting:**
- Plesk Node.js (production)
  - Entry point: `frontend/app.js` (PM2 looks for this)
  - Runtime: Node.js 20
  - Port: 3000 (localhost only, proxied by Nginx)
  - Environment: `.env.production` loaded manually by app.js wrapper

Docker Compose (development):
  - `docker-compose.yml` - Dev environment with Astro dev server on :4322
  - `docker-compose.production.yml` - Production with Nginx-only Directus access on localhost:8055

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar automated pipeline

**Build Process:**
- Manual: `npm run build` generates `dist/server/entry.mjs` (Astro SSR)
- Deploy: Copy `dist/`, `frontend/app.js`, `package.json`, `package-lock.json` to Plesk
- PM2 starts via `app.js` wrapper

## Environment Configuration

**Required env vars (startup-critical):**
- `DIRECTUS_URL` - Server-side Directus API URL
- `PUBLIC_DIRECTUS_URL` - Client-side Directus asset/API URL
- `DIRECTUS_ADMIN_TOKEN` - Admin bearer token
- `RESEND_API_KEY` - Email delivery API key
- `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare CAPTCHA public key
- `TURNSTILE_SECRET_KEY` - Cloudflare CAPTCHA secret
- `PUBLIC_SITE_URL` - Site canonical URL (used in emails, redirects)
- `IBAN` - Spanish bank account for display
- `EMAIL_FROM` - Email sender address

**Directus-specific (Docker-only):**
- `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` - PostgreSQL credentials
- `SECRET` - Directus encryption key
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - Initial admin user
- `PUBLIC_URL` - Directus public URL (clients see this)
- `CORS_ORIGIN` - Allowed origins
- `CACHE_ENABLED`, `CACHE_STORE`, `REDIS` - Redis cache config

**Secrets location:**
- Production: Plesk environment variables (not committed)
- Development: `frontend/.env` (git-ignored, template in `frontend/.env.example`)
- Docker Compose: `docker-compose.yml` references ${VARIABLE} from hosting environment (Plesk, PM2, or `.env` file)

## Webhooks & Callbacks

**Incoming:**

Redsys Payment Webhook:
- Endpoint: `frontend/src/pages/pago-api/webhook.ts` → POST
- Trigger: Payment processor sends notification after transaction
- Payload: Base64-encoded Directus parameters + HMAC SHA-256 signature
- Processing: Verifies signature, extracts pedido ID, updates order status
- Response: Returns JSON with success/error status

**Outgoing:**
- Bank Transfer: No webhook; manual admin confirmation required (IBAN displayed at checkout)
- Email: Outbound to customers (Presupuesto, Pedido, Activación, Bienvenida, Registro notifications)
- Directus Events: No custom webhooks configured

## API Endpoints

**Payment:**
- `POST /pago-api/initiate` - Create Redsys redirect form for card/Bizum payment
- `POST /pago-api/webhook` - Redsys webhook notification handler

**Cart & Orders:**
- `POST /cart/presupuesto` - Generate quote/presupuesto email request
- `POST /cart/submit` - Submit order to Directus, calculate final price server-side, charge payment

**Authentication:**
- `POST /cuenta-api/login` - Email + password → session/refresh tokens in httpOnly cookies
- `POST /cuenta-api/logout` - Clear cookies
- `GET /cuenta-api/me` - Get current user profile
- `POST /cuenta-api/register` - B2B registration form submission (triggers admin approval email)
- `PATCH /cuenta-api/profile` - Update user profile (address, company info)

**Admin Management:**
- `PATCH /gestion-api/usuarios/[id]/estado` - Activate/deactivate user
- `POST /gestion-api/usuarios/[id]/grupo` - Assign user group (tariff tier)
- `POST /gestion-api/productos/crear` - Create new product
- `POST /gestion-api/productos/importar` - Bulk import products from Excel
- `GET /gestion-api/productos/buscar` - Search products
- `PATCH /gestion-api/pedidos/[id]/estado` - Update order status
- `POST /gestion-api/pedidos/[id]/convertir` - Convert presupuesto to pedido
- `POST /gestion-api/upload` - File upload for product images

**Public/Catalog:**
- `GET /products-api` - Public product listing with pagination (no auth)
- `GET /search/suggest` - Autocomplete search suggestions
- `GET /sitemap-dynamic.xml.ts` - Dynamic XML sitemap

---

*Integration audit: 2026-02-24*
