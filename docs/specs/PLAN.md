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
| Base | m01-base.md | ☐ |
| Database | m02-database.md | ☐ |
| Auth | m03-auth.md | ☐ |
| Files | m04-files.md | ☐ |
| Colecciones | m05-collections.md | ☐ |
| Items | m06-items.md | ☐ |
| Colección personal | m07-me-collection.md | ☐ |
| Inventario | m08-inventory.md | ☐ |
| Dashboard | m09-dashboard.md | ☐ |
| SEO | m10-seo.md | ☐ |
