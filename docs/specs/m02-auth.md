# Spec: Modulo 2 - Autenticacion

## Objetivo
Permitir login de clientes y administradores con Google y Facebook usando sesiones.

## Stack
- Frontend: Nuxt 3 + TypeScript + @nuxt/ui
- Backend: Node API
- DB: Postgres
- Email: SMTP (provider agnostic)

## Comandos
- Dev: pnpm dev
- Build: pnpm build
- Preview: pnpm preview

## Estructura del proyecto
- server/ -> rutas de auth y callback OAuth
- pages/ -> pantallas de login y perfil

## Estilo de codigo
```ts
export type UserRole = 'client' | 'admin'

export type UserProfile = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: UserRole
  lastLoginAt: string
}
```

## Estrategia de testing
- Manual: login con Google y Facebook.
- Validar persistencia de sesion en refresh.

## Limites
- Siempre: registrar ultimo acceso.
- Preguntar primero: agregar otro proveedor OAuth.
- Nunca: manejar passwords propios.

## Criterios de exito
- Login via Google/Facebook.
- Rol por defecto: client.
- Primer usuario puede asignarse admin.

## Preguntas abiertas
- Ninguna.
