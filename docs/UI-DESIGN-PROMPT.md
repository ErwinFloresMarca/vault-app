# Prompt de diseño UI/UX — Volt Vault

> Pégalo tal cual en la IA especializada en diseño de interfaces.

---

## ROL

Actúa como **diseñador/a UI/UX senior** especializado en **interfaces web responsivas, modernas y de alta conversión** para plataformas de **coleccionables**. Dominas design systems, mobile-first, accesibilidad, microinteracciones y gamificación. Entregas especificaciones claras, no solo inspiración.

## OBJETIVO

Diseña el **sistema visual completo** y las **pantallas** de **Volt Vault**, una plataforma web donde los usuarios **descubren productos coleccionables, forman su colección y siguen su progreso**. El resultado debe ser:

- **Responsivo real** (mobile-first, tablet y desktop).
- **Llamativo y adictivo** para un coleccionista (sensación de logro, recompensa, rareza, "quiero completarla").
- **Moderno y premium**, con el **producto como protagonista**.
- **Consistente y accesible** (WCAG AA).

## PÚBLICO

Coleccionistas de 18–45 años, cultura pop/geek, uso mayoritariamente **móvil**. Valoran: descubrir productos, completar colecciones, rarezas, progreso y compartir logros.

## REGLAS DE CONTENIDO (IMPORTANTE)

- **NO mencionar procesos de fabricación ni la palabra "3D"**. Habla siempre de **"productos", "piezas", "figuras", "coleccionables"**.
- Copy y microcopy en **español**, tono directo, cercano y con actitud de coleccionista.
- El **producto** aporta el color; la interfaz debe realzarlo.

## MARCA (punto de partida — puedes proponer una evolución)

- **Nombre:** Volt Vault. Logotipo: placa/insignia circular con rayo.
- **Personalidad:** energética, tipo "arcade" premium, técnica pero divertida.
- **Paleta actual como referencia (puedes mejorarla):**
  - Base clara: blanco / gris claro; superficies oscuras: navy `#0A1A2F` / `#0E2340`.
  - Acento interactivo principal: **Volt Blue `#1E90FF`**.
  - Acento de energía: **amarillo `#FFD700`**.
  - **Rareza**: común `#64748B`, rara `#1E90FF`, épica `#A855F7`, legendaria `#FFD700`.
- **Tipografía actual:** sans neo-grotesca (Inter como sustituto). Puedes proponer la definitiva y su escala.
- Estilos vigentes a considerar o superar: botones/badges tipo **pill**, etiquetas en **MAYÚSCULAS** con tracking amplio, sensación de "ficha técnica/manifiesto".

## RESTRICCIONES TÉCNICAS / CALIDAD

- **Responsive**: define breakpoints (móvil, tablet, desktop) y comportamiento por pantalla.
- **Accesibilidad**: contraste AA, foco visible, etiquetas, errores anunciados, objetivos táctiles ≥ 44 px.
- **Motion**: microinteracciones con propósito; respeta `prefers-reduced-motion`.
- **Rendimiento percibido**: skeletons, estados vacíos, errores y éxitos bien resueltos.
- **Modo oscuro**: opcional, propón si aporta.

## APARTADOS DEL PROYECTO (todas las pantallas a diseñar)

### Público
1. **Inicio / Catálogo (`/`)**
   - Hero con **collage de productos** reales y doble CTA ("Ver colecciones", "Mi colección").
   - Sección de **colecciones destacadas**.
   - Datos: colecciones (portada, nombre, nº de productos), progreso del usuario si hay sesión.
2. **Listado de colecciones (`/collections`)**
   - Grid de tarjetas de colección (portada o **fallback** con iniciales, nombre, nº de productos, etiquetas, **anillo de progreso** del usuario).
   - **Buscador**, **filtro por etiqueta**, **orden** (destacados / A-Z / recientes), **contador de resultados**, **paginación** y **barra de filtros sticky**.
   - Estados: carga (skeletons), sin resultados, error.
3. **Detalle de colección (`/collections/[slug]`)**
   - Portada, nombre, descripción (texto enriquecido), etiquetas.
   - **Progreso del usuario**: anillo/medidor con "X / Y conseguidos" y %; estado "Colección completada".
   - Grid de productos de la colección.
4. **Detalle de producto (`/collections/[colección]/[producto]`)**
   - **Galería** con miniaturas y **lightbox** (ampliar, anterior/siguiente).
   - Nombre, colección (enlace), **badges de estado** (disponible/agotado/borrador) y **badge de rareza**.
   - **Disponibilidad/stock**.
   - Descripción.
   - Acciones: **"Conseguir / Conseguido"** (con **celebración**: confeti + toast + logro "¡Colección completada!") y **wishlist "Lo quiero / En mi lista"**.
   - **Contadores sociales**: "N lo tienen", "N lo quieren".
   - **CTA sticky inferior en móvil**.
5. **Mi colección (`/me`)**
   - **Progreso global** (anillo), items conseguidos, colecciones completadas.
   - Grid de productos conseguidos (con su colección).
   - Estado vacío que invite a explorar.
6. **Login (`/login`)** — OAuth con Google y Facebook (sin contraseña).
7. **Error de autenticación (`/auth/error`)**.
8. **Privacidad (`/privacy`)** y **Términos (`/terms`)** — páginas legales con mucho texto (tipografía de lectura).

### Admin (área interna, layout propio)
9. **Dashboard (`/admin/dashboard`)**
   - Tarjetas de métricas: nº colecciones, nº productos, nº usuarios, elementos conseguidos.
   - **Ventas**: total y promedio.
   - **Top 5 más vendidos** (producto, colección, vendidos, stock).
   - **Actividad reciente** (quién consiguió qué y cuándo), tipo timeline.
10. **Colecciones admin (`/admin/collections`)**
    - Tabla **CRUD**: crear/editar/archivar; campos: nombre, descripción, estado (borrador/publicada/archivada), etiquetas, portada/galería.
11. **Productos admin (`/admin/items`)**
    - Tabla **CRUD**: crear/editar/archivar; campos: nombre, colección, estado, **rareza**, stock, imágenes. Alta con **stock inicial**.
12. **Inventario (`/admin/inventory`)**
    - Filtros (colección, búsqueda), listado de productos con stock.
    - **Alta por lote** (varios productos a la vez) con tipo **IN / OUT / ADJUSTMENT / SALE**, motivo y **cliente** (obligatorio en salidas/ventas).
    - **Movimiento individual**.
    - **Historial de lotes** paginado (tipo, motivo, quién registró, cliente, colección, fecha).

## DATOS QUE MANEJA EL SISTEMA (para que el diseño los contemple)

- **Producto (item):** nombre, identificador/slug, descripción, **stock**, **vendidos**, **estado** (borrador / disponible / agotado / archivado), **rareza** (común / rara / épica / legendaria), **galería de imágenes**, colección a la que pertenece, **nº de coleccionistas que lo tienen**, si el usuario lo tiene o está en su wishlist.
- **Colección:** nombre, slug, descripción, **estado** (borrador / publicada / archivada), orden de exhibición, **portada** y galería, **etiquetas**, **nº de productos** y **progreso del usuario** (total, conseguidos, %).
- **Etiqueta:** nombre, slug.
- **Archivo/imagen:** URL, tipo MIME, tamaño.
- **Usuario:** nombre, email, avatar, **rol** (usuario / administrador), último acceso, proveedores de login (Google/Facebook).
- **Colección personal:** qué productos tiene el usuario y **cuándo** los consiguió.
- **Wishlist:** productos deseados.
- **Inventario:** **movimientos** (tipo IN/OUT/AJUSTE/VENTA, cantidad, motivo, quién lo registra, cliente), **lotes** (agrupación de movimientos, colección, motivo, personas).
- **Métricas:** conteos, ventas totales y promedio, top de vendidos, actividad reciente.

## ESTADOS Y PATRONES A DEFINIR

- **Loading / Empty / Error / Success** en cada pantalla y componente.
- **Formularios**: validación, ayudas, mensajes de error claros.
- **Modales, toasts, tabs, selects, tablas, paginación, badges, tooltips**.
- **Gamificación**: progreso, rarezas, logros, celebración al conseguir, wishlist.
- **Navegación**: header con logo/insignia, enlaces, avatar/menú de usuario; footer con enlaces legales; navegación admin (sidebar/panel).

## ENTREGABLES

1. **Sistema de diseño**: tokens (color, tipografía + escala, espaciado, radios, sombras, motion) en JSON/CSS.
2. **Biblioteca de componentes**: variantes, tamaños y estados de cada uno.
3. **Especificaciones por pantalla**: layout, jerarquía, componentes usados, comportamiento responsive y microinteracciones.
4. **Guía de accesibilidad** (contraste, foco, táctil, motion).
5. **Ejemplos de copy** (botones, estados vacíos, errores, logros).
6. Opcional: wireframes/mockups por breakpoint y una versión **dark**.

## CRITERIOS DE ÉXITO

- Un coleccionista entiende en < 5 s cómo explorar, conseguir y seguir su progreso.
- La **rareza y el progreso** se leen de un vistazo.
- Flujo **móvil** impecable (acciones al alcance del pulgar).
- Interfaz **consistente, accesible y responsiva** en todos los apartados.
- El **producto** es siempre el protagonista visual.
