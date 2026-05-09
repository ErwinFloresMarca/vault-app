# Spec: Modulo 3 - Calculadora de Costos

## Objetivo
Calcular presupuesto automatico y generar cotizaciones para clientes.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> formulario de cotizacion
- server/ -> endpoints de calculo y cotizaciones

## Estilo de codigo
```ts
export type QuoteInput = {
  filamentId: string
  grams: number
  complexity: 'low' | 'medium' | 'high'
  needsDesign: boolean
  printerId?: string
  projectId?: string
}
```

## Reglas de negocio
- Margen base default 100%.
- Margen configurable por proyecto segun riesgo.
- Post-proceso usa un modelo personalizable con valores por defecto.
- Estimacion de horas y gramos se registra manualmente al crear el proyecto.
- Si la cotizacion se basa en un proyecto publicado, hereda horas y gramos.
- La cotizacion expira en 7 dias.
- Cliente debe estar logueado para solicitar.
- Admin puede ajustar el precio antes de aprobar.

## Costeo y tipo de cambio
- Precio del filamento se registra en USD.
- Se guarda el tipo de cambio USD -> BOB vigente.
- El costo de filamento se calcula con el tipo de cambio actual al momento de cotizar.

## Que almacena
- Cotizaciones (inputs, resultado, fecha, estado).
- Archivo STL si se sube.
- Estado: pending, approved, rejected, expired.

## Estrategia de testing
- Manual: calcular con distintos filamentos y verificar conversion USD->BOB.
- Manual: caducidad a 7 dias.

## Limites
- Siempre: validar grams > 0 y precios > 0.
- Preguntar primero: cambiar modelo de post-proceso.
- Nunca: aprobar cotizacion sin guardar tipo de cambio usado.

## Criterios de exito
- Calculo de costos: filamento + maquina + post-proceso + margen.
- Cotizacion guardada con estado y vencimiento.
- Admin puede ajustar y aprobar.

## Preguntas abiertas
- Ninguna.
