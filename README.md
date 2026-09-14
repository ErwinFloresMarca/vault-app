# Volt Vault

Catálogo de coleccionables impresos en 3D de **Volt-3D**. Los usuarios exploran
colecciones, marcan figuras como conseguidas y los administradores gestionan
catálogo e inventario.

Nuxt 4 full-stack (SSR): frontend, API REST y SEO en un solo proyecto. Base de
datos PostgreSQL con Prisma 7.

## Stack

- **Nuxt 4.4** + Vue 3.5 + TypeScript 5.9 (SSR)
- **Prisma 7** sobre PostgreSQL (driver adapter `@prisma/adapter-pg`)
- **`nuxt-auth-utils`** — OAuth Google + Facebook (sin contraseñas)
- **`@nuxt/ui` 4** + Tailwind v4 + `@nuxt/icon` (Lucide)
- `@nuxt/content`, `@nuxt/image`, `@nuxt/fonts`, `@nuxt/eslint`
- pnpm (paquete único, sin monorepo)

## Requisitos

- Node.js 20+
- pnpm
- Un PostgreSQL accesible

## Setup

```bash
pnpm install
cp .env.example .env        # rellena DATABASE_URL, OAuth y NUXT_SESSION_PASSWORD
pnpm db:generate            # genera el cliente Prisma en generated/prisma
pnpm db:migrate             # aplica migraciones (o: pnpm db:reset && pnpm db:seed)
pnpm dev                    # http://localhost:3000
```

Variables de entorno (ver `.env.example`):

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión PostgreSQL |
| `NUXT_SESSION_PASSWORD` | Sí (prod) | Firma de sesión `nuxt-auth-utils` |
| `NUXT_OAUTH_GOOGLE_ID` / `_SECRET` | Sí | Login con Google |
| `NUXT_OAUTH_FACEBOOK_ID` / `_SECRET` | Opcional | Login con Facebook |
| `NUXT_API_BASE_URL` | No | URL base de la API |
| `NUXT_EXCHANGE_RATE_API_KEY` | No | Tipo de cambio USD→BOB |
| `NUXT_SMTP_*` | No | Email |

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en `:3000` |
| `pnpm build` / `pnpm preview` | Build y preview de producción |
| `pnpm generate` | Pre-render estático |
| `pnpm db:generate` | Genera el cliente Prisma |
| `pnpm db:migrate` | Migraciones en desarrollo |
| `pnpm db:seed` | Datos de ejemplo |
| `pnpm db:reset` | Reinicia la BD y reaplica migraciones |
| `pnpm exec eslint .` | Lint (no hay script `lint`) |

## Estructura

```
pages/          rutas públicas y /admin
components/     Atomic Design: atoms / molecules / organisms
layouts/        default · admin · minimal
composables/    useAuth, useCollectItem
middleware/     auth, admin (ver nota más abajo)
server/
  routes/api/   endpoints HTTP
  routes/auth/  callbacks OAuth
  services/     lógica de negocio (Prisma)
  utils/        db, auth
prisma/         schema, migraciones, seed
types/          tipos de dominio compartidos
docs/specs/     specs por módulo (m01–m10) + PLAN.md
DESIGN.md       design system (tokens y componentes)
AGENTS.md       guía operativa para agentes de IA
```

## Roles y auth

- Solo OAuth (Google/Facebook) vía `nuxt-auth-utils`. No hay login con contraseña.
- Roles: `USER` (default) y `ADMIN` (se asigna manualmente en BD).
- Las APIs de admin exigen `requireAdmin(event)` en el servidor.
- ⚠ `middleware/auth.ts` y `middleware/admin.ts` existen pero **no están cableados**
  en ninguna página; la protección efectiva está en las APIs. Ver `AGENTS.md`.

## Documentación

- [`AGENTS.md`](./AGENTS.md) — comandos, convenciones y boundarys para agentes.
- [`DESIGN.md`](./DESIGN.md) — sistema de diseño visual.
- [`docs/specs/PLAN.md`](./docs/specs/PLAN.md) — plan y estado por módulo.
- [`docs/AUTH_SETUP.md`](./docs/AUTH_SETUP.md) — configuración de OAuth.
- [`docs/LINEAR.md`](./docs/LINEAR.md) — sincronización con Linear.
