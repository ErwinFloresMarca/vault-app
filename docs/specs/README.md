# Volt3D - Índice de Especificaciones

**Sistema de Gestión Integral para Impresión 3D**

## Brand
- **Nombre:** Volt3D
- **Slogan:** Impresión 3D con Voltaje
- **URL:** volt3d.erfm.dev
- **Colores:**
  - Azul claro: #3498DB
  - Gris oscuro: #34495E
  - Amarillo: #F1C40F
  - Blanco: #FFFFFF
  - Amarillo-naranja: #E67E22

## Stack
- **Frontend:** Nuxt 3 + TypeScript + @nuxt/ui + Tailwind CSS
- **Backend:** Node API
- **DB:** Postgres
- **Auth:** OAuth (Google/Facebook) + Sesiones
- **Email:** SMTP genérico
- **Pricing:** Margen configurable + Tipo de cambio USD↔BOB

---

## Módulos (12)

### [M1 - Landing Page](m01-landing.md)
Sitio público con portfolio y formulario de contacto.
- Hero, servicios, proyectos destacados
- Galería con filtro "promoción"
- Contacto + newsletter
- SEO + sitemap + schema.org

### [M2 - Autenticación](m02-auth.md)
Login OAuth sin contraseñas propias.
- Google / Facebook
- Roles: cliente (default) y admin
- Sesiones server-side
- Primer usuario asignable como admin

### [M3 - Calculadora de Costos](m03-calculadora-costos.md)
Presupuesto automático con conversión USD→BOB.
- Filamento + máquina + post-proceso + margen
- Margen configurable por proyecto (riesgo)
- Heredar estimaciones de proyecto publicado
- Cotizaciones: vencimiento 7 días

### [M4 - Gestión de Pedidos](m04-pedidos.md)
Ciclo de vida: pending → printing → completed → shipped → delivered.
- Estados + historial
- Fotos de avance
- Archivos STL/GCODE
- Bloqueo de shipping sin dirección

### [M5 - Catálogos](m05-catalogos.md)
Filamentos (con historial de precios USD) e impresoras.
- Tipo de cambio vigente para conversión
- Solo admin gestiona
- Stock disponible

### [M6 - Seguimiento Cliente](m06-seguimiento-cliente.md)
Dashboard cliente con estado, timeline y financiero.
- Lista de pedidos
- Detalle con fotos
- Información de cuotas
- Descargar comprobantes

### [M7 - Pagos y Cuotas](m07-pagos-cuotas.md)
Planes de pago: 100% / 50-50 / 30-40-30.
- Adelanto mínimo requerido
- Pausa automática si cuota vence
- Reanudación al pagar

### [M8 - Cancelaciones Parciales](m08-cancelaciones.md)
Reembolsos según avance:
- Antes de empezar: 100%
- <10%: 80% | 10-25%: 60% | 25-50%: 40% | >50%: 0%

### [M9 - Contabilidad Básica](m09-contabilidad.md)
Compras, gastos operativos, ventas automáticas.
- Reportes: ingresos, ganancia por proyecto, gastos
- Cuentas por cobrar
- Venta auto-generada al completar pedido

### [M10 - Panel Admin](m10-panel-admin.md)
Dashboard unificado: KPIs, cotizaciones, pedidos, catálogos, pagos, cancelaciones, contabilidad.

### [M11 - Notificaciones](m11-notificaciones.md)
Email + in-app automáticas.
- Cotización aprobada
- Cambios de estado
- Fotos de avance
- Cuotas próximas a vencer
- Stock bajo (admin)

### [M12 - Configuración](m12-configuracion.md)
Parámetros globales.
- Margen base, adelanto %, días de gracia
- Reglas de cancelación + reembolso
- Datos empresa (redes, contacto)
- Tipo de cambio USD→BOB

---

## Planes de Implementación

### [PLAN.md](PLAN.md)
10 fases de construcción recomendadas (10 semanas):
1. Auth
2. Catálogos
3. Calculadora
4. Pedidos + Seguimiento
5. Pagos
6. Cancelaciones
7. Contabilidad
8. Landing + Notificaciones
9. Panel Admin
10. Integración final

---

## Puntos Clave

### Reglas de Costeo
- **Margen:** 100% base, configurable por proyecto (riesgo).
- **Filamento:** USD, convertido a BOB con tipo cambio vigente.
- **Post-proceso:** Modelo personalizado con valores por defecto.
- **Estimaciones:** Ingresadas manuales al crear proyecto; heredadas en cotizaciones.

### Seguridad y Auditoría
- Cambios críticos (precios, estados, cancelaciones) registrados.
- Solo admin cambia estados de pedido.
- Cliente solo ve sus datos.
- Sesiones seguras.

### Performance
- Landing: LCP < 2.5s, lazy load de imágenes.
- Mobile-first responsive.
- Sitemap + meta tags dinámicos.

### Flujo Principal
```
Cliente                Admin
  │                      │
  ├─ Login OAuth ─────┬──┤
  │                    │
  │ Solicita cotiz. ───→ Aprueba/rechaza
  │                    │
  │ Paga adelanto ────→ Inicia impresión
  │                    │
  │ Ve estado ◄────── Sube fotos
  │                    │
  │ Paga cuota ──────→ Cambia estado
  │                    │
  │ Recibe ◄────────── Entrega
  │                    │
  └─ Ver historial    Genera venta
```

---

## Convenciones

- **Archivos:** snake_case (m01-landing.md)
- **Tipos TypeScript:** PascalCase
- **Props/vars:** camelCase
- **UI en español, código en inglés**

## Next Steps

1. ✅ Revisar y aprobar specs (HECHO)
2. ⏳ Crear schema DB (Prisma)
3. ⏳ Inicio Fase 1: Auth

---

**Última actualización:** 8 mayo 2026
**Responsable:** Especificación colaborativa
