# Spec: Modulo 10 - Panel de Administrador

## Objetivo
Acceso unificado a todas las funciones de gestion.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> rutas admin
- server/ -> endpoints admin

## Secciones
- Dashboard: KPIs (ingresos, pedidos activos, cuotas por vencer)
- Cotizaciones: listar, aprobar/rechazar, convertir a pedido
- Pedidos: ver, cambiar estado, subir fotos
- Proyectos publicados: seleccionar pedidos para landing
- Catalogos: filamentos e impresoras
- Clientes: historial y bloqueo
- Pagos: cuotas pendientes y pagos manuales
- Cancelaciones: revisar y procesar
- Contabilidad: compras/gastos/reportes
- Configuracion: planes de pago y reglas

## Reglas
- Solo rol admin.
- Cambios importantes se registran en auditoria.

## Estrategia de testing
- Manual: rutas protegidas por rol.

## Limites
- Siempre: auditar cambios de precios, estados y cancelaciones.
- Preguntar primero: nuevas secciones.
- Nunca: permitir acceso a client.

## Criterios de exito
- Panel con navegacion a todos los modulos.

## Preguntas abiertas
- Ninguna.
