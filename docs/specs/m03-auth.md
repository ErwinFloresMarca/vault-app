# Spec: Módulo 03 — Auth

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
Autenticación OAuth-only (Google + Facebook) con roles `USER`/`ADMIN`, sesiones
vía `nuxt-auth-utils`. Sin contraseñas propias.

## Stack
`nuxt-auth-utils`; `runtimeConfig.oauth` en `nuxt.config.ts`; sesión firmada con
`NUXT_SESSION_PASSWORD`.

## Endpoints
- `GET /auth/google`, `GET /auth/facebook` — callbacks OAuth.
- `GET /api/auth/me` — usuario de BD de la sesión actual (401 si no hay sesión).
- `POST /api/auth/logout` — `clearUserSession`.

## Flujo real
Callback → busca `OAuthAccount` por `(provider, providerId)`:
1. Existe → actualiza `lastLoginAt`/`avatarUrl`.
2. No existe pero el email ya está registrado → vincula una nueva `OAuthAccount`
   al `User` existente.
3. No existe → crea `User` (rol default `USER`) + `OAuthAccount`.
Luego `setUserSession(event, { user: { id, email, name, role } })` y redirige a `/`.
En error: redirige a `/auth/error?provider=<google|facebook>`.

`/api/auth/me` devuelve: `id, email, name, avatarUrl, role, lastLoginAt,
oauthProviders[]` (no expone la sesión cruda ni secretos).

## Guards (server-side, fuente de verdad)
`server/utils/auth.ts`:
- `getCurrentUser(event)` → `User | null` desde la sesión.
- `requireUser(event)` → 401 si no autenticado.
- `requireAdmin(event)` → 401/403 (`role !== 'ADMIN'`).

Cliente (`composables/useAuth.ts`): `useAuthUser()`, `useRequireAuth()`,
`useRequireAdmin()`; el rol se compara `role === 'ADMIN'`.

## ⚠ Estado del middleware (importante)
`middleware/auth.ts` y `middleware/admin.ts` **existen pero NO están cableados**
(no son `.global` y ninguna página usa `definePageMeta({ middleware })`). Por
tanto **no hay redirección de rutas en el cliente**: la autorización real de
datos ocurre en las APIs con `requireAdmin`. Pendiente: SEL-32.

## Boundaries
- **Never**: implementar login con contraseña; exponer secretos de sesión.
- **Ask first**: añadir un proveedor OAuth.

## Success Criteria (verificado)
- Login/logout con Google/Facebook persisten la sesión.
- Un usuario nuevo se crea con `role = USER`; `ADMIN` se asigna en BD.
- Las APIs admin rechazan a no-admin con 403 (`requireAdmin`).
