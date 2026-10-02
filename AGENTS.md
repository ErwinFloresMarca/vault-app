# AGENTS.md

Volt Vault — catálogo de coleccionables impresos en 3D para Volt-3D. Nuxt 4
full-stack SSR (front + API + SEO en un solo proyecto, sin monorepo). pnpm.

Stack: Nuxt 4.4, Vue 3.5, TypeScript 5.9, Prisma 7 (PostgreSQL + driver adapter
`@prisma/adapter-pg`), `nuxt-auth-utils`, Tailwind v4, `@nuxt/ui` 4, `@nuxt/content`.

## Comandos (pnpm)

- `pnpm install`
- `pnpm dev` — servidor en :3000
- `pnpm build` / `pnpm generate` / `pnpm preview`
- `pnpm db:generate` — regenera el cliente en `generated/prisma` (OBLIGATORIO tras clonar o editar el schema)
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`
- `pnpm exec eslint .` — lint (NO existe script `lint` en package.json)
- `pnpm typecheck` — vue-tsc (script `typecheck`)
- `pnpm mcp:key` — API keys del servidor MCP (`/mcp`; spec `docs/specs/m12-mcp-server.md`)
- `pnpm release` / `pnpm deploy` — release + deploy a la VPS (`docs/DEPLOY.md`)
- CI en `.github/workflows/ci.yml` (lint + typecheck + build). Sin tests unitarios.

Arranque en frío: `pnpm install` → `cp .env.example .env` (rellenar `DATABASE_URL`,
OAuth, `NUXT_SESSION_PASSWORD`) → `pnpm db:generate` → `pnpm db:migrate` (o
`db:reset` + `db:seed`) → `pnpm dev`.

## Dominio (el schema real MANDA)

Modelos en `prisma/schema.prisma`: `User`, `OAuthAccount`, `File`, `Collection`,
`CollectionItem`, `ItemSpec`, `Tag`, `CollectionTag`, `CollectionFile`, `ItemFile`,
`UserCollectedItem`, `UserWishlistItem`, `InventoryBatch`, `InventoryMovement`,
`Achievement`, `UserAchievement`.

- Enum `UserRole`: `USER | ADMIN` (uppercase, default `USER`). NO existen `CLIENT`/`client`/`admin`.
- `CollectionStatus`: `DRAFT | PUBLISHED | ARCHIVED`. `ItemStatus`: `DRAFT | AVAILABLE | SOLD_OUT | ARCHIVED`.
- `InventoryMovementType`: `IN | OUT | ADJUSTMENT | SALE`.
- `CollectionItem.stock` y `soldQuantity` son DENORMALIZADOS: se actualizan
  atómicamente en la misma transacción que crea el/los `InventoryMovement`
  (`server/services/inventoryService.ts`). Nunca los modifiques por fuera de ahí.
- Tipos de dominio compartidos en `types/index.ts`.
- **Gamificación** (`utils/gamification.ts` + `server/services/gamificationService.ts`):
  XP por rareza (50/150/350/1000) y +500 por colección completada; nivel = `floor(xp/500)+1`.
  `User.xp` y las insignias se recalculan de forma idempotente tras conseguir/des-conseguir
  una pieza. No edites `User.xp` por fuera de `gamificationService.recompute`.

## Estructura

- `pages/` — `/` (catálogo), `/collections`, `/collections/[slug]`,
  `/collections/[collectionSlug]/[itemSlug]`, `/me`, `/settings` (API keys de MCP), `/login`, `/auth/error`,
  `/privacy`, `/terms`, `/admin/{dashboard,collections,items,inventory}`.
- `components/{atoms,molecules,organisms}/` — Atomic Design; registrados sin prefijo
  de carpeta en `nuxt.config.ts` (usa `<CollectionCard>`, no `<MoleculesCollectionCard>`).
- `layouts/{default,admin,minimal}.vue`.
- `composables/` — `useAuth.ts`, `useCollectItem.ts`.
- `middleware/` — `auth.global.ts` (global; allowlist de rutas públicas),
  `admin.ts` (rol ADMIN en páginas `/admin/*`).
- `server/routes/api/` — HTTP. `server/services/` — lógica de negocio.
  `server/utils/{db,auth}.ts`. `server/routes/auth/` — callbacks OAuth.
- `docs/specs/` — specs por módulo (`m01-…` a `m10-…`) + `PLAN.md`. `docs/AUTH_SETUP.md`.
- `DESIGN.md` — design system (tokens, componentes, layout). Fuente de verdad visual.

## Arquitectura / flujo de datos

`server/routes/api` (HTTP) → validar sesión/rol → `server/services/*` (lógica) →
Prisma (`server/utils/db.ts`) → DB. Mantén esta dirección.

- NO hay capa `repositories/`: los servicios importan `prisma` directo. Si añades
  una, respeta route → service → repository → db.
- NUNCA pongas lógica de negocio en `pages/` ni en handlers de `server/routes`.
- Importa Prisma por el alias `@gen-prisma/client`; NUNCA desde `@prisma/client`.

## Prisma 7 (gotchas)

- Cliente generado en `generated/prisma` (gitignored). Tras clonar o editar
  `schema.prisma`: `pnpm db:generate` (y `db:migrate` si cambió el schema).
- El datasource PostgreSQL usa `DATABASE_URL` del `.env` (el schema no lleva `url`).
  El adapter `PrismaPg` de `server/utils/db.ts` es obligatorio.
- `generated/prisma` es generado: NO lo edites a mano.

## Auth

- Solo OAuth Google + Facebook (`server/routes/auth/{google,facebook}.ts`). NUNCA
  implementes login con contraseña.
- Sesión con `setUserSession`/`getUserSession`/`clearUserSession`; `/api/auth/me`
  devuelve el usuario de BD.
- Guardas server-side: `requireUser(event)` / `requireAdmin(event)`
  (`server/utils/auth.ts`). Lanzan 401/403.
- Cliente: `useAuthUser()`, `useRequireAuth()`, `useRequireAdmin()`
  (`composables/useAuth.ts`). El rol se compara como `role === 'ADMIN'`.
- `NUXT_SESSION_PASSWORD` es obligatorio en producción (hay fallback inseguro en
  `nuxt.config.ts`; no confíes en él).

## UI / Design

- Sigue `DESIGN.md`: pills 9999px, tipografía uppercase, grid con reglas de 1px,
  un solo peso 400, Volt Blue `#1E90FF` como único acento interactivo.
- Iconos: colección `lucide` vía `@nuxt/icon` (p.ej. `i-lucide-library`).
- Imágenes remotas permitidas: `images.unsplash.com` (`@nuxt/image`).
- Tokens de `DESIGN.md` cableados: `@theme static` en `assets/css/main.css` y
  `app.config.ts` (`ui.colors.primary: 'volt'` = Volt Blue `#1E90FF`; botones/badges
  pill + uppercase). Peso único 400 global en `main.css`; fuente Inter vía `@nuxt/fonts`.

## Preview en navegador (Playwright)

- `pnpm dev` en `:3000` (usa la BD y OAuth del `.env`). Rutas públicas de smoke:
  `/`, `/collections`, `/collections/[slug]`, `/login`, `/privacy`, `/terms`.
  `/me` y `/admin/*` requieren sesión.
- MCP global `playwright` (headless, en `~/.config/opencode/opencode.jsonc`) para
  navegar, capturar screenshot, leer consola y depurar la app en ejecución.
- CLI local: `pnpm exec playwright` (browsers en `~/.cache/ms-playwright`). E2E
  autenticado: `pnpm e2e` (`scripts/e2e-auth.mjs`; login `/api/test/login` dev-only).
- Error de consola conocido: 404 de `/1x` (@nuxt/image con imágenes remotas); inofensivo.

## Boundarys

- `generated/prisma` — generado, nunca a mano.
- `.env` — nunca commitear (solo `.env.example`). Nunca secretos en código,
  AGENTS.md ni DESIGN.md.
- La autorización real de datos vive en las APIs (`requireAdmin`); el middleware
  de página es solo redirección de UX. Nueva ruta pública → añadir a la allowlist
  de `middleware/auth.global.ts`.
- No cambies el alias `@gen-prisma` de `nuxt.config.ts` ni el adapter `PrismaPg`
  de `server/utils/db.ts`.

## Verificación antes de terminar

1. `pnpm exec eslint .` y `pnpm typecheck`
2. `pnpm db:generate` si tocaste `schema.prisma`
3. `pnpm dev` y verifica la ruta afectada con Playwright (MCP `playwright` o CLI):
   navega, revisa consola y captura screenshot (no hay tests).
4. Cierra la tarea: commit + push + estado en Linear (ver “Cierre de tarea”).

## Linear

Proyecto **Volt Vault** (equipo `SEL`): https://linear.app/self-proyects/project/volt-vault-65fb0f09e1fb
Specs as-built en `docs/specs/`. Deploy en `docs/DEPLOY.md`.

## Skills globales de uso obligatorio

Están en `~/.config/opencode/skills/` y DEBEN usarse para sus propósitos:

- **spec-driven-development**: toda feature nueva empieza por el spec (`docs/specs/`).
- **agents-md**: para crear/editar este AGENTS.md.
- **design-md**: para crear/editar `DESIGN.md` o la guía de design system.
- **nuxt-project**, **nuxt-ui**, **nuxt-architecture**, **nuxt-reference**: cualquier
  código Nuxt; el MCP `nuxt-ui` para detalles de componentes.

## Cierre de tarea (OBLIGATORIO)

Al terminar **cada** tarea, sin pedir permiso:
1. Verificar (`pnpm exec eslint .`; Playwright si aplica).
2. Commit de lo tocado (Conventional Commits: `feat:`, `fix:`, `chore:` `docs:`, `refactor:`).
3. Actualizar el issue correspondiente en Linear → `Done`.
4. `git push origin main`.

- Branch: `type/descripcion-corta`. Nunca commitear `.env` ni secretos.
