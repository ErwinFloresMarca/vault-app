# Deploy — Volt Vault (`vault-app`)

Mismo patrón que **coin-holder-generator**: build en GitHub Actions → release con
el `.output` en tar.gz → deploy a la VPS con PM2. Convive con coin-holder en la
misma VPS, usando **puerto 3001** (coin-holder usa 3000) y la **misma Postgres**
contenedor `coin-holder-db` (base `vault-volt3d`).

## Layout en la VPS

```
/var/www/vault-app/
├── current/
│   ├── .output/            # artefacto desplegado (rm + tar del release)
│   ├── .env                # secretos de producción (NO en git)
│   └── ecosystem.config.cjs
└── vault-app-*.tar.gz      # últimos releases descargados
```

- PM2 app: **`vault-app`** (`ecosystem.config.cjs`, `.output/server/index.mjs`,
  `--env-file=.env`, `PORT=3001`).
- Postgres: contenedor `coin-holder-db` (`docker-compose.yml` de coin-holder),
  `127.0.0.1:5432`. BD dedicada `vault-volt3d`.

## Secrets de GitHub (repo `ErwinFloresMarca/vault-app`)

| Secret | Uso |
|---|---|
| `DATABASE_URL` | `prisma migrate deploy` en CI (debe ser **accesible desde GitHub Actions**) |
| `NUXT_SESSION_PASSWORD` | Firma de sesión en build/runtime |
| `VPS_HOST`, `VPS_USER`, `VPS_PORT` | SSH de deploy |
| `VPS_SSH_KEY`, `VPS_SSH_KEY_PASSPHRASE` | Clave SSH de deploy |

> Si la Postgres solo es accesible desde la VPS, quita el paso de migraciones del
> job `build` y ejecuta `pnpm db:migrate:deploy` en la VPS (paso de deploy).

## `.env` de producción (en `/var/www/vault-app/current/.env`)

```env
DATABASE_URL="postgresql://volt3d-coins:<pass>@127.0.0.1:5432/vault-volt3d"
NUXT_SESSION_PASSWORD="<32+ caracteres>"
NUXT_OAUTH_GOOGLE_ID="..."
NUXT_OAUTH_GOOGLE_SECRET="..."
NUXT_OAUTH_FACEBOOK_ID="..."
NUXT_OAUTH_FACEBOOK_SECRET="..."
NUXT_API_BASE_URL="https://<dominio>"
NUXT_PUBLIC_SITE_URL="https://<dominio>"   # canonical / og:url
```

## Flujo de release

```bash
pnpm release patch   # gates: main limpio, al día, lint+typecheck+build; bump+tag+push
```

La CI (`build-release.yml`, on tag `v*` o `workflow_dispatch`) ejecuta:
migraciones (`prisma migrate deploy`) → generate → lint → typecheck → build
(`NITRO_PRESET=node-server`) → publica release `vault-app-v<version>.tar.gz` →
SCP + SSH a la VPS → `pm2 restart vault-app` → health check `127.0.0.1:3001`.

Deploy manual en la VPS (sin CI):

```bash
pnpm deploy            # descarga el último release con gh y reinicia PM2
```

## Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name vault.example.com;   # ajustar al dominio real

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

TLS: `certbot --nginx -d vault.example.com`.

## Primer despliegue (una vez)

1. Crear `/var/www/vault-app/current` y copiar `.env` + `ecosystem.config.cjs`.
2. `createdb`/crear la BD `vault-volt3d` en el Postgres existente (o `prisma migrate deploy`).
3. Añadir los secrets en GitHub.
4. `pnpm release minor --yes` (o `workflow_dispatch`) → primer deploy automático.
5. Configurar el server block de nginx y TLS.
