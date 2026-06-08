# Spec: Modulo 1 - Landing Page

## Objetivo
Mostrar Volt3D y proyectos terminados para captar clientes. La galeria es publica y no requiere login.
URL: volt3d.erfm.dev

## Brand
- Nombre: Volt3D
- Slogan: "Impresión 3D con Voltaje"
- Logo: 3 variantes (icon, full, icon con glow)
- Colores:
  - Azul claro (V): #3498DB
  - Gris oscuro (círculo): #34495E
  - Amarillo (rayo): #F1C40F
  - Blanco (contorno V): #FFFFFF
  - Amarillo-naranja (3D): #E67E22

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui + Tailwind CSS
- Backend: Node API
- DB: Postgres
- Assets: SVG y PNG optimizados en /public

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
```
pages/
  index.vue          -> home (hero + servicios + portfolio + cta)
  galeria.vue        -> galeria completa con filtros
  contacto.vue       -> formulario de contacto

server/
  routes/
    api/
      proyectos.ts   -> GET /api/proyectos (filtro, promocion)

public/
  logos/             -> logo variants
  assets/            -> imagenes staticaspaths
```

## Secciones de Home
1. **Hero**: imagen estatica con slogan y CTA
2. **Servicios**: 3-4 cards estaticas describiendo capacidades
3. **Portfolio destacado**: 4-6 proyectos con filtro "promocion"
4. **CTA Contacto**: llamada a accion a pagina de contacto
5. **Footer**: redes, links utiles, sitemap, newsletter

## Galeria de Proyectos
- Pagina dedicada `/galeria`
- Filtro por "promocion" (campo booleano en proyecto)
- Ordenamiento: proyectos con promocion primero, luego recientes
- Lazy load de imagenes
- Responsive grid (3 cols desktop, 2 tablet, 1 mobile)

## Formulario Contacto
- Pagina `/contacto`
- Campos: nombre, email, telefono, mensaje
- Simple (sin presupuesto automatico; M3 maneja cotizaciones)
- Validacion cliente + servidor
- Email notificacion al admin

## Estilo de codigo
```ts
// Tipos publicos
export type ProjectPublic = {
  id: string
  title: string
  imageUrl: string
  description: string
  publishedAt: string
  isPromoted: boolean
}

export type ContactForm = {
  name: string
  email: string
  phone: string
  message: string
}
```
- Nombres en ingles para tipos; UI en espanol.
- Composables para carga de datos publicos.
- Assets importados desde /public.

## SEO y Metadatos
- Meta tags dinamicos: title, description, og:image por pagina
- Meta tags estaticos por proyecto (si aplica)
- Sitemap XML generado en /public/sitemap.xml
- Schema.org para Organization y Product (proyectos)
- Robots.txt en /public

## Performance
- LCP < 2.5s (medido con Lighthouse)
- Lazy loading obligatorio para imagenes
- Compresion de assets (SVG, WebP)
- Cache-busting en assets

## Responsividad
- Mobile-first con breakpoints Tailwind (sm, md, lg, xl)
- Testear: iPhone 12, iPad, desktop 1920px

## Estrategia de testing
- Manual: hero, navegacion links, galeria con filtros.
- Manual: responsive en mobile y desktop.
- Manual: formulario contacto valida y envia.
- Manual: imagenes cargan con lazy load.
- Validar que galeria no requiere login.

## Limites
- Siempre: validar datos entrada admin antes publicar.
- Siempre: lazy load imagenes (performance).
- Preguntar primero: cambios SEO global o rutas publicas.
- Nunca: exponer endpoints admin en landing.
- Nunca: permitir cambios de contenido sin revision.

## Criterios de exito
- Home completa: hero, servicios, portfolio, CTA, footer.
- Galeria `/galeria` con filtro promocion y lazy load.
- Pagina `/contacto` con formulario validado.
- Meta tags + sitemap + schema.org activos.
- LCP < 2.5s medido.
- Mobile responsive (RWD).

## Preguntas resueltas
- Hero: imagen estatica ✓
- Secciones: servicios, portfolio, contacto ✓
- Galeria: filtro "promocion destacada" ✓
- Contenido: hardcoded excepto proyectos dinamicos ✓
- Formulario presupuesto: simple contacto (M3 maneja cotizaciones) ✓
- SEO: meta tags + sitemap + schema ✓
- Performance: LCP + lazy load ✓
- Responsivo: mobile-first ✓
- URL: volt3d.erfm.dev ✓

## Preguntas abiertas
- Ninguna.
