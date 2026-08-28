# Spec: Módulo 02 — Database

## Objetivo
Definir y aplicar el modelo de datos de Volt Vault en la base PostgreSQL dedicada `vault-volt3d` (creada en el
Postgres Docker activo `coin-holder-db`). Regenerar el cliente Prisma y crear el seed inicial.

## Stack
Prisma 7.8 (drivers `@prisma/adapter-pg`), PostgreSQL 16. Alias `@gen-prisma/client`. `DATABASE_URL` en `.env`
apunta a `postgresql://volt3d-coins:@127.0.0.1:5432/vault-volt3d`.

## Commands
- Generar cliente: `pnpm db:generate`
- Migración: `pnpm db:migrate -- --name init` (o `pnpm exec prisma migrate dev --name init`)
- Seed: `pnpm db:seed` / `pnpm db:reset`

## Entities (schema.prisma)
`User`, `OAuthAccount`, `File`, `Collection`, `CollectionItem`, `Tag`, `CollectionTag`, `CollectionFile`,
`ItemFile`, `UserCollectedItem`, `InventoryMovement`.
Enums: `UserRole`(USER|ADMIN), `CollectionStatus`(DRAFT|PUBLISHED|ARCHIVED),
`ItemStatus`(DRAFT|AVAILABLE|SOLD_OUT|ARCHIVED), `InventoryMovementType`(IN|OUT|ADJUSTMENT|SALE).

## Reglas clave
- `CollectionItem.stock` y `soldQuantity` están denormalizados; se actualizan atómicamente con cada
  `InventoryMovement` dentro de una transacción (ver m08-inventory).
- `UserCollectedItem` tiene `@@unique([userId, itemId])`.
- `File` es la tabla central de archivos; colecciones/items enlazan M:N vía `CollectionFile`/`ItemFile`
  con `position` (0 = portada/principal) y `alt`.
- Slug único para `Collection` y `CollectionItem`.

## Boundaries
- **Always**: `pnpm db:generate` tras tocar `schema.prisma`; cambios de schema piden migrate.
- **Never**: editar `generated/prisma` a mano; usar la BD `volt3d-coins` u otras existentes.

## Success Criteria
- La migración inicial se aplica correctamente en `vault-volt3d` (sin borrar la BD de coin-holder).
- El seed crea al menos 3 colecciones con items, tags y archivos de ejemplo.
- El cliente Prisma compila con `@gen-prisma/client`.
