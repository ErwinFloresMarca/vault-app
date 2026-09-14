# Spec: Módulo 10 — SEO

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
SEO/SSR: sitemap y robots dinámicos, y metadata (`useSeoMeta`) por página.

## Endpoints (dinámicos, no prerender)
- `GET /sitemap.xml` (`server/routes/sitemap.xml.ts`) — incluye `/`,
  `/collections`, colecciones `PUBLISHED` y items no `ARCHIVED` cuya colección es
  `PUBLISHED`. Base URL: `process.env.SITE_URL` (fallback
  `https://local.volt-vault.dev`).
- `GET /robots.txt` (`server/routes/robots.txt.ts`) — `Disallow: /admin/`,
  `Allow: /` y apunta al sitemap.

`nuxt.config.ts` define `nitro.prerender.crawlLinks = false`; los handlers se
sirven dinámicamente (el prerender de rutas server no era fiable).

## Metadata (`useSeoMeta`)
Implementado en: home, `/collections`, `/collections/[slug]`,
`/collections/[collectionSlug]/[itemSlug]`, `/me` y páginas admin. Títulos
dinámicos por entidad (p. ej. ``item.name + ' — Volt Vault'``).

## Metadata por entidad (implementado)
- Colección (`/collections/[slug]`) e item (`/collections/[collectionSlug]/[itemSlug]`)
  generan: `title`, `description` derivada del Markdown
  (`utils/seo.ts#metaDescription`), `og:title`, `og:description`, `og:type`
  (`website`/`article`), `og:url`, `og:image` (portada/imagen principal
  absolutizada con `absoluteUrl`), `twitter:card` y `<link rel="canonical">`.
- Base del sitio: `runtimeConfig.public.siteUrl` (env `NUXT_PUBLIC_SITE_URL` o
  `SITE_URL`; default `http://localhost:3000`).
- Nuxt ya renderiza las meta por SSR; no se usa `useServerSeoMeta` explícito.

## Pendiente
- `og:image` para la home y `/collections` (índice) aún sin definir.

## Reglas
- El contenido clave (catálogo) se sirve por SSR; no depende de JS de cliente.
- El sitemap solo indexa contenido publicado.

## Boundaries
- **Always**: mantener el sitemap alineado con `CollectionStatus`/`ItemStatus`.
- **Never**: indexar rutas `/admin/`.

## Success Criteria (verificado)
- `/sitemap.xml` y `/robots.txt` responden y son correctos.
- Las páginas exponen `title` por entidad vía SSR.
