# Spec: Módulo 16 — Configuración y API keys de MCP por usuario

> Feature nueva. Da a cada usuario un **apartado de configuración** para generar
> y gestionar sus **API keys de MCP** (hoy solo se crean por CLI con `pnpm mcp:key`),
> y expone lo mismo como **tools MCP**. Relacionado: `m12-mcp-server.md`.

## Objetivo

1. Que un usuario autenticado cree/vea/revoke **sus** API keys de MCP desde la UI
   (`/settings`), eligiendo nombre y scopes permitidos por su rol.
2. Que ese mismo ciclo de vida exista como **tools MCP** (`list_api_keys`,
   `create_api_key`, `revoke_api_key`).
3. Ampliar la superficie MCP para cubrir **todas las acciones** de la app que aún
   no tienen tool (ficha técnica de items, insignias/gamificación, usuarios, stats
   públicas).

## Supuestos

1. La key se hashéa igual que hoy (`hashApiKey` con `MCP_KEY_PEPPER`). **No** hay
   cambio de schema: se reutiliza `ApiKey` (ya existe).
2. La gestión de claves propias se autoriza por **sesión** (REST) y por **scope
   propio** (MCP); nunca se exponen `keyHash`.
3. Un usuario no ADMIN no puede crear scopes de admin (`stats:read`, `users:*`).
4. El texto plano de la key se muestra **una sola vez** (al crearla).

## Modelo / scopes

- Sin migración. `ApiKey` existente.
- Nuevos scopes MCP: **`keys:read`** y **`keys:write`** (no admin; actúan sobre el
  dueño de la key).
- `ADMIN_SCOPES` sigue igual (`stats:read`, `users:read`, `users:write`).

## Superficie

### UI: `/settings`
- Sección "Claves de API (MCP)": tabla con `name`, `prefix`, scopes, creada,
  último uso, expiración, estado (activa/revocada) y acción **Revocar**.
- Formulario "Crear clave": `name`, selección de scopes (solo los permitidos por
  el rol), expiración opcional (días). Al crear, muestra la key **una vez** con
  botón copiar (y aviso de que no se volverá a mostrar).
- Entrada "Configuración" en el menú de usuario del layout.

### REST (sesión)
- `GET /api/me/api-keys` → lista del usuario (sin `keyHash`).
- `POST /api/me/api-keys` → `{ name, scopes[], expiresInDays? }` → `{ apiKey, key }`
  (key en claro una vez).
- `DELETE /api/me/api-keys/[id]` → revoca (soft) si es del usuario.

### MCP tools (nuevos/ampliados)
- **Config**: `list_api_keys` (`keys:read`), `create_api_key` (`keys:write`),
  `revoke_api_key` (`keys:write`).
- **Items**: `create_item`/`update_item` aceptan **`spec`** (ficha técnica).
- **Gamificación**: `list_achievements` (`personal:read`/admin), `get_my_achievements`
  (`personal:read`), `recompute_gamification` (`users:write`, admin, **confirm**).
- **Usuarios**: `get_user` (`users:read`).
- **Stats**: `get_public_stats` (`catalog:read`).

## Requisitos (RFC-2119)

- Crear una key **MUST** devolver el texto plano una única vez y guardar solo el hash.
- La lista **MUST NOT** incluir `keyHash` ni el texto plano.
- Un usuario **MUST NOT** poder crear scopes de admin si su rol no es ADMIN (REST y MCP).
- Revocar **MUST** marcar `revokedAt`; una key revocada **MUST** fallar con 401.
- El formulario **MUST** limitar los scopes mostrados según el rol.

## Criterios de aceptación

- Desde `/settings` creo una key, la copio, la uso contra `/mcp` y revocarla la invalida.
- `pnpm e2e:mcp` sigue en verde (y cubre las tools nuevas).
- `eslint`, `typecheck` y Playwright en verde; sin errores de consola.

## Boundaries

- **Always**: hash con pepper; deny-by-default; nunca exponer `keyHash`; auditar en MCP.
- **Never**: permitir scopes admin a un no-ADMIN; mostrar la key más de una vez;
  aceptar cookies en `/mcp`.

## Fases

1. **Config (UI + REST)**: `apiKeyService`, endpoints `/api/me/api-keys`, página
   `/settings` y entrada de menú.
2. **MCP keys + cobertura**: scopes `keys:*`, tools de keys, `spec` en items,
   gamificación/usuarios/stats; actualizar `docs/MCP.md` y `m12`.
3. **Docs + verificación**: AGENTS/MCP.md, `pnpm e2e:mcp`, Playwright.

## Estado

- **Fase 1 (config UI + REST): ☑** `SEL-129`. `apiKeyService` (`list`/`create`/`revoke`,
  hash con pepper, nunca expone `keyHash`); `GET/POST /api/me/api-keys` +
  `DELETE /api/me/api-keys/[id]`; página `/settings` (crear con scopes según rol, mostrar
  la key una vez + copiar, listar y revocar) y entrada "Configuración" en el menú de usuario.
  Verificado con API (crear → usar en `/mcp` → revocar → 401; no-ADMIN con scope admin → 403)
  y Playwright. `types/index.ts` ahora es la fuente única de scopes (`MCP_SCOPES`).
- Fase 2 (MCP keys + cobertura): ☑ `SEL-130`. Scopes `keys:read`/`keys:write`; tools
  `list_api_keys`/`create_api_key`/`revoke_api_key`; `spec` en `create_item`/`update_item`;
  `get_my_achievements`/`list_achievements`/`recompute_gamification`, `get_public_stats`,
  `get_user`. Total MCP: **37 tools** (`pnpm e2e:mcp` 28/28). **Módulo completo.**
