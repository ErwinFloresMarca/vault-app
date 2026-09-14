# Spec: Módulo 02 — Database

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
Modelo de datos de Volt Vault en PostgreSQL con Prisma 7, migraciones y seed
inicial. Base dedicada `vault-volt3d` (el `DATABASE_URL` real vive en `.env`).

## Stack
Prisma 7.8 (`prisma-client`) + adapter `@prisma/adapter-pg`. Cliente generado en
`generated/prisma` (gitignored). Alias `@gen-prisma/client`. `prisma.config.ts`
define schema y carpeta de migraciones; el datasource usa `DATABASE_URL` del `.env`.

## Commands
- `pnpm db:generate` — regenera el cliente (obligatorio tras clonar o editar schema)
- `pnpm db:migrate` / `pnpm db:reset` / `pnpm db:seed`

## Entidades (`prisma/schema.prisma`)
`User`, `OAuthAccount`, `File`, `Collection`, `CollectionItem`, `Tag`,
`CollectionTag`, `CollectionFile`, `ItemFile`, `UserCollectedItem`,
`InventoryBatch`, `InventoryMovement`.

Enums:
- `UserRole`: `USER | ADMIN` (default `USER`)
- `CollectionStatus`: `DRAFT | PUBLISHED | ARCHIVED`
- `ItemStatus`: `DRAFT | AVAILABLE | SOLD_OUT | ARCHIVED`
- `InventoryMovementType`: `IN | OUT | ADJUSTMENT | SALE`

Migraciones aplicadas:
`20260828041137_init`, `20260829033622_add_inventory_batch`,
`20260829041955_add_person_to_inventory`.

## Reglas clave
- `CollectionItem.stock` y `soldQuantity` son **denormalizados**; solo se
  actualizan atómicamente dentro de la transacción de `InventoryMovement`
  (`server/services/inventoryService.ts`). Ver m08.
- `UserCollectedItem`: `@@unique([userId, itemId])` → colección idempotente.
- `File.url` es único; `CollectionFile`/`ItemFile` enlazan M:N con `position`
  (0 = portada/principal) y `alt`. `ItemFile`/`CollectionFile` únicos por par.
- `Collection.slug` y `CollectionItem.slug` son únicos.
- `InventoryBatch` agrupa movimientos; `collectionId` es **opcional** (null =
  global / varias colecciones). Personas: `registeredBy*` y `customer*`
  (userId/name/email), con FK opcionales a `User`.

## Seed (`prisma/seed.ts`)
Idempotente (upserts): 6 tags, 2 colecciones PUBLISHED ("Animalitos Flexibles",
"Criaturas Fantásticas"), 3 items (Gato/Perro/Zorro) con archivos de Unsplash, y
movimientos de ejemplo IN/SALE que dejan stock y `soldQuantity` consistentes.

## Boundaries
- **Always**: `pnpm db:generate` tras tocar `schema.prisma`.
- **Never**: editar `generated/prisma` a mano; usar la BD de otros proyectos.

## Success Criteria (verificado)
- Las 3 migraciones se aplican en `vault-volt3d`.
- El seed crea 2 colecciones con items, tags y archivos de ejemplo.
- El cliente compila con `@gen-prisma/client`.
