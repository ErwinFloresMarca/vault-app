# Spec: Modulo 5 - Gestion de Catalogos

## Objetivo
Gestionar filamentos y impresoras 3D usados en costeo y produccion.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- pages/ -> vistas admin de catalogos
- server/ -> endpoints de filamentos e impresoras

## Submodulo 5.1: Filamentos
### Que almacena
- Tipo (PLA, PETG, ABS, TPU)
- Marca
- Color
- Diametro
- Densidad
- Precio actual por kg (USD)
- Stock disponible
- Proveedor
- Historial de precios

### Reglas
- Solo admin gestiona.
- Precio con historial; nunca se borra el anterior.

## Submodulo 5.2: Impresoras
### Que almacena
- Nombre
- Modelo
- Tecnologia (FDM, SLA, SLS)
- Costo por hora
- Consumo electrico
- Volumen maximo
- Estado (active/inactive)

### Reglas
- El costo por hora incluye mantenimiento y amortizacion.
- Solo admin gestiona.

## Tipo de cambio
- Se mantiene el tipo de cambio USD->BOB vigente para costos.

## Estrategia de testing
- Manual: alta/edicion de filamento y precio historico.
- Manual: alta/edicion de impresoras.

## Limites
- Siempre: validar precios positivos.
- Preguntar primero: cambios en modelo de stock.
- Nunca: eliminar registros con historial.

## Criterios de exito
- Catalogo completo y usable por la calculadora.

## Preguntas abiertas
- Ninguna.
