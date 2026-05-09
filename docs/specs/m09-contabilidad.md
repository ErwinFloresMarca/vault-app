# Spec: Modulo 9 - Contabilidad Basica

## Objetivo
Registrar ingresos, egresos y rentabilidad por proyecto.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> reportes contables
- server/ -> endpoints de compras, gastos, ventas

## Que almacena
- Compras: proveedor, fecha, items, cantidad, precio, comprobante
- Gastos operativos: categoria, descripcion, monto, fecha, comprobante
- Ventas: pedido, categoria, monto, costo real asociado

## Reportes
- Ventas por categoria
- Ganancia por proyecto
- Gastos mensuales por categoria
- Cuentas por cobrar

## Reglas
- Pedido completado genera venta automatica.
- Compras de filamento afectan stock.
- Admin registra gastos operativos manuales.

## Estrategia de testing
- Manual: generacion de venta al completar pedido.

## Limites
- Siempre: mantener trazabilidad de comprobantes.
- Preguntar primero: integracion contable externa.
- Nunca: borrar ventas ligadas a pedidos.

## Criterios de exito
- Reportes basicos disponibles y consistentes.

## Preguntas abiertas
- Ninguna.
