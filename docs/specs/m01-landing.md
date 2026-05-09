# Spec: Modulo 1 - Landing Page

## Objetivo
Mostrar la empresa y proyectos terminados para captar clientes. La galeria es publica y no requiere login.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> paginas publicas
- server/ -> endpoints para proyectos publicados
- content/ -> contenido estatico (si aplica)
- public/ -> assets publicos

## Estilo de codigo
```ts
// Ejemplo: tipos simples y nombres claros
export type ProjectCard = {
  id: string
  title: string
  category: string
  imageUrl: string
  publishedAt: string
}
```
- Nombres en ingles para tipos y props; textos UI en espanol.
- Prefiere composables para carga de datos publicos.

## Estrategia de testing
- Manual: revisar rendering en desktop y mobile.
- Validar que la galeria no requiere login.

## Limites
- Siempre: validar datos de entrada del admin antes de publicar.
- Preguntar primero: cambios de SEO global o rutas publicas.
- Nunca: exponer endpoints de admin en la landing.

## Criterios de exito
- Home con hero, servicios y proyectos destacados.
- Galeria con filtros por categoria.
- Pagina de contacto + formulario de presupuesto.
- Proyectos publicados visibles sin login.

## Preguntas abiertas
- Ninguna.
