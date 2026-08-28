# Spec: Módulo 07 — Colección personal

## Objetivo
Permitir a un usuario autenticado marcar/desmarcar items como conseguidos y consultar su colección y progreso.
Base para futura gamificación (perfil de coleccionista, intercambio, etc.).

## Commands
- Dev: `pnpm dev`

## API (requieren auth)
- `POST /api/items/:id/collect` — marca el item como conseguido por el usuario actual.
- `DELETE /api/items/:id/collect` — desmarca.
- `GET /api/me/collection` — items conseguidos por el usuario actual.
- `GET /api/me/collections/:slug/progress` — progreso (X/Y, %) en una colección.

## Reglas
- `UserCollectedItem` con `@@unique([userId, itemId])` → operaciones idempotentes (upsert/deleteMany).
- Endpoint `collect` solicita el item por id (no slug) o acepta slug; definir convención: aceptar `/:id`.
- Solo afectan al usuario de la sesión (`/api/me`).

## Success Criteria
- Un usuario puede marcar/desmarcar items y ver su lista conseguida.
- La página de colección muestra el progreso en % y los items conseguidos.
- No se permiten duplicados (restricción única).
