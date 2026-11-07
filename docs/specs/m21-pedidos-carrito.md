# m21 — Carrito, pedidos, aviso por correo y exportación a Excel

Estado: **implementado (v0.8)** · Depende de: m04 (catálogo), m07 (inventario), m20 (tablas admin).

## Objetivo

Que un visitante pueda armar un carrito con figuras del catálogo y enviar un
pedido (pago por **QR**, coordinado por WhatsApp), que el pedido quede
registrado, que llegue un **correo de aviso** al responsable y que el panel de
admin permita gestionar los pedidos, registrar quién imprimió y el costo de
impresión, ver el **reparto 50/50** (contrato de socios) y **exportar a Excel**.

## Alcance

- `CollectionItem.price` (Decimal Bs, nullable). Sin precio (= **precio indefinido**) → no se
  puede agregar al carrito; la ficha muestra "Indefinido" y el catálogo no muestra precio.
- Disponibilidad de venta (`utils/itemAvailability.ts`, compartido por tienda y servidor):
  se puede pedir un item **Disponible con stock > 0** o **A pedido** (`ON_DEMAND`, se crea al
  confirmar el pago, no depende del stock). Agotado (`SOLD_OUT` o Disponible sin stock),
  Borrador y Archivado no se pueden pedir. Las tarjetas del catálogo solo muestran el precio
  cuando el item se puede pedir y tiene precio definido.
- **Color al comprar** (si el item tiene colores disponibles, ver m14): con 1 color se asigna
  solo; con 2+ el cliente elige «Un color para todos» o «Repartir por color» (cantidad por
  color). Cada color es una línea distinta del carrito (`cartLineKey` = item + color) y del
  pedido (`OrderItem.colorName` / `colorHex`, migración `20261107130000_add_order_item_color`).
  `POST /api/orders` recibe `items[].color` (nombre), lo exige si hay 2+ colores y valida que
  exista; el color se muestra en el admin, los correos y el Excel (columna «Color»).
- Modelos `Order` / `OrderItem` (`prisma/schema.prisma`). `OrderItem` guarda copia de
  nombre, colección, imagen y precio unitario al momento del pedido.
- Estados (`OrderStatus`): `PENDING_PAYMENT` (**Pedido realizado**) → `PAID` (**Pedido
  confirmado**) → `IN_PRODUCTION` → `READY` → `SHIPPED` → `DELIVERED`, o `CANCELLED`.
- Cada pedido tiene un **código único** `Order.code` (`VV-XXXX-XXXX`, sin caracteres
  ambiguos) que es lo único que ve el cliente. `Order.number` es un correlativo interno
  (solo admin).
- Contacto del cliente: **correo obligatorio (principal)**, WhatsApp opcional (secundario).
- Entrega (`DeliveryMethod`): `PICKUP` o `SHIPPING` (envío departamental con costo
  adicional que el admin carga en `shippingCost`).

### Cliente
- Carrito en el navegador (`composables/useCart.ts`, `localStorage` `vv-cart`).
- Botón "Agregar al carrito" en la ficha del item; icono con contador en el header.
- `/cart` (pública): cantidades, subtotal y formulario (nombre, WhatsApp, ciudad,
  correo opcional, entrega, dirección si es envío, notas). No requiere cuenta; si hay
  sesión, el pedido se vincula al usuario.
- Tras enviar: número de pedido e indicaciones de pago por QR (y botón de WhatsApp si
  `volt.whatsapp` está configurado en `app.config.ts`).

### API
- `POST /api/orders` (pública): devuelve solo el código del cliente. Valida datos y items (existen, publicados, que se puedan
  pedir según `isSellable`, con precio, cantidad 1–50). **El precio lo calcula el servidor**, nunca se confía en el cliente.
  Rate limit por IP (5 pedidos / 10 min). Envía el correo de aviso sin bloquear la respuesta.
- `GET /api/admin/orders` (admin): filtros `status`, `from`, `to`, `q`, paginación.
- `GET|PUT /api/admin/orders/:id` (admin): detalle y actualización de estado, costo de
  envío, costo de impresión, otros gastos, quién imprimió, notas internas.
- `GET /api/admin/orders/export` (admin): `.xlsx` con los mismos filtros (hoja Pedidos +
  hoja Detalle), incluye el reparto por pedido.
- `GET /api/admin/orders/meta` (admin): lista de administradores (para "Imprimió").

### Reparto (contrato de socios)
```
Total          = subtotal + costo de envío   (el envío lo paga el cliente y no se reparte)
Utilidad neta  = subtotal − costo de impresión − otros gastos
Parte de cada socio = utilidad neta / 2   (quien imprimió recibe además el costo de impresión)
```
Se calcula en `server/services/orderService.ts` (`computeSplit`). Los pedidos cancelados
no suman en los totales.

### Correos (dos fases)
- `server/utils/mailer.ts` con nodemailer y las variables `NUXT_SMTP_*`.
- **Fase 1 — "Pedido realizado"** (al cliente, al crear el pedido): código único,
  productos, entrega e instrucciones de pago. Si `NUXT_PAYMENT_QR_URL` está definido se
  incluye la imagen del QR; si no, se indica que el QR se enviará aparte.
- **Aviso interno** (al crear): a `NUXT_ORDER_NOTIFY_EMAIL` (lista separada por comas)
  con quién pidió, qué pidió, correo/WhatsApp y enlace al panel.
- **Fase 2 — "Pedido confirmado"** (al cliente): se envía una sola vez cuando el admin
  cambia el estado desde `PENDING_PAYMENT` a uno posterior (no cancelado); se guarda
  `Order.confirmedAt`. `POST /api/admin/orders/:id/resend` reenvía el correo de la fase actual.
- Sin SMTP configurado → se registra en el log y el pedido se crea igual.

## Fuera de alcance (siguientes pasos)
- Descontar stock automáticamente (hoy el stock se gestiona en Inventario; se puede
  registrar la venta como movimiento `SALE`).
- Subir comprobante de pago y fotos del envío al pedido.
- Pasarela de pago distinta de QR.
