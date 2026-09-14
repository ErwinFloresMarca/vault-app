# Sincronización con Linear

Este proyecto usa el **MCP oficial de Linear** para crear y actualizar issues
desde el agente. El servidor ya está declarado en `opencode.json`.

## 1. Autenticación (una sola vez)

El MCP se carga al arrancar opencode; tras editar `opencode.json` hay que
**reiniciar opencode**. Luego:

1. En la sesión, ejecuta `/mcps` y selecciona `linear`, **o** en una terminal:

   ```bash
   opencode mcp auth linear
   ```

2. Se abre el navegador con el flujo OAuth de Linear. Autoriza el workspace.
3. Verifica la conexión:

   ```bash
   opencode mcp list
   ```

Si tu build no expone `opencode mcp auth`, usa el panel de MCP en la UI de
opencode. Como alternativa (token), descomenta en `opencode.json`:

```jsonc
"oauth": false,
"headers": { "Authorization": "Bearer {env:LINEAR_API_KEY}" }
```

…y define `LINEAR_API_KEY` en tu entorno (nunca la commitees).

### Si `opencode mcp list` muestra `linear failed` (timeout)

Es normal **antes** de autenticar: el servidor exige OAuth y la conexión inicial
agota el timeout. Tras autenticar debe aparecer `✓ linear connected`.

### Si tras autenticar sigue el 401 (`invalid_token`)

`opencode mcp debug linear` puede mostrar `Auth status: ✓ authenticated` pero el
servidor responde `401 Missing or invalid access token`. Suele ser un token
expirado o de otro workspace. Solución:

```bash
opencode mcp auth linear     # vuelve a autorizar el workspace correcto
```

Si persiste, usa una **API key** de Linear (Settings → API → Personal API keys)
y cambia el bloque MCP a `oauth: false` + header `Authorization: Bearer`.

## 2. Crear el proyecto e importar los módulos

Las specs viven en `docs/specs/` y el plan en `docs/specs/PLAN.md`. Una vez
autenticado, pide al agente:

> Crea el proyecto "Volt Vault" en Linear e importa los 10 módulos de
> `docs/specs/PLAN.md` como issues, con labels por área.

Mapeo sugerido (1 issue por módulo, orden del plan):

| Issue | Spec | Label |
|---|---|---|
| Base: scaffold, layouts, rutas | `m01-base.md` | `area:base` |
| Base de datos y seed | `m02-database.md` | `area:db` |
| Auth OAuth y guards | `m03-auth.md` | `area:auth` |
| Gestión de archivos/imágenes | `m04-files.md` | `area:files` |
| Colecciones: CRUD + público | `m05-collections.md` | `area:catalog` |
| Items: CRUD + galería | `m06-items.md` | `area:catalog` |
| Colección personal del usuario | `m07-me-collection.md` | `area:user` |
| Inventario y movimientos | `m08-inventory.md` | `area:inventory` |
| Dashboard admin | `m09-dashboard.md` | `area:admin` |
| SEO: metadata, sitemap, robots | `m10-seo.md` | `area:seo` |

Todos los módulos están implementados (ver tabla de estado en `PLAN.md`), así que
sugerido crearlos ya en estado **Done** o como proyecto histórico.

## 3. Vincular commits e issues (auto-sync)

Linear detecta la referencia en la **rama, el título del PR o el commit body**:

```
feat(VLT-123): añadir filtro por estado en el catálogo
```

- Convención de rama: `type/VLT-123-descripcion-corta` (ej. `feat/VLT-42-galeria-items`).
- Conventional Commits del repo: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Al hacer push/PR, Linear mueve el issue a *In Progress* / *Done* según configure.

## 4. Integración GitHub ↔ Linear

1. En Linear: **Settings → Integrations → GitHub** y conecta
   `ErwinFloresMarca/vault-app`.
2. Vincula cada equipo de Linear a un repo.
3. A partir de ahí, las PR que mencionen `VLT-<n>` actualizan el issue solas.

## Notas

- `opencode.json` no contiene secretos: solo la URL del MCP y OAuth.
- El servidor remoto es `https://mcp.linear.app/mcp` (Streamable HTTP). El
  endpoint `/sse` está deprecado.
- Workspaces distintos requieren contextos de auth distintos; no reutilices la
  misma sesión para dos workspaces.
