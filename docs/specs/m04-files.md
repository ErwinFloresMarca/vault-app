# Spec: Módulo 04 — Files (archivos e imágenes)

## Objetivo
Sistema de archivos: tabla `File` central que almacena url (web o `/uploads/...` local) y opcionalmente ruta en
disco. Endpoints para subir archivos localmente a `public/uploads`. Colecciones e items se vinculan a `File` vía
`CollectionFile`/`ItemFile` (M:N).

## Commands
- Dev: `pnpm dev`
- Subida (admin): `POST /api/admin/files` (multipart), devuelve el `File` creado.
- Listar (auth): `GET /api/files`

## Reglas
- Solo admin puede subir archivos (guard de rol).
- Validación: tamaño máximo, MIME permitido (p. ej. jpeg/png/webp). Nunca confiar solo en el frontend.
- El archivo se guarda en `public/uploads/<uuid>.<ext>` y se crea un registro `File` con `url=/uploads/...`,
  `path`, `mimeType`, `size`.
- Archivos referenciados por URL externa también se pueden registrar como `File` (sin `path`).

## Boundaries
- **Always**: validar MIME y tamaño; sanitizar nombre de archivo.
- **Never**: permitir subidas sin autenticación admin; ejecutar scripts de archivos subidos.

## Success Criteria
- Un admin puede subir una imagen y obtener una URL servible.
- El `File` queda disponible para enlazar a una colección o item.
