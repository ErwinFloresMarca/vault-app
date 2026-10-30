# Spec: Módulo 19 — Importación de colecciones desde MakerWorld

> Feature nueva. Permite a un **ADMIN** pegar la URL de una colección (o de un
> modelo) de MakerWorld y traer sus productos a Volt Vault, creando una
> colección nueva o reutilizando una existente. La importación es **idempotente**
> (`sourceUrl` único) y las imágenes se **hotlinkean** desde el CDN de MakerWorld.

## Objetivo

1. Pegar una URL de colección de MakerWorld y ver un **preview** (título, autor,
   portada, número de modelos y qué items ya existen).
2. Elegir destino: **colección nueva** (nombre editable) o **existente**.
3. Importar por lotes, con progreso y resultado por item (creado / actualizado /
   omitido / error).
4. Reimportar sin duplicar: el mismo modelo actualiza o se omite, nunca se
   inserta dos veces.
5. Mostrar autor, licencia y enlace al original en la descripción del item.

## Decisiones (aprobadas por el usuario)

- **No** se usa Puppeteer/Playwright para scrapear: MakerWorld expone una API
  JSON interna que responde sin Cloudflare para estas rutas. Playwright se usa
  solo para verificar la UI en local.
- Imágenes: **hotlink** al CDN (`makerworld.bblmw.com`), con
  `?x-oss-process=image/resize,w_1200/format,webp` para servir ~68 KB en vez
  del original de 4 MB.
- Solo **datos básicos**: nombre, descripción, imágenes, autor y licencia. **No**
  se importan precio, tags, ficha técnica ni stock (stock queda en 0 y se
  gestiona con inventario).
- Destino flexible: colección nueva o existente.
- Licencias: se muestran y se avisa; **no** se bloquea la importación (decisión
  del admin).

## Fuente (verificado el 2026-10-30)

Base: `https://api.bambulab.com/v1/design-service` (o
`https://makerworld.com/api/v1/design-service`; ambos responden igual).

| Dato | Endpoint |
| --- | --- |
| Metadata de colección | `GET /favorites/{collectionId}` |
| Modelos de colección (paginado) | `GET /favorites/{collectionId}/designs?offset=&limit=` (limit máx. probado: 100; usar 50) |
| Detalle de modelo | `GET /design/{designId}` |

Cabeceras necesarias:

```http
Accept: application/json
Origin: https://makerworld.com
Referer: https://makerworld.com/
X-BBL-Client-Type: web
X-BBL-Client-Version: 00.00.00.01
X-BBL-App-Source: makerworld
X-BBL-Client-Name: MakerWorld
```

Campos usados del detalle: `id`, `title`, `slug`, `summary` (HTML),
`coverUrl`, `instances[].pictures[].url`, `designCreator.{name,handle}`,
`license`, `licenseDescriptionInfo`.

**Riesgo Cloudflare**: en ráfagas devuelve `403` con HTML "Just a moment...".
El cliente MUST espaciar peticiones (~350 ms), limitar concurrencia a 1-2 y
reintentar `403/429/5xx` con backoff (2 s, 6 s, 12 s). Si persiste, error claro
para reintentar en unos minutos.

## Modelo de datos

- `CollectionItem.sourceUrl String? @unique`: URL canónica estable
  `https://makerworld.com/en/models/{id}`. Nullable para items manuales.
  Postgres permite múltiples `NULL`.
- Sin campos nuevos de precio/licencia/stock. La licencia y autoría van en
  `description` (Markdown) para mostrarse en la ficha pública.
- `File` reutiliza el modelo existente. Se registran URLs del CDN; no se suben
  binarios.

## API admin

Ambas rutas requieren `requireAdmin(event)`.

### `POST /api/admin/import/makerworld/resolve`

Body: `{ url: string }`.

Respuesta:

```ts
{
  success: true,
  data: {
    source: { type: 'collection' | 'model', collectionId?: number, title: string, total: number },
    suggestedCollectionName: string,
    items: Array<{
      id: number,
      title: string,
      creator: { name: string, handle: string } | null,
      coverUrl: string | null,
      sourceUrl: string,
      existing: { itemId: string, collectionId: string, collectionName: string } | null
    }>
  }
}
```

- Acepta `.../collections/{id}-{slug}`, `.../models/{id}-{slug}` y IDs numéricos.
- Para colecciones pagina hasta agotar `total` (máx. 500; si supera, 422 con
  mensaje para dividir).
- No escribe en BD.

### `POST /api/admin/import/makerworld/batch`

Body:

```ts
{
  modelIds: number[],            // 1..25 por lote
  collectionId?: string,         // destino existente
  newCollection?: { name: string, description?: string },
  itemStatus?: 'DRAFT' | 'AVAILABLE',   // default DRAFT
  collectionStatus?: 'DRAFT' | 'PUBLISHED', // default DRAFT (solo si crea)
  updateExisting?: boolean,      // default false
  setCollectionCover?: boolean   // default true (solo colección nueva)
}
```

Respuesta:

```ts
{
  success: true,
  data: {
    collectionId: string,
    created: number,
    updated: number,
    skipped: number,
    errors: Array<{ id: number, message: string }>,
    items: Array<{ id: number, itemId?: string, action: 'created'|'updated'|'skipped', license?: string }>
  }
}
```

- Crea la colección en el primer lote si no hay `collectionId`.
- `sourceUrl` determina create vs update vs skip.
- Update solo toca `name`, `description`, `files` (no status, rarity, stock ni
  colección).
- `slug` = slug de MakerWorld; si colisiona, sufijo `-2`, `-3`… (misma regla que
  el resto del catálogo).
- Imágenes: `coverUrl` + fotos de instancias (dedupe), máximo 10, `position`
  por orden.
- Portada de colección nueva: primera imagen del primer item importado, solo si
  la colección no tiene portada.

## UI: `/admin/import`

- Entrada "URL de MakerWorld" + botón **Analizar**.
- Preview: colección, total, tabla con portada, título, autor y badge
  "Ya importado" (con su colección).
- Destino: radio/segmento **Nueva colección** / **Existente**.
  - Nueva: nombre (prefill con el título de MakerWorld) y descripción.
  - Existente: selector de colecciones.
- Opciones: estado de items, estado de colección (solo nueva), actualizar
  existentes.
- Botón **Importar N items** → procesa en lotes de 20 con `UProgress` y resumen.
- Aviso legal visible: la licencia estándar de MakerWorld **prohíbe vender las
  impresiones**; el admin debe comprobar cada licencia.
- Enlace al final: "Ver colección" y "Ver item".
- Entrada **Importar** en el sidebar admin (`i-lucide-cloud-download`).

## Guardar foto en local (m19.1)

MakerWorld puede borrar una imagen; para que un item no dependa del CDN:

- Botón **“Guardar foto en local”** en `/admin/items` (acción de fila y modal de
  edición), visible solo si la imagen principal es remota (`makerworld.bblmw.com`
  o `images.unsplash.com`).
- Botón **“Guardar todas las fotos en local”** cuando el item tiene más de una
  imagen remota. Procesa hasta 50 imágenes con concurrencia 2; si una falla, las
  demás continúan y el resumen indica cuántas se guardaron/omitieron/fallaron.
- `POST /api/admin/files/{id}/localize` (ADMIN): descarga la imagen (timeout
  20 s, máx. 5 MB, MIME de imagen + sniff de magic bytes), la escribe en
  `public/uploads/{uuid}.{ext}` y actualiza **el mismo** `File`
  (`url`/`path`/`mimeType`/`size`). Conserva `ItemFile`/`CollectionFile`.
- `POST /api/admin/items/{id}/localize-images` (ADMIN): localiza todas las
  imágenes remotas del item y devuelve `{ total, localized, skipped, failed,
  files[] }`. Tolera fallos parciales.
- Idempotente: si la URL ya es `/uploads/...`, no descarga. Un 409 evita dos
  descargas simultáneas del mismo archivo.
- `GET /uploads/{filename}` sirve los binarios en producción (Nitro solo publica
  `.output`; `public/uploads` persiste entre deploys). Solo nombres UUID con
  extensión de imagen, cache inmutable y sin path traversal.
- En la UI, `AppImage` sirve las rutas `/uploads/...` con `provider="none"`: IPX
  en producción solo lee `.output/public` y devolvería 404 para los uploads de
  runtime. Las URLs remotas sí siguen pasando por IPX.
- Si la descarga falla, la URL remota se mantiene y el admin ve un toast de error.

## Requisitos (RFC-2119)

- Un no-ADMIN MUST recibir 401/403 en ambas rutas.
- La importación MUST ser idempotente por `sourceUrl`.
- El preview MUST NOT escribir en BD.
- La descripción MUST incluir autor, licencia y enlace al original.
- El servidor MUST NOT aceptar URLs ni hosts fuera de la allowlist de MakerWorld
  para las imágenes (`makerworld.bblmw.com`).
- Las peticiones a MakerWorld MUST tener timeout (15 s), throttling y backoff.
- El import MUST NOT modificar stock ni `soldQuantity`.
- Si una imagen falla, el item MUST importarse igual (sin esa imagen).
- Guardar una foto en local MUST NOT cambiar el id del `File` ni romper sus
  relaciones; MUST validar host, MIME y tamaño antes de escribir.
- La localización masiva MUST continuar si una imagen falla y MUST devolver el
  resultado por archivo.
- `/uploads/<filename>` MUST servir solo nombres UUID con extensión de imagen.

## Criterios de aceptación

- Pegar una colección pública de 22 modelos muestra 22 filas y el total correcto.
- Importar a una colección nueva crea la colección + items, con portada y autor.
- Reimportar con "actualizar" no duplica; sin "actualizar" omite.
- Un modelo individual (`/models/{id}`) también se puede importar.
- El item público muestra imágenes, descripción con atribución y licencia.
- “Guardar foto en local” convierte la URL en `/uploads/...`, la imagen sigue
  cargando y el botón desaparece.
- “Guardar todas las fotos en local” convierte todas las imágenes remotas de un
  item y muestra un resumen con guardadas/omitidas/fallidas.
- `pnpm exec eslint .`, `pnpm typecheck` y la verificación Playwright en verde.
- Sin errores de consola en `/admin/import`.

## Boundaries

- **Always**: `requireAdmin`; validar IDs numéricos; throttle/backoff; allowlist
  de hosts de imagen; `sourceUrl` único; no tocar stock.
- **Never**: usar Puppeteer/Playwright en el servidor de producción; aceptar
  HTML sin sanear en `description`; descargar binarios de imágenes; exponer
  licencias como si fueran permiso de venta.

## Archivos previstos

- `prisma/schema.prisma` (+ migración `add_item_source_url`).
- `server/services/makerworldService.ts` (cliente API + normalización).
- `server/services/makerworldImportService.ts` (preview, lotes, BD).
- `server/routes/api/admin/import/makerworld/resolve.post.ts`.
- `server/routes/api/admin/import/makerworld/batch.post.ts`.
- `pages/admin/import.vue`.
- `layouts/admin.vue` (nav).
- `types/index.ts` (contratos).
- `server/services/fileService.ts` (allowlist CDN).
- `nuxt.config.ts` (`image.domains`).
- `docs/specs/PLAN.md`, `AGENTS.md`.

## Fases

1. **Schema + servicios**: `sourceUrl`, cliente MakerWorld, import service.
2. **API**: resolve + batch.
3. **UI**: `/admin/import` + nav.
4. **Verificación**: migración, lint, typecheck, Playwright, commit/Linear.

## Estado

- Fase 1: ☑ `sourceUrl` + migración `20261030120000_add_item_source_url`; cliente
  `makerworldService` (throttle/backoff/caché) e `makerworldImportService`.
- Fase 2: ☑ `POST /api/admin/import/makerworld/resolve` y
  `POST /api/admin/import/makerworld/batch` (lotes de 25, idempotencia,
  portada automática, descripción con atribución).
- Fase 3: ☑ `/admin/import` con preview, destino nuevo/existente, selección por
  item, progreso y resumen; entrada en el sidebar admin.
- Fase 4: ☑ `prisma migrate deploy`, `eslint`, `typecheck`, `nuxt build` y
  verificación Playwright (preview, import a colección existente, ficha pública
  con imágenes y licencia). Datos de prueba eliminados.
- Fase 5 (m19.1): ☑ botón “Guardar foto en local”, `POST
  /api/admin/files/:id/localize`, ruta `GET /uploads/<filename>` para servir
  uploads en producción, allowlist MCP/documentación actualizada.
- Fase 6 (m19.1): ☑ “Guardar todas las fotos en local” +
  `POST /api/admin/items/:id/localize-images` (lote con resultado parcial).

## As-built (notas de implementación)

- Base API usada: `https://api.bambulab.com/v1/design-service`.
- El lote de la UI es de 20 modelos; el servidor acepta hasta 25.
- `resolve` devuelve como máximo 500 modelos por colección.
- Al importar a una colección existente, el primer lote envía `collectionId`;
  la UI conserva ese ID para los siguientes lotes.
- La portada de una colección nueva se toma del primer item creado con imagen.
- `updateExisting` está desactivado por defecto: reimportar omite los existentes
  salvo que el admin lo active.
- Las imágenes se guardan con `?x-oss-process=image/resize,w_1200/format,webp`.
- MakerWorld puede devolver 403 tras ráfagas; el cliente reintenta con backoff
  (2/6/12 s) y espacia las peticiones 350 ms.
