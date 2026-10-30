# Spec: Módulo 12 — MCP Server (asistente IA)

> **Spec nueva (sin implementar).** Expone Volt Vault como servidor **MCP**
> (Model Context Protocol) para que asistentes IA puedan **consultar y manipular**
> todas las características, con permisos por scope, auditoría y seguridad.

## Objetivo
Dar a un asistente IA (Claude, Cursor, ChatGPT, opencode…) acceso controlado a
Volt Vault: catálogo (colecciones/items/tags/rarezas), archivos, inventario,
colección personal y wishlist, usuarios/roles y métricas. Debe ser **seguro por
defecto**, **auditable** y **denegar por defecto**.

Usuarios: operadores/admin de Volt-3D y asistentes que automatizan tareas.
Éxito: un cliente MCP se conecta con credencial y ejecuta acciones respetando
permisos, sin exponer más de lo necesario.

## Supuestos (validar antes de implementar)
1. El MCP se **embebe en el mismo Nuxt/Nitro** (ruta `/mcp`) y reutiliza
   `server/services/*`; **nunca** Prisma directo en los tools.
2. Transporte **Streamable HTTP** (JSON-RPC 2.0; POST + SSE opcional); `/sse` deprecado.
3. Auth **v1 = API keys** (bearer) con scopes, hasheadas en BD, ligadas a un `User`;
   **OAuth 2.1 (DCR)** queda para v2.
4. Una sola instancia por VPS (sin multi-tenant).
5. Acciones destructivas exigen `confirm: true` (+ scope de escritura).
6. Sin SQL crudo, sin rutas de FS arbitrarias y sin secretos en respuestas.
→ Corregir aquí antes de avanzar.

## Stack
`@modelcontextprotocol/sdk` (TypeScript), `zod` (validación de inputs), Nitro
(server routes), Prisma 7 + PostgreSQL, Node 22, pnpm, TypeScript 5.9.

## Arquitectura
- **Endpoint**: `server/routes/mcp/index.ts` (handler Streamable HTTP: `POST`
  JSON-RPC, `GET` SSE opcional, `DELETE` cerrar sesión).
- **Capa** `server/mcp/`:
  - `server.ts` — registro de tools/resources/prompts + transporte.
  - `auth.ts` — valida API key → contexto `{ user, scopes, apiKeyId }`.
  - `tools/*.ts` — un archivo por dominio; cada tool valida con Zod y llama a los
    `services`.
  - `audit.ts` — registra cada invocación.
  - `rateLimit.ts` — límite por key.
- El MCP valida por **API key + scopes**, no por cookies de sesión (rechaza cookies).
- Reutiliza la lógica existente: `collectionService`, `itemService`,
  `inventoryService`, `getUserStats`, etc. (respeta `route → service → db`).

## Modelo de datos (Prisma)
```prisma
model ApiKey {
  id         String    @id @default(cuid())
  name       String
  keyHash    String    @unique      // hash (sha256+pepper o argon2); nunca la key en claro
  prefix     String                 // p. ej. "vvk_ab12" para identificarla
  userId     String
  scopes     String[]               // deny-by-default
  lastUsedAt DateTime?
  expiresAt  DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model McpAuditLog {
  id         String   @id @default(cuid())
  apiKeyId   String?
  userId     String?
  tool       String
  args       Json                   // redactado (sin secretos/PII sensible)
  result     String                 // "ok" | "error"
  statusCode Int?
  error      String?
  ip         String?
  userAgent  String?
  durationMs Int
  createdAt  DateTime @default(now())
  @@index([createdAt])
  @@index([apiKeyId])
}
```
Migración: `add_mcp_api_keys`.

## Autenticación y autorización
- Header `Authorization: Bearer vvk_…` (nunca en query string).
- Comparación por **hash**; la key se muestra **una sola vez** al crearla.
- Resuelve `User` (rol) + scopes del token. **Deny-by-default**.
- Scopes `admin`/`users`/`stats` solo si `User.role === 'ADMIN'`.
- Expiración/revocación obligatorias; `lastUsedAt` para detectar uso anómalo.
- HTTPS obligatorio en prod; rechazar si no es TLS (o `X-Forwarded-Proto != https`).

## Scopes
| Scope | Permite |
|---|---|
| `catalog:read` | Leer colecciones, items, tags, archivos |
| `catalog:write` | Crear/editar/archivar colecciones/items/tags, cambiar rareza |
| `files:write` | Registrar/subir archivos |
| `inventory:read` | Leer movimientos, batches y stock |
| `inventory:write` | Registrar movimientos y batches |
| `personal:read` | Leer progreso/colección/wishlist del dueño del token |
| `personal:write` | Marcar/desmarcar conseguidos y wishlist (dueño del token) |
| `stats:read` | Métricas del dashboard (admin) |
| `users:read` / `users:write` | Listar usuarios / cambiar rol (admin) |

## Superficie MCP

### Tools — Catálogo
- `list_collections` (`catalog:read`) — `tag?`, `q?`, `sort?`, `page?`, `pageSize?`.
- `get_collection` (`catalog:read`) — por slug.
- `create_collection` (`catalog:write`) — `name`, `description?`, `tags?`, `fileIds?`, `status?`.
- `update_collection` (`catalog:write`).
- `archive_collection` (`catalog:write`, **confirm**) — soft delete.
- `publish_collection` (`catalog:write`).
- `list_tags` (`catalog:read`).
- `upsert_tag` (`catalog:write`).
- `list_items` (`catalog:read`) — `collectionId?`, `status?`, `rarity?`.
- `get_item` (`catalog:read`) — por slug.
- `create_item` (`catalog:write`) — `name`, `collectionId`, `description?`, `fileIds?`, `stockInicial?`, `status?`, `rarity?`.
- `update_item` (`catalog:write`).
- `set_item_rarity` (`catalog:write`).
- `archive_item` (`catalog:write`, **confirm**).

### Tools — Archivos
- `list_files` (`catalog:read`).
- `register_file_url` (`files:write`) — solo dominios allowlist (`images.unsplash.com`, `makerworld.bblmw.com`) o `/uploads/…` (anti-SSRF).

### Tools — Inventario
- `list_inventory_movements` (`inventory:read`) — `itemId?`, `type?`, paginado.
- `list_inventory_batches` (`inventory:read`) — `collectionId?`, paginado.
- `adjust_stock` (`inventory:write`) — `itemId`, `type` (IN/OUT/ADJUSTMENT/SALE), `quantity`, `reason?`, `customer?`.
- `create_inventory_batch` (`inventory:write`) — `type`, `lines[]`, `collectionId?`, `reason?`, `customer?`.

### Tools — Colección personal (dueño del token)
- `collect_item` / `uncollect_item` (`personal:write`) — idempotentes.
- `list_my_collection` (`personal:read`).
- `get_my_stats` (`personal:read`).
- `add_wishlist` / `remove_wishlist` (`personal:write`).

### Tools — Admin
- `get_admin_stats` (`stats:read`, admin).
- `list_users` (`users:read`, admin).
- `set_user_role` (`users:write`, admin, **confirm**) — `USER`/`ADMIN`.

### Resources (solo lectura, URIs)
`voltvault://collections`, `voltvault://collections/{slug}`,
`voltvault://items/{slug}`, `voltvault://me/stats`, `voltvault://admin/stats`,
`voltvault://sitemap.xml`.

### Prompts
- `describe_collection(collectionId)` — copy a partir de items/tags.
- `suggest_item_description(name, collectionSlug)`.
- `summarize_inventory(itemId)`.

## Seguridad (MCP best practices + OWASP)
- **Deny-by-default** y mínimo privilegio; scopes granulares.
- API key con **audience/resource** propio; **no token passthrough** de otros servicios.
- Validación estricta (Zod): tipos, longitudes, listas permitidas (mime, enums).
- Límites de payload y **timeouts**; rechazar cuerpos grandes.
- **Rate limiting** por key (p. ej. 60 req/min) → `429`.
- **Auditoría** de toda invocación, redactando secretos/PII.
- **Confirmación explícita** en acciones destructivas.
- **Anti-SSRF**: `register_file_url` solo allowlist; sin fetch arbitrario.
- **Sin acceso al FS** fuera de `public/uploads`.
- Respuestas sin secretos (`keyHash`, tokens, sesión).
- Gestión de **sesión MCP** (`Mcp-Session-Id`) con expiración; evitar hijacking.
- Rechazar autenticación por **cookies** (solo bearer); sin CORS `*`.
- Monitoreo/alertas de anomalías y **revocación inmediata**.

## Comandos / Estructura
- Deps: `pnpm add @modelcontextprotocol/sdk zod`.
- Migración: `pnpm db:migrate --name add_mcp_api_keys`.
- Util: `pnpm mcp:key create --name "Claude" --scopes catalog:read,personal:write` (`scripts/mcp-key.ts`).
- Dev: `pnpm dev` → MCP en `http://localhost:3000/mcp`.
- E2E: `pnpm e2e:mcp` (`scripts/e2e-mcp.mjs`, cliente del SDK).
```
server/routes/mcp/index.ts
server/mcp/{server,auth,audit,rateLimit}.ts
server/mcp/tools/{collections,items,files,inventory,personal,admin,users}.ts
server/mcp/{resources,prompts}.ts
scripts/mcp-key.ts
scripts/e2e-mcp.mjs
docs/MCP.md
```

## Testing Strategy
- **Unit**: validadores Zod de cada tool y mapeo scope→tool.
- **Contract**: invocar cada tool vía cliente MCP (listado, permisos, errores).
- **Seguridad**: sin token / inválido / expirado / revocado → `401`; scope
  insuficiente → `403`; rate limit → `429`; destructiva sin `confirm` → `400`;
  cookie de sesión rechazada.
- **E2E**: crear key → crear colección+item → ajustar stock → collect → verificar
  por API REST.
- Sin framework de tests aún: proponer `vitest` (ask first) o `node:test`.

## Boundaries
- **Always**: validar input; auditar; comprobar scopes; llamar a `services`; HTTPS; redactar logs.
- **Ask first**: añadir `@modelcontextprotocol/sdk`/`zod`; cambios de schema; exponer `upload_file`; tools de usuarios/roles.
- **Never**: Prisma directo en tools; exponer `keyHash`/secretos; SQL crudo; rutas absolutas; saltar `confirm`; deshabilitar auditoría; admin sin scope; aceptar cookies de navegador.

## Fases (cada una con commit + Linear)
1. **Fundamentos**: `ApiKey` + auth + endpoint MCP + tools de **lectura** (catálogo, inventario, stats) + auditoría + rate limit.
2. **Escritura catálogo**: colecciones, items, tags, rareza, `register_file_url`.
3. **Inventario + personal + admin**: movimientos/batches, collect/wishlist, users/roles.
4. **Resources + prompts + `docs/MCP.md` + E2E**.

## Success Criteria
- Un cliente MCP se conecta a `/mcp` con API key y lista las tools disponibles.
- `catalog:read` lee; `catalog:write` crea/actualiza; sin scope → `403`.
- Destructiva sin `confirm` → `400`; con confirm → ejecuta y queda **auditada**.
- Stock respeta **transacciones**; collect/wishlist **idempotentes**.
- Sin token/expirado/revocado → `401`; rate limit → `429`; cookie de sesión rechazada.
- `docs/MCP.md` con ejemplos reproducibles.

## Open Questions
1. ~~¿API keys (v1) u OAuth 2.1 (DCR)?~~ **Resuelto: API keys bearer** (implementado).
2. ~~¿`upload_file` (base64) o solo `register_file_url`?~~ **Resuelto: solo URL** (allowlist).
3. ~~¿Scopes globales o por colección/tenant?~~ **Resuelto: globales**.
4. ~~¿Qué clientes MCP primero?~~ **Resuelto**: cualquiera vía HTTPS (`opencode`, `mcp-remote`, etc.).
5. ~~¿Límites de rate y retención de auditoría?~~ **Resuelto: 60 req/min**; auditoría sin
   retención automática (se conserva, limpieza manual).
6. ~~¿Tools de usuarios/roles?~~ **Resuelto: implementadas** (`list_users`, `get_user`, `set_user_role` con `confirm`).

## Estado
- Fase 1 (fundamentos + lectura): ☑ `SEL-102` — `ApiKey`/`McpAuditLog`, `/mcp` (Streamable HTTP
  stateless), auth por API key, scopes, rate limit, auditoría y 9 tools de lectura.
- Fase 2 (escritura de catálogo): ☑ `SEL-103` — colecciones, items, rareza, tags y
  `register_file_url` (allowlist); `confirm: true` en destructivas.
- Fase 3 (inventario/personal/admin): ☑ `SEL-104` — `adjust_stock`,
  `create_inventory_batch`, `collect_item`/`uncollect_item`, `add_wishlist`/`remove_wishlist`,
  `list_my_collection`, `get_my_stats`, `list_users` y `set_user_role`.
- Fase 4 (resources/prompts/docs/E2E): ☑ `SEL-105` — 5 resources (3 estáticos +
  2 plantillas), 3 prompts, `docs/MCP.md` y E2E `pnpm e2e:mcp` (28 checks).
  **MCP completo (fases 1-4).**
- **Ampliación (m16, `SEL-129`)**: cobertura completa — scopes `keys:read`/`keys:write` y
  tools `list_api_keys`/`create_api_key`/`revoke_api_key`, `get_my_achievements`/
  `list_achievements`/`recompute_gamification`, `get_public_stats`, `get_user`, y `spec`
  (ficha técnica) en `create_item`/`update_item`. **Total: 37 tools** (E2E 28/28).
