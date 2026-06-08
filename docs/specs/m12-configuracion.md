# Spec: Modulo 12 - Configuracion del Sistema

## Objetivo
Permitir al admin ajustar parametros globales.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> configuracion
- server/ -> endpoints de settings

## Parametros configurables
- Margen de ganancia base (default 100%)
- Margen por proyecto segun riesgo
- Adelanto minimo requerido
- Dias de gracia para pago
- Recargo por mora
- Dias sin pago para cancelar
- Plan de pago por defecto
- **Datos de la empresa**: nombre, email, telefono, direccion, redes sociales, slogan
- Tipo de cambio USD->BOB vigente
- Modelo de post-proceso con valores por defecto

## Reglas
- Solo admin modifica.
- Cambios aplican a pedidos nuevos.

## Estrategia de testing
- Manual: cambios reflejados en nuevas cotizaciones.

## Limites
- Siempre: guardar historial de cambios.
- Preguntar primero: cambios retroactivos.
- Nunca: aplicar cambios a pedidos cerrados.

## Criterios de exito
- Admin puede configurar parametros y se usan en calculos.

## Preguntas abiertas
- Ninguna.
