# Spec: Módulo 03 — Auth

## Objetivo
Autenticación OAuth (Google + Facebook) con roles `USER`/`ADMIN`. Ajustar callbacks existentes del rol `CLIENT`
al rol por defecto `USER`. Mantener sesiones vía `nuxt-auth-utils`.

## Stack
`nuxt-auth-utils`, `nuxt.config.ts` runtimeConfig.oauth. Sin passwords propios.

## Commands
- Dev: `pnpm dev`
- Endpoints: `/auth/google`, `/auth/facebook`, `/api/auth/me`, `/api/auth/logout`

## Flujo
Login (Google/Facebook) → callback upsert OAuthAccount+User → `setUserSession({ id, email, name, role })` →
`/api/auth/me` lee sesión y trae el User de BD.

## Reglas
- Rol por defecto al crear usuario: `USER` (cambiar de `CLIENT`).
- `useAuthUser()` chequea `role === 'ADMIN'`.
- `middleware/auth.ts`: `publicRoutes = ['/', '/collections', '/collections/*', '/login', '/auth/error', ...]`.
  Las páginas públicas del catálogo deben ser accesibles sin login; el resto de rutas protegidas.
- Editar protección: las rutas públicas de colecciones/items deben agregarse a `publicRoutes` (o la ruta expone
  su guard mientras tanto).
- `NUXT_SESSION_PASSWORD` debe estar configurado (nunca el fallback hardcodeado en producción).

## Boundaries
- **Never**: implementar password/email login; guardar credenciales en el repo.
- **Ask first**: agregar proveedor OAuth adicional.

## Success Criteria
- Login y logout con Google/Facebook funcionan y persisten la sesión.
- Un nuevo usuario se crea con `role = USER`.
- El rol `ADMIN` (asignado manualmente en BD) da acceso a rutas admin.
- `/api/auth/me` devuelve datos sin exponer campos sensibles del User.
