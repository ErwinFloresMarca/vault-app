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

---

# ANEXO A — Campos, etiquetas y textos exactos de la UI

Usa estos textos como base (puedes mejorarlos, pero respeta su significado y no
introduzcas referencias a fabricación). Entre `«...»` va el **texto/label exacto**
actual.

## A.1 Navegación (sitio público)

- Header — marca: insignia + «Volt Vault».
- Header — enlaces: «Inicio», «Colecciones».
- Header — usuario sin sesión: botón «Iniciar sesión».
- Header — menú de usuario (con sesión): «Mi colección», «Panel admin» (solo
  administradores), «Cerrar sesión».
- Footer: «© {año} Volt Vault», enlaces «Colecciones», «Privacidad», «Términos».
  (Reemplazar el texto legal actual por una descripción centrada en el
  producto/coleccionable.)

## A.2 Login (`/login`)

- Título: «Inicia sesión».
- Subtítulo: «O crea una cuenta nueva».
- Botones OAuth: «Continuar con Google», «Continuar con Facebook».
- Pie: «Al continuar, aceptas nuestros **Términos de Servicio** y **Política de
  Privacidad**.»
- (Reemplazar el tagline actual por uno centrado en el producto/coleccionable.)

## A.3 Inicio (`/`)

- Etiqueta superior: «Volt Vault».
- Titular: «Colecciona. Descubre. Completa.»
- Descripción: plataforma para explorar colecciones, seguir tu progreso y completar tu colección.
- CTAs: «Ver colecciones», «Mi colección».
- Sección: «Colecciones destacadas».

## A.4 Listado de colecciones (`/collections`)

- **Filtros:** buscador con placeholder «Buscar colección...»; selector de etiqueta
  con opción por defecto «Todas las etiquetas»; selector de **orden** con
  «Destacados», «Nombre A-Z», «Más recientes».
- **Contador:** «{N} colección» / «{N} colecciones».
- **Tarjeta de colección:** nombre; «{N} item» / «{N} items»; etiquetas «#{nombre}»;
  anillo de progreso del usuario; fallback de portada con iniciales.
- **Estados:** carga (skeletons); vacío «Sin resultados» / «No hay colecciones que
  coincidan con tu búsqueda.»; error «Error al cargar colecciones».

## A.5 Detalle de colección (`/collections/[slug]`)

- Nombre + etiquetas.
- Progreso del usuario: «Tu progreso», «{X} / {Y} conseguidos», «Colección
  completada» (al 100 %). Anillo con «{percent}%» y label «completado».
- Descripción (texto enriquecido).
- Subtítulo de items: «Items»; vacío: «Esta colección aún no tiene items publicados.»
- Enlace de vuelta en el detalle de item: «← {nombre de la colección}».

## A.6 Detalle de producto (`/collections/[colección]/[producto]`)

- **Badge de estado:** «Borrador», «Disponible», «Agotado», «Archivado».
- **Badge de rareza:** «Común», «Rara», «Épica», «Legendaria».
- **Disponibilidad/stock:** «Disponible ({N})», «¡Últimas {N} unidades!», «Agotado».
- **Acciones:**
  - Conseguir: «Conseguir» → «Conseguido».
  - Wishlist: «Lo quiero» → «En mi lista».
  - Sin sesión: «Inicia sesión para marcar este elemento como conseguido»
    (y, en CTA sticky móvil, «Inicia sesión»).
- **Contadores sociales:** «{N} lo tienen», «{N} lo quieren».
- **Galería:** ampliar (icono), navegación «Imagen anterior» / «Imagen siguiente»,
  miniaturas.
- **Feedback:** toast «¡Conseguido!» (con el nombre del producto); logro
  «¡Colección completada!» / «Has conseguido todos los items de esta colección.»

## A.7 Mi colección (`/me`)

- Título: «Mi colección».
- Descripción: «Hola {nombre}. Estos son los elementos que has conseguido hasta
  ahora.» / «Inicia sesión para ver tu colección.»
- Progreso: «{X} / {Y} conseguidos»; «{A} de {B} colecciones completadas»; anillo con
  label «global».
- Contador de listado: «{N} elemento conseguido» / «{N} elementos conseguidos».
- Vacío: «Aún no has conseguido nada» / «Explora las colecciones y empieza a
  completar la tuya.» + CTA «Ver colecciones».
- Error: «Error al cargar tu colección».

## A.8 Área de administración — layout

- Sidebar: marca «Volt Vault · Admin»; enlaces «Dashboard», «Colecciones», «Items»,
  «Inventario»; pie «Volver al sitio».
- Todas las tablas: estado de carga (skeleton), vacío, error.

### Dashboard (`/admin/dashboard`)
- Título «Dashboard».
- Tarjetas de métricas: «Colecciones», «Items», «Usuarios», «Elementos conseguidos».
- Bloque «Más vendidos»: columnas «Item», «Colección», «Vendidos», «Stock»; vacío
  «Sin ventas registradas».
- Bloque «Actividad reciente»: timeline «{usuario} consiguió "{item}"» + fecha; vacío
  «Sin actividad reciente.»
- Error: «No se pudo cargar el dashboard».

### Colecciones admin (`/admin/collections`)
- Título «Colecciones»; acción «Nueva colección».
- **Tabla:** «Nombre», «Slug», «Estado», «Items», acciones. Vacío: «Sin colecciones».
- **Formulario (modal «Nueva colección» / «Editar colección»):**
  - «Nombre» (obligatorio).
  - «Descripción (Markdown)» (placeholder «Descripción con formato Markdown...»).
  - «Imagen de portada».
  - «Estado» (opciones: «PUBLISHED», «DRAFT», «ARCHIVED»).
  - Botón: «Crear» / «Guardar cambios».
  - Error: «El nombre es obligatorio» / «Error al guardar».
- **Acciones por fila:** «Registrar movimiento por grupo» (icono cajas), «Editar
  {nombre}», «Eliminar {nombre}» → modal «Eliminar {nombre}?» / «Se archivará la
  colección.» / «Cancelar» · «Archivar».
- **Modal de lote por colección:** título «Inventario · {colección}»; pestañas
  «Registrar movimiento» y «Historial de grupos»; «Tipo» (Entrada/Salida/Ajuste/Venta);
  «Motivo (opcional)»; selector de items «{item} · Stock: {N}»; «Cantidad»;
  «Seleccionar todos»/«Deseleccionar todos»; «Persona a quien se vende/entrega»;
  «Cliente con cuenta (opcional)», «Nombre», «Email (opcional)»; botón «Registrar
  {N} movimiento(s)».

### Items admin (`/admin/items`)
- Título «Items»; acción «Nuevo item».
- **Tabla:** «Nombre», «Colección», «Estado», «Stock», «Vendidos», acciones. Vacío:
  «Sin items».
- **Formulario (modal «Nuevo item» / «Editar item»):**
  - «Nombre» (obligatorio).
  - «Colección» (obligatorio al crear).
  - «Descripción (Markdown)» (placeholder «Descripción con formato Markdown...»).
  - «Imagen principal».
  - «Estado» (opciones: «AVAILABLE», «DRAFT», «SOLD_OUT», «ARCHIVED»).
  - «Rareza» (opciones: «COMMON», «RARE», «EPIC», «LEGENDARY»).
  - «Stock inicial» (solo al crear).
  - Botón: «Crear» / «Guardar cambios». Errores: «El nombre es obligatorio»,
    «Selecciona una colección», «Error al guardar».
- **Acciones por fila:** «Inventario de {nombre}», «Editar {nombre}», «Eliminar
  {nombre}» → modal «Eliminar {nombre}?» / «Se archivará el item.» / «Cancelar» ·
  «Archivar».
- **Modal de inventario individual:** título «Inventario» + nombre del item; tarjetas
  «Stock actual» y «Vendidos»; sección «Registrar movimiento» con «Tipo» (Entrada
  (IN)/Salida (OUT)/Ajuste (ADJUSTMENT)/Venta (SALE)), «Cantidad», «Persona a quien
  se vende/entrega» («Cliente con cuenta (opcional)», «Nombre», «Email (opcional)»
  solo en OUT/SALE), «Motivo (opcional)» (placeholder «Ej.: reposición, devolución,
  venta...»), botón «Registrar»; sección «Historial de movimientos» con badges
  «IN» / «OUT» / «VENTA» / «AJUSTE»; vacío «Sin movimientos» / «Registra el primer
  movimiento de este item.»

### Inventario (`/admin/inventory`)
- Título «Inventario».
- Filtros: «Colección» (opción «Todas las colecciones») y «Buscar item...».
- Lista de items: «Items», «Cant.», botón «Agregar a batch», «Inventario individual
  de {nombre}»; columnas «Item», «Colección», «Stock».
- Bloque «Nuevo registro por grupo (batch)»: «Colección del lote» (o «Global (varias
  colecciones)»), «Tipo», «Motivo (opcional)», «Persona a quien se vende/entrega»,
  «Cliente con cuenta (opcional)», «Nombre», «Email (opcional)», lista de items del
  lote con cantidad, botón «Finalizar ({N} items)», «Cancelar», vacío «Sin items en
  el lote» / «Agrega items con el botón 'Agregar a batch' para registrar un grupo.»
- Bloque «Historial de registros (batches)»: columnas «Tipo», «Motivo», «Registrado
  por», «Cliente», «Colección», «Fecha»; vacío «Sin batches registrados».
- Estados: «No hay items registrados» / «Crea items desde la sección Items para
  gestionar su inventario.»

## A.9 Valores de enum → etiqueta visible

- **Estado de colección:** `PUBLISHED`→«Publicada», `DRAFT`→«Borrador`,
  `ARCHIVED`→«Archivada».
- **Estado de item:** `DRAFT`→«Borrador», `AVAILABLE`→«Disponible», `SOLD_OUT`→
  «Agotado», `ARCHIVED`→«Archivado».
- **Rareza:** `COMMON`→«Común», `RARE`→«Rara», `EPIC`→«Épica», `LEGENDARY`→«Legendaria».
- **Movimiento:** `IN`→«Entrada (IN)», `OUT`→«Salida (OUT)», `ADJUSTMENT`→«Ajuste
  (ADJUSTMENT)», `SALE`→«Venta (SALE)» (badges de historial: «IN», «OUT», «VENTA»,
  «AJUSTE»).
- **Rol:** `USER`→«Usuario», `ADMIN`→«Administrador».

## A.10 Mensajes del sistema (para microcopy)

- Toast de éxito al conseguir: «¡Conseguido!» + nombre del producto.
- Logro: «¡Colección completada!» / «Has conseguido todos los items de esta colección.»
- Errores típicos: «No se pudo cargar …», «Error al guardar», «El nombre es
  obligatorio», «Selecciona una colección», «La cantidad debe ser mayor a 0»,
  «Stock insuficiente…».
- Vacíos: «Aún no has conseguido nada», «Sin resultados», «Sin items», «Sin
  movimientos», «Sin colecciones», «Sin ventas registradas».

