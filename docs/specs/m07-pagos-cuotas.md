# Spec: Modulo 7 - Pagos y Cuotas

## Objetivo
Gestionar cobros parciales y estado financiero de pedidos.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> admin de pagos y vista cliente
- server/ -> endpoints de planes, cuotas y pagos

## Planes de pago
- 100% al inicio
- 50% + 50% contra entrega
- 30% + 40% + 30% por hitos

## Que almacena
- Plan de pago por pedido
- Cuotas (numero, monto, vencimiento, hito)
- Pagos registrados (monto, fecha, metodo, comprobante)
- Estado financiero

## Reglas de negocio
- No inicia impresion sin adelanto minimo (configurable).
- Si una cuota vence, se pausa la impresion.
- Al pagar cuota vencida, se reanuda automaticamente.
- No se entrega con saldo pendiente.
- Admin puede registrar pagos manuales.

## Estrategia de testing
- Manual: bloqueo de impresion sin adelanto.
- Manual: reanudacion al registrar pago vencido.

## Limites
- Siempre: auditar registros de pago manual.
- Preguntar primero: integraciones de pasarelas.
- Nunca: marcar entregado con saldo pendiente.

## Criterios de exito
- Planes configurables y cuotas generadas por pedido.

## Preguntas abiertas
- Ninguna.
