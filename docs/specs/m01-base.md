# Spec: Módulo 01 — Base del proyecto

> **Spec as-built** (reconstruida desde la implementación). Refleja el código
> real, no el plan original.

## Objetivo
App Nuxt 4 full-stack SSR para Volt Vault: catálogo de coleccionables impresos en
3D. Establece layouts, Atomic Design, rutas base y configuración del stack.

## Stack
Nuxt 4.4, Vue 3.5, TypeScript 5.9, `@nuxt/ui` 4, Tailwind v4 (`assets/css/main.css`
importa `tailwindcss` + `@nuxt/ui`), `@nuxt/content`, `@nuxt/icon` (Lucide),
`@nuxt/image`, `@nuxt/fonts`, `@nuxt/eslint`, `nuxt-auth-utils`.

## Commands
- Dev: `pnpm dev` (`:3000`)
- Build: `pnpm build` / `pnpm generate` / `pnpm preview`
- Lint: `pnpm exec eslint .` (no hay script `lint`)

## Estructura real
```
app.vue                     UApp > NuxtLayout > NuxtPage
layouts/default.vue         público (header/nav + footer)
layouts/admin.vue           panel admin (UDashboard*)
layouts/minimal.vue         login/auth
components/atoms/           AppImage, StatusBadge, StockIndicator, TagBadge,
                            MarkdownContent
components/molecules/       CollectionCard, ItemCard, ItemGallery, TagList,
                            ImageField, InventoryModal, CollectionBatchModal
components/organisms/       CollectionGrid, ItemGrid
pages/                      índex, collections, me, login, auth/error,
                            privacy, terms, admin/*
composables/                useAuth, useCollectItem
types/index.ts              tipos de dominio compartidos
```
No existe `components/templates/` (el plan original lo preveía; no se usó).

## Reglas de implementación
- Los componentes de `atoms/molecules/organisms` se registran **sin prefijo** en
  `nuxt.config.ts` (`<CollectionCard>`, no `<MoleculesCollectionCard>`).
- `alias['@gen-prisma']` apunta a `./generated/prisma`; no cambiar.
- `@nuxt/hints` desactiva lazyLoad/htmlValidate/webVitals/hydration.
- `@nuxt/image` permite el dominio `images.unsplash.com` (provider `ipx`).
- Copy y comentarios en español; `<script setup lang="ts">`.

## Boundaries
- **Always**: usar Atomic Design; registrar componentes vía `nuxt.config.ts`.
- **Ask first**: añadir dependencias o módulos a `nuxt.config.ts`.
- **Never**: lógica de negocio en componentes; referencias a la app Volt3D previa.

## Success Criteria (verificado)
- `pnpm dev` arranca y renderiza el catálogo sin referencias a Volt3D.
- Existen los 3 layouts y las carpetas de Atomic Design pobladas.
- Header/footer permiten navegar Home, Colecciones y Login.
