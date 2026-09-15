# Volt Vault — Plan de Implementación

Catálogo de coleccionables impresos en 3D para **Volt-3D**. Nuxt 4 full-stack (frontend + REST API + SEO),
base de datos relacional PostgreSQL dedicada (`vault-volt3d`) en el Postgres Docker activo `coin-holder-db`.

## Decisiones de arquitectura (aprobadas)

- **Dominio reescrito desde cero**: la app anterior (Volt3D, servicio de impresión 3D) NO contiene los modelos de
  Volt Vault. `prisma/schema.prisma` queda rehecho solo para el catálogo de coleccionables, conservando la infra de
  auth OAuth existente.
- **Roles**: `USER` | `ADMIN` (uppercase), rol por defecto al registrarse = `USER`. El admin se asigna manualmente en BD.
- **Auth**: SOLO OAuth Google + Facebook vía `nuxt-auth-utils`. Sin passwords propios.
- **Imágenes/archivos**: tabla central `File` (url + opcional path local `/uploads`). Colecciones e items enlazan a
  `File` mediante relaciones M:N (`CollectionFile`, `ItemFile` con `position` 0=portada/principal y `alt`).
- **Stock/vendido**: `CollectionItem.stock` y `CollectionItem.soldQuantity` son valores denormalizados que se actualizan
  ATÓMICAMENTE dentro de una transacción junto con la creación de cada `InventoryMovement` (IN/OUT/ADJUSTMENT/SALE).
  `soldQuantity` acumula movimientos de tipo SALE.
- **Atomic Design** en `components/{atoms,molecules,organisms,templates}`.
- **Backend por capas**: `server/routes/api` (HTTP) → validación → `server/services` (lógica) → `server/repositories` (ORM) → DB.
- **Versión 1**: se persiste `soldQuantity` como campo para métricas; el modelo ya permite evolucionar a
  `Order`/`OrderItem`/`Payment` sin rediseñar.

## Entidades

`User`, `OAuthAccount`, `File`, `Collection`, `CollectionItem`, `Tag`, `CollectionTag`, `CollectionFile`, `ItemFile`,
`UserCollectedItem`, `InventoryMovement`.

## Estructura de páginas (públicas y admin)

```
/                            catálogo (hero, colecciones destacadas, items destacados)
/collections                 listado de colecciones
/collections/[slug]          detalle de colección + items + progreso del usuario
/collections/[collection]/[item]   detalle de item (galería, estado, botón "Conseguido")
/login                       OAuth
/auth/error                  error OAuth
/admin/dashboard             métricas + tabla de ventas
/admin/collections           CRUD colecciones
/admin/items                 CRUD items
```

## Fases (cada una con commit en `main`)

1. **Base** — limpieza de la app Volt3D, layouts, scaffold Atomic Design, rutas públicas base.
2. **Database** — migración inicial en `vault-volt3d`, regenerar cliente, seed de Volt Vault.
3. **Auth** — ajustar callbacks a rol `USER`/`ADMIN`, `me`, `logout`, guards, páginas login/error.
4. **Files** — endpoints de subida local a `public/uploads` y reuso de `File`.
5. **Colecciones** — CRUD admin + API pública + páginas públicas de colección.
6. **Items** — CRUD admin + galería + API pública + página pública de item.
7. **Colección personal** — `POST/DELETE /api/items/:id/collect`, `GET /api/me/collection`, progreso por colección.
8. **Inventario** — `InventoryMovement` + transacciones atómicas + ajuste de stock.
9. **Dashboard admin** — métricas, tabla de ventas (ordenar/filtrar/buscar/paginar), top items y colecciones.
10. **SEO** — metadata dinámica (SEO/OG/canonical), sitemap, robots.
11. **Verificación final** — `db:generate`, typecheck, build, revisión general.

## Estado

| Módulo | Spec | Implementado |
|--------|------|--------------|
| Base | m01-base.md | ☑ |
| Database | m02-database.md | ☑ |
| Auth | m03-auth.md | ☑ |
| Files | m04-files.md | ☑ |
| Colecciones | m05-collections.md | ☑ |
| Items | m06-items.md | ☑ |
| Colección personal | m07-me-collection.md | ☑ |
| Inventario | m08-inventory.md | ☑ |
| Dashboard | m09-dashboard.md | ☑ |
| SEO | m10-seo.md | ☑ |
| Volt Arcade | m11-volt-arcade.md | ◐ (fase 1 ☑; gamificación 3/4) |

## Desviaciones respecto al plan original

- **No existe capa `server/repositories/`**: los servicios importan `prisma`
  directamente desde `server/utils/db.ts`. La dirección real es
  `route → service → Prisma`.
- **Middleware cableado** (SEL-32): `middleware/auth.global.ts` (allowlist de
  rutas públicas) + `middleware/admin.ts` en `/admin/*`. Ya no hay páginas sin
  redirección de UX.
- **Tokens de `DESIGN.md` cableados** (SEL-34) y reglas de componente aplicadas
  (SEL-40/42): botones/badges pill + uppercase y peso único 400 global
  (`app.config.ts` + `main.css`).
- **Inventario con batches y personas** (no previsto en el plan): se añadió el
  modelo `InventoryBatch` y los campos `registeredBy*` / `customer*` en batch y
  movimiento. Documentado en `m08-inventory.md`.
- **Dashboard simplificado**: solo se implementó `GET /api/admin/dashboard/stats`
  (conteos + top + actividad reciente). No existen `/api/admin/sales` ni la tabla
  de ventas ordenable/filtrable/paginable del plan.
- **Catálogo público con filtros** (SEL-39): `GET /api/collections` soporta
  `tag`, `q`, `page`, `pageSize`; nuevo `GET /api/tags`. UI con búsqueda, filtro
  por etiqueta y paginación.
- **SEO por entidad implementado** (SEL-38): `canonical`, `og:image/title/description`
  y `description` derivada del Markdown vía `utils/seo.ts`. Pendiente: `og:image`
  en home e índice de colecciones.
- **Specs as-built**: los 10 specs se reconstruyeron desde el código el
  2026-09-13 para reflejar la implementación real, no el plan inicial.

## Follow-ups abiertos (Linear SEL)
- `SEL-32` cablear middleware auth/admin en páginas.
- `SEL-33` corregir errores de eslint en `server/services`.
- `SEL-34` cablear tokens de `DESIGN.md` en `assets/css/main.css`.
