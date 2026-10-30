# MCP — Volt Vault para asistentes IA

Servidor **MCP** (Model Context Protocol) embebido en la app, en `/mcp`
(Streamable HTTP, JSON-RPC 2.0). Permite a un asistente IA **consultar y
manipular** el catálogo, inventario, colección personal, usuarios y métricas.

Spec: `docs/specs/m12-mcp-server.md`.

## 1. Crear una API key

```bash
pnpm mcp:key --name "Claude" --email tu@email.com \
  --scopes catalog:read,catalog:write,inventory:read,inventory:write,personal:read,personal:write,stats:read,users:read,users:write
```

- La key (`vvk_…`) se muestra **una sola vez**. Se guarda **hasheada** (pepper: `MCP_KEY_PEPPER` o `NUXT_SESSION_PASSWORD`).
- Sin `--email` usa el primer usuario ADMIN.
- Los scopes se validan en cada tool (**deny-by-default**).

### Scopes

| Scope | Permite |
|---|---|
| `catalog:read` / `catalog:write` | Leer / crear-editar-archivar colecciones, items, tags, rareza |
| `files:write` | Registrar archivos por URL (allowlist) |
| `inventory:read` / `inventory:write` | Leer / registrar movimientos y lotes |
| `personal:read` / `personal:write` | Colección personal y wishlist del dueño de la key |
| `stats:read` | Métricas del dashboard (admin) |
| `users:read` / `users:write` | Listar/obtener usuarios / cambiar rol (admin) |
| `keys:read` / `keys:write` | Listar/crear/revocar las API keys del dueño |

> Las claves también se pueden crear y gestionar **desde la UI** en `/settings` (menú de usuario → Configuración).

### Crear una key en producción

El hash usa `MCP_KEY_PEPPER` (o `NUXT_SESSION_PASSWORD` si no está definido).
Producción ya tiene un **`MCP_KEY_PEPPER` propio** en
`/var/www/vault-app/current/.env`. Para crear una key que valide en producción,
usa ese pepper y el `DATABASE_URL` de producción:

```bash
PGPASS=$(ssh hostinger "sed -n 's/^POSTGRES_PASSWORD=//p' /root/apps/docker-postgres-db/.env | tr -d '\"'")
PEPPER=$(ssh hostinger "sed -n 's/^MCP_KEY_PEPPER=//p' /var/www/vault-app/current/.env | tr -d '\"'")
DATABASE_URL="postgresql://volt3d-coins:${PGPASS}@72.61.55.208:5432/vault-volt3d" \
MCP_KEY_PEPPER="$PEPPER" \
pnpm mcp:key --name "Claude" --scopes catalog:read,personal:read
```

> El pepper es un secreto: **no lo commitees**. Rotarlo invalida todas las keys existentes.

## 2. Conectar un cliente

Header obligatorio: `Authorization: Bearer vvk_…` (nunca por query string; solo HTTPS).

**opencode** (`opencode.json`):

```jsonc
{
  "mcp": {
    "volt-vault": {
      "type": "remote",
      "url": "https://vault.volt-3d.store/mcp",
      "oauth": false,
      "headers": { "Authorization": "Bearer {env:VVAULT_MCP_KEY}" }
    }
  }
}
```

**Clientes solo-stdio** (Claude Desktop, Cursor…) vía `mcp-remote`:

```json
{
  "mcpServers": {
    "volt-vault": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://vault.volt-3d.store/mcp",
               "--header", "Authorization: Bearer vvk_…"]
    }
  }
}
```

**curl** (JSON-RPC):

```bash
curl -s https://vault.volt-3d.store/mcp \
  -H "Authorization: Bearer $VVAULT_MCP_KEY" -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## 3. Superficie

**Tools (37)**:
- **Catálogo (lectura)**: `list_collections`, `get_collection`, `list_tags`, `list_items`, `get_item`, `list_files`.
- **Catálogo (escritura)**: `create_collection`, `update_collection`, `publish_collection`, `archive_collection`*, `upsert_tag`, `create_item` (acepta `spec`), `update_item` (acepta `spec`), `set_item_rarity`, `archive_item`*, `register_file_url`.
- **Inventario**: `list_inventory_movements`, `list_inventory_batches`, `adjust_stock`, `create_inventory_batch`.
- **Personal**: `list_my_collection`, `get_my_stats`, `collect_item`, `uncollect_item`, `add_wishlist`, `remove_wishlist`.
- **Gamificación**: `get_my_achievements`, `list_achievements`*, `recompute_gamification`*.
- **Configuración (API keys)**: `list_api_keys`, `create_api_key`, `revoke_api_key`*.
- **Admin**: `get_admin_stats`, `get_public_stats`, `list_users`, `get_user`*, `set_user_role`*.

`*` = destructivo: requiere `confirm: true`.

**Resources**: `voltvault://collections`, `voltvault://collections/{slug}`,
`voltvault://items/{slug}`, `voltvault://me/stats`, `voltvault://admin/stats`.

**Prompts**: `describe_collection`, `suggest_item_description`, `summarize_inventory`.

## 4. Seguridad

- **Deny-by-default** por scope; scopes admin requieren rol `ADMIN`.
- **`confirm: true`** en acciones destructivas.
- **Rate limit**: 60 req/min por key → `429`.
- **Auditoría**: cada invocación en `McpAuditLog` (args redactados, duración, resultado).
- **Anti-SSRF**: `register_file_url` solo `/uploads/…`, `https://images.unsplash.com` o `https://makerworld.bblmw.com`.
- **Sin cookies**: solo bearer; HTTPS obligatorio. Las keys son revocables/expirables.
- Los tools llaman a los `services` (route → service → DB); nunca Prisma directo.

## 5. Verificación

```bash
MCP_KEY=$(pnpm mcp:key --scopes catalog:read | grep '^vvk_') node scripts/e2e-mcp.mjs
MCP_KEY=… MCP_WRITE=1 node scripts/e2e-mcp.mjs   # incluye escritura/inventario/personal/admin
```
