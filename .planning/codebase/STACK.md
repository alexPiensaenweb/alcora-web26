# Technology Stack

**Analysis Date:** 2026-02-24

## Languages

**Primary:**
- TypeScript 5.6.0 - Application logic, API routes, utilities, React components
- JavaScript (ES Modules) - Astro config, Tailwind config, entry point wrapper

**Secondary:**
- HTML - Astro templates, email templates
- CSS - Tailwind preprocessed output

## Runtime

**Environment:**
- Node.js 20 (Alpine Linux container, see `frontend/Dockerfile`)
- Astro 5.0.0 with Node.js adapter in SSR mode

**Package Manager:**
- npm (via `npm ci` in Docker, see `frontend/package.json`)
- Lockfile: `frontend/package-lock.json` (present)

## Frameworks

**Core:**
- Astro 5.0.0 - SSR web framework with React islands (`client:load`)
- React 19.0.0 - Interactive UI components (cart, auth forms, checkout, admin panels)

**Build/Dev:**
- Vite (bundled with Astro) - Module bundling, development server
- TailwindCSS 3.4.0 - Utility-first CSS styling with custom theme colors

**UI & Interaction:**
- React DOM 19.0.0 - React rendering
- React Turnstile 1.1.0 - Cloudflare CAPTCHA integration
- Nano Stores 0.11.0 + @nanostores/react 0.8.0 + @nanostores/persistent 0.10.0 - State management with localStorage persistence

**SSR & Node Adapter:**
- @astrojs/node 9.0.0 - Node.js standalone server adapter
- @astrojs/react 4.0.0 - React component integration in Astro

**SEO & Utilities:**
- astro-seo 0.8.0 - SEO metadata management
- @astrojs/sitemap 3.7.0 - Dynamic XML sitemap generation
- date-fns 4.0.0 - Date parsing and formatting

## Key Dependencies

**Critical:**
- @directus/sdk 18.0.0 - Directus API client (not used directly; raw fetch instead for control)
- redsys-easy 5.3.2 - Redsys payment gateway HMAC SHA-256 signing and form generation
- resend 6.9.2 - Email delivery API (free plan: 100/day, 3,000/month)
- vanilla-cookieconsent 3.0.0 - Cookie consent banner (v3)
- xlsx 0.18.5 - Excel file import for product bulk import

**Infrastructure:**
- @astrojs/tailwind 6.0.0 - TailwindCSS integration plugin

## Configuration

**Environment:**

Development (`frontend/.env`):
- `DIRECTUS_URL`: http://localhost:8056 (server-side only)
- `PUBLIC_DIRECTUS_URL`: http://localhost:8056 (client accessible)
- `DIRECTUS_ADMIN_TOKEN`: Admin bearer token for privileged operations
- `PUBLIC_SITE_URL`: http://localhost:4322
- `PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile public key
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile private key
- `RESEND_API_KEY`: Resend email API key
- `EMAIL_FROM`: Sender address format (e.g., "Alcora Salud Ambiental <noreply@tienda.alcora.es>")
- `IBAN`: Spanish IBAN for bank transfer display

Production (`frontend/.env.production`):
- `DIRECTUS_URL`: http://127.0.0.1:8055 (localhost only, accessed via Nginx proxy)
- `PUBLIC_DIRECTUS_URL`: https://tienda.alcora.es (public URL)
- `DIRECTUS_ADMIN_TOKEN`: Static admin token for migrations/management
- `PUBLIC_SITE_URL`: https://tienda.alcora.es
- `HOST`: 127.0.0.1 (Plesk Node.js only accessible to Nginx reverse proxy)
- `PORT`: 3000

**Build Configuration:**

Core configs:
- `frontend/astro.config.mjs` - SSR mode, Node adapter, React/Tailwind integrations, Vite define for `PUBLIC_DIRECTUS_URL`
- `frontend/tailwind.config.mjs` - Custom colors via CSS variables (--color-navy, --color-action, --color-text-muted, etc.)
- `frontend/tsconfig.json` - Strict Astro config, React JSX, path aliases (@/*, @components/*, @layouts/*, @lib/*, @stores/*)
- `frontend/package.json` - Type: module (ES Modules), dev scripts (dev, build, preview)

## Platform Requirements

**Development:**
- Node.js 20+ (Alpine Linux recommended for container consistency)
- npm 10+ (comes with Node.js)
- Docker (for multi-container orchestration with Directus, PostgreSQL, Redis)

**Production:**
- Node.js 20 runtime
- Astro SSR standalone mode (no build artifacts needed at runtime, builds to `dist/server/entry.mjs`)
- Nginx reverse proxy (handles SSL, CORS, ProxyPass rewriting)
- Plesk Node.js hosting environment
- PM2 or systemd for process management (Plesk uses PM2, looks for `app.js` as entry point)

**Build Output:**
- `frontend/dist/` - Generated SSR bundle
- Consumed by: `frontend/app.js` wrapper → `dist/server/entry.mjs`

---

*Stack analysis: 2026-02-24*
