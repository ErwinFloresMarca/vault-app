# AGENTS.md

Nuxt 4 full-stack app for the "Volt" domain (3D printing business "Volt3D"). pnpm workspace, single package.

## Critical: product-spec vs. codebase mismatch

The product brief in the session describes **"Volt Vault"** — a 3D-printed collectibles catalog with
`Collection` / `CollectionItem` / `Tag` / `UserCollectedItem` / `InventoryMovement` entities, public
catalog pages, and "mark as collected" per user.

**That domain does NOT exist in the code yet.** The current schema and app are **Volt3D**, a 3D-printing
service (projects, quotes, orders, installments, payments, filaments, printers). `prisma/schema.prisma`
has no Collection/Item/Tag models. If the task moves Volt Vault forward, the data model, API, and pages
must be built from scratch (or the schema reworked). Verify against `prisma/schema.prisma` before assuming
any entity exists.

## Commands (pnpm)

```bash
pnpm dev                # dev server on :3000
pnpm build / generate / preview
pnpm db:generate        # prisma generate -> ./generated/prisma
pnpm db:migrate         # prisma migrate dev
pnpm db:seed            # tsx prisma/seed.ts
pnpm db:reset           # prisma migrate reset
pnpm lint               # (eslint via @nuxt/eslint; no script wired — run `pnpm eslint .`)
```

No test framework is configured yet. `pnpm` is the package manager (workspace/lockfile; never npm/yarn).

## Prisma 7 specifics (easy to trip on)

- Client is generated to **`generated/prisma`** (gitignored). **`pnpm db:generate` is required after a fresh clone** before the app compiles. It is NOT committed.
- Import Prisma via the alias `@gen-prisma/client` (configured in `nuxt.config.ts`; used in `server/utils/db.ts`) — do not import from `@prisma/client` directly.
- **Datasource is PostgreSQL only** (`DATABASE_URL` via `.env`). Driver adapters are mandatory in Prisma 7 — the `PrismaPg` adapter wrapper in `server/utils/db.ts` must stay; schema datasource has no `url`.
- `generated/prisma` is generated; never hand-edit. Changing `schema.prisma` → run `pnpm db:generate` (and `db:migrate` if schema changed). Always run `db:generate` after schema edits so the alias types update.
- `prisma/seed.ts` seeds SystemConfig, exchange rate, filaments, printers.

## Auth (OAuth-only, no passwords)

- Auth = **Google + Facebook only** via `nuxt-auth-utils`. No email/password login — never implement own password handling.
- Session storage: `setUserSession` / `getUserSession` / `clearUserSession`. Current user comes from session, DB fetched in `server/routes/api/auth/me.ts`.
- `NUXT_SESSION_PASSWORD` **must be set in production** — `nuxt.config.ts` has an insecure hardcoded fallback; do not rely on it.
- OAuth callbacks: `server/routes/auth/google.ts` and `server/routes/auth/facebook.ts` upsert `OAuthAccount`+`User`, then `setUserSession({ id, email, name, role })`.
- Role enum in DB: **`CLIENT` | `ADMIN`** (uppercase, `User.role`, enum `UserRole`). Composables/docs check `role === 'ADMIN'` (uppercase). Note: older docs/specs say `client`/`admin`/`USER` — code is authoritative.
- Client helpers in `composables/useAuth.ts`: `useAuthUser()`, `useRequireAuth()`, `useRequireAdmin()`.
- **Route guard**: `middleware/auth.ts` protects routes by default and skips only a hardcoded `publicRoutes` list (`/`, `/galeria`, `/contacto`, `/auth/error`). New public pages/collections must be added to that array. Global auth middleware applies unless a page opts out.

## Architecture conventions

- Nuxt layered dirs under `pages/`, `components/`, `composables/`, `middleware/`, `server/`. Add `layouts/`, `stores/`, `types/`, `utils/` as work proceeds, per the product brief. Server API lives under `server/routes/api`.
- Endpoints should be thin: route → validate → service → repository/ORM → DB. Business logic should not live in pages or HTTP handlers.
- UI stack: @nuxt/ui, Tailwind v4 (`assets/css/main.css`), @nuxt/content (MDC — note `vite.optimizeDeps.include: ['@nuxtjs/mdc']` in `nuxt.config.ts`). Landing page renders `content/index.md`.
- SEO: prerender route set for `/sitemap.xml` and `/robots.txt` in `nuxt.config.ts` (nitro.prerender). `useSeoMeta` used in pages for dynamic titles; real sitemap is a placeholder.

## Style

- TypeScript throughout; components `<script setup lang="ts">`. Code/comments are in Spanish (matches existing files). No tests yet — manual verification.
- Run `pnpm db:generate` after schema changes and typecheck before finishing (best-effort; relying on Nuxt's generated `.nuxt/tsconfig.json`).
