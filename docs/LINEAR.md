# Sincronización con Linear

El proyecto **Volt Vault** está en Linear: 10 issues de módulos (Done) y 3
follow-ups (Todo). Esta guía explica cómo está conectado y cómo seguir usándolo.

- **Proyecto:** [Volt Vault](https://linear.app/self-proyects/project/volt-vault-65fb0f09e1fb)
- **Equipo:** `SEL` (Self-proyects) — `d0c462a2-9155-4a8f-96dd-2421c9d545a8`
- **Project ID:** `7916140d-655c-47fb-b59d-1614f6c32f40`

## 1. Configuración del MCP

El MCP oficial de Linear se declara en la **config global** de opencode
(`~/.config/opencode/opencode.json`):

```jsonc
"linear": {
  "type": "remote",
  "url": "https://mcp.linear.app/mcp",
  "enabled": true,
  "oauth": false,
  "headers": { "Authorization": "Bearer {env:LINEAR_API_KEY}" }
}
```

- `LINEAR_API_KEY` (Linear → Settings → API → Personal API keys) vive en
  `~/.zshrc`; **nunca** se commitea.
- **No redeclares `linear` en el `opencode.json` del proyecto.** La config de
  proyecto sustituye a la global por nombre y volvería a OAuth (que aquí daba
  401 `invalid_token`).
- Reinicia opencode tras cambiar la config. Verifica con `opencode mcp list`
  (`✓ linear connected`).

> El endpoint `/sse` está deprecado; usa siempre `https://mcp.linear.app/mcp`.

## 2. Proyecto e issues (ya importados)

| Issue | Estado | Label | Spec |
|---|---|---|---|
| SEL-22 Base del proyecto y scaffold Atomic Design | Done | `area:base` | `m01-base.md` |
| SEL-23 Base de datos, migraciones y seed | Done | `area:db` | `m02-database.md` |
| SEL-24 Auth OAuth y guards | Done | `area:auth` | `m03-auth.md` |
| SEL-25 Gestión de archivos e imágenes | Done | `area:files` | `m04-files.md` |
| SEL-26 Colecciones: CRUD y API pública | Done | `area:catalog` | `m05-collections.md` |
| SEL-27 Items: CRUD, galería y página pública | Done | `area:catalog` | `m06-items.md` |
| SEL-28 Colección personal del usuario | Done | `area:user` | `m07-me-collection.md` |
| SEL-29 Inventario y movimientos atómicos | Done | `area:inventory` | `m08-inventory.md` |
| SEL-30 Dashboard admin y métricas | Done | `area:admin` | `m09-dashboard.md` |
| SEL-31 SEO: metadata, sitemap y robots | Done | `area:seo` | `m10-seo.md` |
| SEL-32 Cablear middleware de auth/admin en las páginas | Todo | `area:auth` | — |
| SEL-33 Corregir errores de eslint en server/services | Todo | `area:chore` | — |
| SEL-34 Cablear tokens de DESIGN.md en assets/css/main.css | Todo | `area:design` | — |

La descripción de cada issue de módulo contiene la spec completa.

## 3. Vincular commits e issues (auto-sync)

Linear detecta la referencia en la **rama, el título del PR o el commit body**.
El identificador del equipo es `SEL`:

```
feat(SEL-26): añadir filtro por estado en el catálogo
```

- Rama: `type/SEL-<n>-descripcion-corta` (ej. `feat/SEL-27-galeria-items`).
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Al hacer push/PR, Linear mueve el issue según la automatización configurada.

## 4. Integración GitHub ↔ Linear

1. Linear → **Settings → Integrations → GitHub** y conecta
   `ErwinFloresMarca/vault-app`.
2. Vincula el equipo `SEL` al repo.
3. Las PR que mencionen `SEL-<n>` actualizan el issue automáticamente.

## Notas

- El repo no contiene secretos: `opencode.json` solo declara `$schema`.
- Workspaces distintos requieren contextos de auth distintos; no reutilices la
  misma sesión para dos workspaces.
