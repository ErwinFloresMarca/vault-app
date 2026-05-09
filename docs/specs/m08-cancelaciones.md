# Spec: Modulo 8 - Cancelaciones Parciales

## Objetivo
Gestionar cancelaciones con cobro por trabajo realizado.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> solicitudes y aprobacion
- server/ -> endpoints de cancelacion y reembolso

## Reglas de reembolso (configurables)
- Antes de empezar: 100%
- Menos de 10% impreso: 80%
- Entre 10% y 25%: 60%
- Entre 25% y 50%: 40%
- Mayor a 50%: 0%

## Que almacena
- Motivo
- Porcentaje de avance
- Monto a cobrar
- Monto a devolver
- Estado del reembolso

## Reglas
- Puede solicitar cliente o admin.
- Admin aprueba y calcula avance real.
- No se puede cancelar si ya esta entregado.

## Estrategia de testing
- Manual: calculo correcto segun avance.

## Limites
- Siempre: registrar auditoria del reembolso.
- Preguntar primero: cambios en reglas de reembolso.
- Nunca: cancelar pedidos entregados.

## Criterios de exito
- Flujo de solicitud, aprobacion y calculo final.

## Preguntas abiertas
- Ninguna.
