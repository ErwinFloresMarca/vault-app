# Plan de Implementación - Sistema Volt3D

## Fases Recomendadas

### Fase 1: Configuración Base + Auth (Semana 1-2)
**Objetivo:** Infraestructura lista y usuarios pueden autenticarse.
- ✅ Configuración de base de datos (schema)
- ✅ Autenticación OAuth (Google/Facebook)
- ✅ Roles y permisos iniciales
- ✅ Primeros usuarios (admin asignable)
- Documentación de variables de entorno

### Fase 2: Catálogos + Configuración (Semana 2-3)
**Objetivo:** Admin puede registrar filamentos, impresoras y parámetros.
- ✅ CRUD filamentos con historial de precios
- ✅ CRUD impresoras
- ✅ Panel configuración (margen base, adelanto, reglas, tipos cambio)
- ✅ Tipo de cambio USD->BOB sincronizado

### Fase 3: Calculadora de Costos (Semana 3-4)
**Objetivo:** Clientes pueden generar cotizaciones automáticas.
- ✅ Formulario de cotización (filamento, gramos, complejidad, design, impresora)
- ✅ Cálculo: filamento + máquina + post-proceso + margen por proyecto
- ✅ Conversión USD->BOB automática
- ✅ Generación y vencimiento de cotizaciones
- ✅ Admin aprueba/rechaza y puede ajustar

### Fase 4: Gestión de Pedidos (Semana 4-5)
**Objetivo:** Cotizaciones → Pedidos con seguimiento.
- ✅ Conversión cotización a pedido
- ✅ Estados de pedido (pending → delivered)
- ✅ Historial de cambios y timestamps
- ✅ Fotos y archivos STL/GCODE por pedido
- ✅ Admin cambia estado; cliente ve en tiempo real

### Fase 5: Pagos y Cuotas (Semana 5-6)
**Objetivo:** Gestión de planes de pago y cobros parciales.
- ✅ Planes de pago (100%, 50/50, 30/40/30)
- ✅ Generación automática de cuotas
- ✅ Registro de pagos (manual admin)
- ✅ Bloqueo de impresión sin adelanto
- ✅ Pausa/reanudación por cuota vencida
- ✅ No entrega con saldo pendiente

### Fase 6: Cancelaciones (Semana 6-7)
**Objetivo:** Flujo de cancelación y reembolsos.
- ✅ Solicitud de cancelación (cliente o admin)
- ✅ Cálculo de porcentaje de avance
- ✅ Aplicación de reglas de reembolso
- ✅ Registro de reembolso y estado

### Fase 7: Seguimiento Cliente (Semana 7)
**Objetivo:** Cliente ve sus pedidos y estado financiero.
- ✅ Dashboard cliente: pedidos activos, historial
- ✅ Timeline de estados y fotos
- ✅ Información financiera (pagado/adeudado)
- ✅ Próximas cuotas

### Fase 8: Contabilidad Básica (Semana 8)
**Objetivo:** Registros de ingresos, egresos y reportes.
- ✅ Auto-generación de ventas al completar pedido
- ✅ Registro de compras (filamento, repuestos)
- ✅ Registro de gastos operativos
- ✅ Reportes básicos (ventas, ganancia por proyecto, gastos)

### Fase 9: Landing Page + Notificaciones (Semana 8-9)
**Objetivo:** Sitio público y notificaciones funcionales.
- ✅ Landing page: hero, servicios, portfolio, CTA
- ✅ Galería de proyectos con filtro "promoción"
- ✅ Página contacto con formulario
- ✅ Notificaciones email automáticas
- ✅ Notificaciones in-app
- ✅ Meta tags, sitemap, schema.org
- ✅ Performance: LCP < 2.5s, lazy loading

### Fase 10: Panel Admin (Semana 9-10)
**Objetivo:** Dashboard unificado de todas las funciones.
- ✅ KPIs: ingresos, pedidos activos, cuotas por vencer
- ✅ Navegación a todas las secciones
- ✅ Auditoría de cambios importantes

## Orden de Construcción (Resumen)
1. Auth (M2)
2. Catálogos (M5)
3. Calculadora (M3)
4. Pedidos + Seguimiento Cliente (M4, M6)
5. Pagos (M7)
6. Cancelaciones (M8)
7. Contabilidad (M9)
8. Landing + Notificaciones (M1, M11)
9. Panel Admin (M10)
10. Configuración (M12) — integrada en todo

## Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Cambios de reqs en margen/post-proceso | Usar variables configurables desde inicio |
| Tipo de cambio obsoleto | Sincronización diaria automática |
| Performance landing lenta | Lazy load obligatorio + optimización assets desde Fase 9 |
| Pérdida de datos en cancels | Auditoría exhaustiva + backups |

## Success Criteria por Fase
- **Fase 1:** Usuario logueado sin password, roles asignados.
- **Fase 2:** Admin crea filamento, ve historial precio, configura margen.
- **Fase 3:** Cliente genera cotización, ve costo en BOB, admin aprueba.
- **Fase 4:** Cotización → Pedido, estado fluye, cliente ve fotos.
- **Fase 5:** Cuota vencida pausa impresión, pago la reanuda.
- **Fase 6:** Cancelación al 25% devuelve 60% del monto.
- **Fase 7:** Cliente ve dashboard con timeline y cuotas próximas.
- **Fase 8:** Venta auto-generada, reporte muestra ganancia por proyecto.
- **Fase 9:** Landing pública, formulario contacto funciona, emails enviados.
- **Fase 10:** Admin ve KPIs y accede a todas las funciones.
