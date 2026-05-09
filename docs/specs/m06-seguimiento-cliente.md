# Spec: Modulo 6 - Seguimiento para Cliente

## Objetivo
Permitir al cliente ver estado e historial de sus pedidos.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> area de cliente
- server/ -> endpoints de pedidos del cliente

## Que muestra
- Lista de pedidos (resumen)
- Detalle con estado, timeline y fotos
- Informacion financiera (pagado vs adeudado)
- Proximas cuotas

## Acciones del cliente
- Ver seguimiento
- Descargar comprobantes
- Solicitar cancelacion
- Contactar al admin

## Reglas
- Requiere login.
- Solo ve sus pedidos.

## Estrategia de testing
- Manual: usuario no puede ver pedidos de otros.
- Manual: descarga de comprobantes.

## Limites
- Siempre: filtrar por userId en backend.
- Preguntar primero: exportaciones masivas.
- Nunca: mostrar datos financieros de otros usuarios.

## Criterios de exito
- Cliente ve el estado actualizado y fotos.

## Preguntas abiertas
- Ninguna.
