# Configuración de Fase 1: Autenticación

## Pasos para activar autenticación

### 1. Copiar variables de entorno

```bash
cp .env.example .env.local
```

### 2. Configurar OAuth (Google)

1. Ir a https://console.cloud.google.com
2. Crear un proyecto
3. Habilitar OAuth 2.0
4. Crear credenciales (Cliente OAuth)
5. Añadir `http://localhost:3000/auth/google` a Authorized redirect URIs
6. Copiar Client ID y Secret al `.env.local`:

```env
NUXT_OAUTH_GOOGLE_ID=your-google-client-id
NUXT_OAUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. Configurar OAuth (Facebook)

1. Ir a https://developers.facebook.com
2. Crear una app
3. Agregar producto "Facebook Login"
4. Añadir `http://localhost:3000/auth/facebook` a Valid OAuth Redirect URIs
5. Copiar App ID y App Secret al `.env.local`:

```env
NUXT_OAUTH_FACEBOOK_ID=your-facebook-app-id
NUXT_OAUTH_FACEBOOK_SECRET=your-facebook-app-secret
```

### 4. Configurar Base de Datos

```bash
# Crear BD Postgres (en tu servidor local o cloud)
# Ejemplo con psql:
psql -U postgres -c "CREATE DATABASE volt3d;"

# Actualizar .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/volt3d"

# Generar password de sesión (32+ caracteres)
NUXT_SESSION_PASSWORD="generate-a-32-character-secret-key-here!"
```

### 5. Ejecutar Migraciones

```bash
# Generar cliente Prisma
pnpm exec prisma generate

# Ejecutar migraciones
pnpm exec prisma migrate dev --name init

# (Opcional) Seed de datos
pnpm exec prisma db seed
```

### 6. Iniciar servidor

```bash
pnpm dev
```

### 7. Crear primer admin

Ir a http://localhost:3000/login y autenticarse con Google o Facebook.

En la BD, actualizar el rol del usuario a ADMIN:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Endpoints disponibles

- `GET /auth/google` — Inicia OAuth con Google
- `GET /auth/facebook` — Inicia OAuth con Facebook
- `GET /api/auth/me` — Obtiene usuario actual (autenticado)
- `POST /api/auth/logout` — Cierra sesión

## Composables disponibles

```ts
// En componentes/páginas
const { user, isAuthenticated, isAdmin, fetchUser, logout } = useAuthUser()

// Redirigir si no está autenticado
useRequireAuth(() => {
  console.log('User logged in:', user.value)
})

// Redirigir si no es admin
useRequireAdmin()
```

## Middleware

Página `login.vue` — No usa middleware (pública)
Otras rutas — Usan middleware `auth` que protege las rutas

Rutas públicas (sin protección):
- `/`
- `/galeria`
- `/contacto`
- `/auth/error`

## Próximos pasos

1. Crear páginas de cliente (dashboard, pedidos, seguimiento)
2. Crear panel de admin (dashboard, cotizaciones, pedidos)
3. Implementar Catálogos (M5)
4. Implementar Calculadora (M3)
