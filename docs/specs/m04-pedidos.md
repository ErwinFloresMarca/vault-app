# Spec: Modulo 4 - Gestion de Pedidos

## Objetivo
Administrar el ciclo de vida de pedidos desde aprobacion hasta entrega.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> vistas admin y detalle de pedido
- server/ -> endpoints para estados, fotos y archivos

## Estados
- pending
- printing
- post_processing
- quality_check
- completed
- shipped
- delivered

## Que almacena
- Datos del pedido (cliente, fechas, total, direccion de envio)
- Estado actual
- Historial de cambios
- Fotos de avance
- Archivos STL/GCODE

## Reglas de negocio
- Solo admin cambia estados.
- Cada cambio puede incluir nota y/o foto.
- El cliente ve estado y fotos en tiempo real.
- No se puede pasar a shipped sin direccion registrada.

## Estrategia de testing
- Manual: transicion de estados con notas y fotos.
- Manual: bloqueo de shipped sin direccion.

## Limites
- Siempre: auditar cambios importantes de estado.
- Preguntar primero: agregar nuevos estados.
- Nunca: permitir cambio de estado por cliente.

## Criterios de exito
- Flujo de estados completo.
- Historial visible para admin y cliente.
- Validaciones de direccion al enviar.

## Preguntas abiertas
- Ninguna.
