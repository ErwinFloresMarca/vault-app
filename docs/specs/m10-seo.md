# Spec: Módulo 10 — SEO

## Objetivo
Optimización SEO/SSR: metadata dinámica (title/description/OG/canonical) por colección e item, sitemap y robots.

## Stack
Capacidades de Nuxt (SSR). `useSeoMeta`, `useServerSeoMeta`, prerender config en `nuxt.config.ts`.

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`

## Reglas
- Cada página de colección y item genera metadata dinámica: `title`, `description`, `og:image` (portada /
  imagen principal), `canonical`.
- `/sitemap.xml` indexa colecciones e items publicados (páginas reales, no placeholder).
- `/robots.txt` permite rastreo del catálogo.
- No depender de JS cliente para contenido indexable (el catálogo debe reflejarse en SSR).

## Boundaries
- **Always**: usar SSR para el contenido clave; metadata por entidad.
- **Never**: duplicar contenido solo en cliente.

## Success Criteria
- `/sitemap.xml` y `/robots.txt` servidos y correctos.
- Las páginas de colección/item exportan title/description/OG/canonical correctos.
