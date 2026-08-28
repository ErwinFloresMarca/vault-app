# Spec: Módulo 01 — Base del proyecto

## Objetivo
Preparar el proyecto Nuxt para Volt Vault: limpiar artefactos de la app Volt3D original, definir layouts, y
montar el scaffold de Atomic Design para el frontend. Catálogo coleccionable estéticamente ligado a la cultura
geek / impresión 3D.

## Stack
Nuxt 4.4, Vue 3.5, TypeScript, @nuxt/ui 4, Tailwind v4, @nuxt/content (MDC).

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm eslint .`
- Typecheck: `pnpm exec nuxi typecheck`

## Project Structure
```
assets/css/main.css        estilos base + tema Tailwind
layouts/default.vue        layout público con header/nav + footer
layouts/admin.vue          layout del panel admin
layouts/minimal.vue        layout login/auth
components/atoms/          botones, badges, tags, inputs, imágenes, indicadores
components/molecules/      CollectionCard, ItemCard, SearchBar, TagList, StockStatus, gallery
components/organisms/      grids y secciones (CollectionGrid, CollectionHeader, ItemGrid, ItemDetail…)
components/templates/      CollectionPage, ItemPage, AdminDashboard, etc.
```

## Code Style
`<script setup lang="ts">` en TS; comentarios y copy en español. Componentes reutilizables con props/emits tipados,
sin lógica de negocio en la UI.

## Testing Strategy
Sin framework aún; verificación manual + typecheck.

## Boundaries
- **Always**: typecheck antes de commit; seguir Atomic Design; copy en español.
- **Ask first**: agregar dependencias; tocar `nuxt.config.ts` salvo lo ya previsto.
- **Never**: escribir lógica de negocio en componentes; conservar componentes de Volt3D.

## Success Criteria
- La app arranca y renderiza el catálogo base sin referencias a Volt3D (impresión/servicio).
- Existen `layouts/` (default, minimal, admin) y carpetas de Atomic Design pobladas con componentes v1 (mínimos).
- El header/footer permiten navegar Home, Colecciones y Login.
