# Spec: Modulo 11 - Notificaciones

## Objetivo
Informar al cliente sobre cambios en pedidos y cuotas.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres
- Email: SMTP (provider agnostic)

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- server/ -> endpoints y jobs de notificaciones
- pages/ -> campana de notificaciones

## Eventos
- Cotizacion aprobada
- Estado de pedido cambia
- Foto de avance subida
- Cuota proxima a vencer (3 dias antes)
- Cuota vencida
- Pago registrado
- Cancelacion procesada
- Stock bajo (admin)

## Canales
- Email (obligatorio)
- Notificaciones in-app

## Reglas
- Cliente puede marcar como leidas.
- Emails se envian automaticamente.

## Estrategia de testing
- Manual: trigger por cambio de estado.

## Limites
- Siempre: evitar spam con deduplicacion basica.
- Preguntar primero: agregar SMS/WhatsApp.
- Nunca: omitir correo en eventos criticos.

## Criterios de exito
- Notificaciones enviadas para eventos definidos.

## Preguntas abiertas
- Ninguna.
