# Spec: Módulo 17 — OG Image social generada

> **Spec nueva.** Issue: `SEL-131`. Complementa `m10-seo.md` (que cubre
> sitemap, robots y `useSeoMeta`); aquí solo la imagen social.
> Tokens y tipografía según `DESIGN.md` post-rediseño Cyber-Luxe (m13).

## Problema

Verificado en producción v0.4.0 (`https://vault.volt-3d.store`, 2026-10-03):
`/` y `/collections` exponen **la misma** imagen:

```html
<meta property="og:image" content="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600">
```

Causa raíz: ambas páginas hacen `absoluteUrl(<coverImage de la primera colección>)`
— `pages/index.vue:35` y `pages/collections/index.vue:44`.

Fallas concretas:

1. **Resolución insuficiente.** `?w=600` entrega 600 px de ancho; Open Graph pide
   ≥ 1200×630. Se ve borrosa en WhatsApp, Facebook y LinkedIn.
2. **Dependencia externa en el camino crítico.** El `og:image` depende de que
   `images.unsplash.com` responda. Un 404 o un rate-limit rompe la card en
   silencio: el HTML sigue válido, la previsualización sale vacía.
3. **Sin fallback.** `absoluteUrl(undefined)` devuelve `undefined`, así que si no
   hay colecciones publicadas —o la primera no tiene portada— **no se emite el
   tag `og:image`**.
4. **Home e índice son indistinguibles.** Compartirlos produce la misma card.
5. **Sin `og:image:width` / `height` / `alt`.** Los crawlers adivinan el ratio.

`pages/collections/[slug].vue:16` y `pages/collections/[collectionSlug]/[itemSlug].vue:53`
también hacen `absoluteUrl` de la portada; quedan migradas a `defineOgImage`
para que la card sea uniforme y no dependa de la portada.

## Objetivo

Generar cards 1200×630 por entidad con plantillas Vue renderizadas por
`nuxt-og-image`, para que compartir el catálogo en redes muestre una card de
marca y no una foto de terceros.

## Decisiones

- **Renderer: `satori`** (no takumi). Para una card tipográfica el rendimiento no
  es un factor y satori es la opción más battle-tested.
- **Card tipográfica, sin portada embebida.** Los covers son URLs remotas; meter
  una `<img>` en satori añade un fetch externo por render, o sea que
  reintroduce la fragilidad que este spec elimina.
- **1200×630, no el default del módulo (1200×600).** Se fija explícitamente
  porque 1200×630 es lo que espera Open Graph.
- **Plantillas:** dos componentes. Una de colección (nombre + nº de items) y una
  genérica con prop `label`, para que home y `/collections` no se vean iguales.

### Tokens (post Cyber-Luxe, `DESIGN.md:19-33` y `assets/css/main.css:6-15`)

| Uso | Token | Valor |
|---|---|---|
| Fondo | `--color-ink` | `#0a1a2f` |
| Acento primario | `--color-gold` | `#ffd700` |
| Acento secundario | `--color-volt` | `#1e90ff` |
| Texto | `--color-text` | `#F8FAFC` |

### Tipografía

`DESIGN.md` post-rediseño **ya no es "peso único 400"**: usa dos familias
declaradas en `assets/css/main.css:8-9`.

| Rol | Familia | Peso |
|---|---|---|
| Headline / `label-caps` | Plus Jakarta Sans (`--font-display`) | 700 |
| Body | Hanken Grotesk (`--font-sans`) | 400 |

Consecuencia práctica: el módulo resuelve fuentes **solo** vía `@nuxt/fonts`, y
exige `global: true`. El proyecto tiene `@nuxt/fonts` instalado pero **sin bloque
`fonts:` en `nuxt.config.ts`** — hay que crearlo.

## Tareas

1. **Dependencias** — `pnpm add -D nuxt-og-image` y
   `npx nuxt-og-image enable satori`. El segundo paso instala `satori` y
   `@resvg/resvg-js`. **Hay que commitear el `package.json` resultante**: el
   módulo nunca edita dependencias cuando no hay TTY (CI, piped stdin) y el
   build de producción falla si el renderer no está instalado.
2. **Fuentes** — añadir a `nuxt.config.ts`:
   ```ts
   fonts: {
     families: [
       { name: 'Plus Jakarta Sans', weights: [700], global: true },
       { name: 'Hanken Grotesk', weights: [400], global: true },
     ],
   }
   ```
   Sin `global: true` el renderer no encuentra la fuente y sale la tipografía por
   defecto. Con el provider de Google se descarga el formato compatible con
   satori automáticamente.
3. **`ogImage` en `nuxt.config.ts`** — registrar `nuxt-og-image` en `modules` y:
   ```ts
   ogImage: {
     defaults: { width: 1200, height: 630, extension: 'png', cacheMaxAgeSeconds: 60 * 60 * 24 * 30 },
     buildCache: true,
   }
   ```
4. **Plantillas** en `components/OgImage/` (`componentDirs` del módulo ya cubre
   ese directorio):
   - `VoltVaultCollection.satori.vue` — fondo `--color-ink`, eyebrow
     `VOLT VAULT` en Jakarta 700 uppercase, nombre de la colección en
     `--font-display`, filete `--color-gold`, nº de items en Hanken 400.
   - `VoltVaultGeneric.satori.vue` — misma base; la prop `label` distingue home
     de índice de colecciones.
5. **Páginas** — reemplazar el `ogImage` manual por `defineOgImage(...)`:
   - `/` → `VoltVaultGeneric`, `label: 'Catálogo completo'`
   - `/collections` → `VoltVaultGeneric`, `label: 'Todas las colecciones'`
   - `/collections/[slug]` → `VoltVaultCollection` con nombre y nº de items
   - `/collections/[collectionSlug]/[itemSlug]` → `VoltVaultCollection`

   En `pages/index.vue` eso **elimina** la línea 35 y deja `absoluteUrl` sin uso
   (se va el import de la línea 4). El computed de la línea 21 sobrevive: el hero
   lo consume en la línea 103.
6. **`routeRules`** — cachear `/__og-image__/**` con `public, max-age=31536000,
   immutable`. El proyecto **no define `routeRules`** hoy; se introduce el bloque.
7. **Limpieza** — `useSeoMeta({ ogImage })` y `defineOgImage` son excluyentes en
   la misma página: nunca ambos, o se duplican los meta.

## Verificación a hacer durante la implementación

- El build de CI no edita dependencias: confirmar que `satori` y
  `@resvg/resvg-js` quedan **commiteados** en `package.json`.
- `@resvg/resvg-js` es binario nativo: confirmar que `pnpm build` lo empaqueta y
  que corre en la VPS (linux x64).
- La config `components:` es explícita (solo `atoms`/`molecules`/`organisms`):
  confirmar que el módulo registra igual `components/OgImage/`.
- Comprobar que la tipografía sale Jakarta/Hanken y no la fallback: es el fallo
  silencioso más probable de esta fase.

## Reglas

- **Always**: los `og:image` se generan en 1200×630 y se sirven desde el dominio
  propio; nunca se expone una URL de tercero como `og:image`.
- **Always**: Plus Jakarta Sans 700 para display, Hanken Grotesk 400 para body,
  ambas `global: true`.
- **Never**: `<img src>` con origen remoto dentro de la plantilla.
- **Never**: hardcodear hex en la plantilla; usar los tokens de `main.css`.
- **Never**: asumir el peso único 400 — ese era el sistema pre-Cyber-Luxe.

## Boundaries

- `components/OgImage/` — solo plantillas satori. Nada de lógica de negocio ni
  llamadas a Prisma dentro (los datos llegan por props).
- No se toca `utils/seo.ts` más allá de lo que exija quitar el `ogImage`
  manual; `metaDescription` y `absoluteUrl` siguen igual de usados.

## Estado

- **☑ Implementado** `SEL-131`. `nuxt-og-image` + satori/`@resvg/resvg-js` en
  `dependencies`; `ogImage` (1200×630, png, `buildCache`) y `fonts` (`global: true`)
  en `nuxt.config.ts`; plantillas `components/OgImage/{VoltVaultCollection,VoltVaultGeneric}.satori.vue`;
  `defineOgImage` en `/`, `/collections`, detalle de colección e item (se quitó el
  `og:image` manual). Verificado: las 4 rutas emiten `og:image` + `width/height/type`
  apuntando al propio dominio `/_og/…`, y la imagen renderiza PNG 1200×630 con la
  tipografía correcta (Jakarta/Hanken). `pnpm build` OK (con resvg nativo); eslint/typecheck 0.

## Success Criteria

- `curl` de `/`, `/collections`, una colección y un item devuelve `og:image`
  apuntando a `/__og-image__/...` del propio dominio, 1200×630.
- El tag existe **siempre**, incluso con cero colecciones publicadas.
- Home y `/collections` devuelven cards visualmente distintas.
- `pnpm exec eslint .` y `pnpm typecheck` limpios.
- Verificado en la app desplegada, no solo en local: los crawlers de Facebook y
  LinkedIn cachean la imagen nueva y no reusan la antigua.