# Spec: Módulo 04 — Files (archivos e imágenes)

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
Tabla central `File` (url + path opcional) que almacena imágenes locales servidas
desde `public/uploads` o URLs externas. Colecciones/items se enlazan M:N vía
`CollectionFile`/`ItemFile`.

## Endpoints
- `POST /api/admin/files` — **requiere ADMIN**. Multipart con campo `file`.
  Valida MIME (`image/jpeg|png|webp|gif`) y tamaño máx. **5 MB**; guarda en
  `public/uploads/<uuid><ext>` y crea `File` (`url=/uploads/...`, `path`,
  `mimeType`, `size`). Responde `{ success, file }`.
- `GET /api/files` — requiere `requireUser`. Devuelve el array de `File`
  ordenado por `createdAt desc` (sin envoltorio `data`).
- `GET /uploads/<filename>` — ruta pública de Nitro (`server/routes/uploads/`)
  que sirve los binarios de `public/uploads`. Necesaria en producción porque el
  deploy solo publica `.output`; `public/uploads` se conserva entre deploys.
  Solo acepta nombres UUID con extensión de imagen y cachea de forma inmutable.
  En la UI, `AppImage` usa `provider="none"` para `/uploads/...` (IPX solo lee
  `.output/public` en producción).
- `POST /api/admin/files/:id/localize` — requiere ADMIN. Descarga una imagen
  remota permitida a `public/uploads` y actualiza el mismo `File` (m19.1).

`server/routes/api/admin/files.ts` es un handler único (no valida método: siempre
intenta procesar la subida).

## Reglas
- El enlace a colección/item no ocurre aquí: se hace pasando `fileIds` a los
  endpoints de colección/item (m05/m06), que crean las filas de unión con
  `position = índice`.
- Archivos externos (Unsplash y el CDN de MakerWorld) se registran como `File`
  con `url` y sin `path` (ver `seed.ts` y m19). Se pueden localizar con
  `POST /api/admin/files/:id/localize`.
- Nunca se confía solo en el frontend: MIME/tamaño se validan en el servidor.
- Los binarios no se commitean a git (viven en `public/uploads`).

## UI
`components/molecules/ImageField.vue` (subida + preview) se usa en
`pages/admin/collections.vue` y `pages/admin/items.vue`.

## Boundaries
- **Always**: validar MIME y tamaño en el servidor.
- **Never**: permitir subidas sin `requireAdmin`; ejecutar scripts subidos.

## Success Criteria (verificado)
- Un admin sube una imagen y obtiene una URL servible (`/uploads/...`).
- El `File` puede enlazarse a una colección o item vía `fileIds`.
- `GET /uploads/<uuid>.<ext>` sirve el binario tanto en dev como en producción.
- `POST /api/admin/files/:id/localize` convierte una URL remota en `/uploads/...`
  sin romper los enlaces del item/colección.
