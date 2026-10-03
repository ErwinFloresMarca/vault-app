# Spec: Módulo 18 — Deploy, DNS y OAuth (as-built)

> **Spec as-built.** Issue: `SEL-132`. No es trabajo pendiente: documenta un
> despliegue que ya está funcionando en producción, para que el procedimiento sea
> reproducible y no se pierda. La referencia operativa sigue siendo
> `docs/DEPLOY.md`; este spec es la fuente de verdad del **porqué** y de los
> comandos de verificación.

## Problema

`docs/DEPLOY.md` tenía una sección "Pendiente (manual, requiere tus cuentas)" que
listaba el DNS de Cloudflare y los redirect URIs de OAuth como tareas sin hacer.
Ambas estaban **completadas**. Esa sección era información falsa con capacidad de
engañar: un agente o una sesión futura podía intentar "arreglar" algo que ya
funcionaba, o reintroducir credenciales.

Este spec fija el estado real verificado y deja el procedimiento escrito.

## Estado verificado (2026-10-03, contra v0.4.0 en producción)

Verificado contra producción, no inferido de la configuración local:

| Comprobación | Resultado |
|---|---|
| `getent hosts vault.volt-3d.store` | resuelve a `2606:4700:3031::*` (Cloudflare proxied) |
| `curl -o /dev/null -w '%{http_code}' https://vault.volt-3d.store/` | `200` |
| `GET /auth/google` | `302` → `accounts.google.com` con `redirect_uri=https://vault.volt-3d.store/auth/google` |
| `GET /auth/facebook` | `302` → `facebook.com` con `redirect_uri=https://vault.volt-3d.store/auth/facebook` |
| `GET /robots.txt` / `GET /sitemap.xml` | `200` / `200` |

Los dos OAuth son configuración de Google Cloud Console y Meta for Developers. **Se
verificó que los redirects se emiten correctamente, no que el round-trip completo
devuelva sesión**; eso último requiere un login interactivo con una cuenta real.
Queda pendiente de verificación humana.

## Procedimiento reproducible

### 1. DNS (Cloudflare)

- Registro tipo **A**, nombre `vault`, valor `72.61.55.208`, **proxied**
  (naranja). TTL auto.
- Cloudflare emite el TLS. El origin no sirve HTTPS.

### 2. TLS

- Termina en Cloudflare. El origin habla HTTP plano en `:80`.
- No hay certificado Let's Encrypt en el origin ni redirección 80→443.

### 3. Nginx (`/etc/nginx/sites-enabled/vault.volt-3d.store`)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name vault.volt-3d.store;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }

    client_max_body_size 50m;
}
```

### 4. PM2 (`/var/www/vault-app/current/ecosystem.config.cjs`)

- `script: '.output/server/index.mjs'`, `interpreter_args: '--env-file=.env'`.
- `PORT: 3010` (3000 lo usa coin-holder, 3001 sindicato-api).
- `instances: 1`, `exec_mode: 'fork'`, `max_memory_restart: '512M'`,
  `autorestart: true`, `exp_backoff_restart_delay: 100`.

### 5. OAuth

- Redirect URIs, exactamente:
  - `https://vault.volt-3d.store/auth/google`
  - `https://vault.volt-3d.store/auth/facebook`
- Credenciales en el `.env` de producción como `NUXT_OAUTH_GOOGLE_ID/SECRET` y
  `NUXT_OAUTH_FACEBOOK_ID/SECRET`. Se reutilizaron las de coin-holder; son apps
  distintas por dominio.
- Handlers en `server/routes/auth/{google,facebook}.ts`.

### 6. Base de datos

- BD `vault-volt3d` en el contenedor Docker `coin-holder-db` (Postgres 16),
  puerto 5432. Es una BD compartida con coin-holder, no dedicada.

### 7. Secrets de CI (`ErwinFloresMarca/vault-app`)

| Secret | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://volt3d-coins:<pass>@72.61.55.208:5432/vault-volt3d` (público, para `prisma migrate deploy` en CI) |
| `VPS_HOST` | `72.61.55.208` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | clave CI dedicada `~/.ssh/ci-cd-vault` (ed25519, sin passphrase) |

`~/.ssh/ci-cd-hostinger` tiene passphrase y **no** sirve para CI. La pública de
`ci-cd-vault` está en `/root/.ssh/authorized_keys` de la VPS.

### 8. Verificación tras cada deploy

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3010/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://vault.volt-3d.store/auth/google
```

El segundo debe devolver `302` con el `redirect_uri` correcto; si devuelve 401 o
500, el problema es el `.env` de la VPS, no el DNS.

## Observación de seguridad (sin corregir)

Cloudflare termina el TLS, pero:

- El origin sirve **HTTP plano en `:80`**, sin redirección a HTTPS.
- `3010` escucha en `0.0.0.0`, así que la app es alcanzable **directo por
  `72.61.55.208:3010`**, saltándose Cloudflare por completo.
- `X-Forwarded-Proto` se reenvía tal cual lo recibe el cliente; no se fuerza a
  `https`.

Consecuencia práctica: un visitante puede entrar por la IP y saltarse el proxy.
El cookie de sesión sigue firmado y `httpOnly`, así que el riesgo es bajo para
esta app, pero es una desviación del modelo "Cloudflare es el único front".

**No se corrige en este spec.** Queda registrado como decisión consciente: cerrar
el origin (TLS en el origin, o firewall que acepte `:80` solo desde los rangos de
Cloudflare) es un cambio de infraestructura que no se justifica mientras la app no
tenga tráfico sensible. Si algún día lo tiene, este es el punto de entrada.

## Reglas

- **Always**: `vault.volt-3d.store` resuelve por Cloudflare; nunca apuntar el
  DNS a la IP cruda sin proxied.
- **Always**: el puerto 3010 es exclusivo de vault-app.
- **Never**: commitear el `.env` de la VPS ni los secrets de CI.
- **Never**: reintroducir en `docs/DEPLOY.md` una lista de "pendientes" que ya no
  lo sean.

## Boundaries

- `docs/DEPLOY.md` — referencia operativa (layout, flujo de release, secrets).
  Este spec no lo reemplaza; lo complementa con el porqué y la verificación.
- `docs/AUTH_SETUP.md` — solo cubre el arranque **local** (`.env.local`,
  `localhost:3000`). El procedimiento de producción es el de este spec; no
  mezclar ambos.

## Success Criteria

- `docs/DEPLOY.md` ya no afirma que DNS y OAuth estén pendientes.
- Un humano puede reconstruir el despliegue completo siguiendo este spec sin
  consultar el historial de ninguna conversación.