# Deploy — Volt Vault (`vault-app`)

Desplegado en la **VPS Hostinger** (`72.61.55.208`, alias SSH `hostinger`) con el
mismo patrón que coin-holder: build en GitHub Actions → release `.output` en
tar.gz → PM2. Convive con coin-holder (3000), sindicato-api (3001), etc., usando
el **puerto 3010** y la **misma Postgres** (contenedor `coin-holder-db`, BD
`vault-volt3d`).

## Estado actual

- **PM2**: app `vault-app` (`.output/server/index.mjs`, `--env-file=.env`, `PORT=3010`).
- **Nginx**: `/etc/nginx/sites-available/vault.volt-3d.store` → `127.0.0.1:3010`
  (HTTP :80; TLS lo termina **Cloudflare**, como en holder).
- **BD**: `vault-volt3d` creada y migrada/sembrada en `coin-holder-db`.
- **Pipeline**: `.github/workflows/build-release.yml` en verde (deploy + health check).

## Layout en la VPS

```
/var/www/vault-app/current/
├── .output/               # artefacto desplegado (rm + tar del release)
├── .env                   # secretos de producción (chmod 600, NO en git)
└── ecosystem.config.cjs
```

## Secrets de GitHub (`ErwinFloresMarca/vault-app`)

| Secret | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://volt3d-coins:<pass>@72.61.55.208:5432/vault-volt3d` (público, para `prisma migrate deploy` en CI) |
| `VPS_HOST` | `72.61.55.208` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | clave **CI dedicada** `~/.ssh/ci-cd-vault` (sin passphrase) |

> La clave `~/.ssh/ci-cd-hostinger` está protegida con passphrase y no sirve para
> CI. Se generó `~/.ssh/ci-cd-vault` (ed25519, sin passphrase) y su pública se
> añadió a `/root/.ssh/authorized_keys` de la VPS.

## `.env` de producción (en `/var/www/vault-app/current/.env`)

`DATABASE_URL` (127.0.0.1), `NUXT_SESSION_PASSWORD`, OAuth Google/Facebook
(reutilizados de coin-holder), `PORT=3010`, `NUXT_PUBLIC_SITE_URL`/`NUXT_API_BASE_URL`
= `https://vault.volt-3d.store`, SMTP y exchange rate.

## Flujo de release

```bash
pnpm release patch   # gates (main limpio/al día + lint/typecheck/build) → bump+tag+push
```

CI (on tag `v*` o `workflow_dispatch`): `prisma migrate deploy` → generate →
lint → typecheck → build (`NITRO_PRESET=node-server`) → release
`vault-app-v<version>.tar.gz` → SCP + SSH → `pm2 restart vault-app` → health
check `127.0.0.1:3010`.

Deploy manual en la VPS: `pnpm deploy` (descarga el último release con `gh`).

## Pendiente (manual, requiere tus cuentas)

1. **DNS (Cloudflare)**: crear registro `A` `vault.volt-3d.store` → `72.61.55.208`,
   **proxied** (naranja). TLS lo da Cloudflare.
2. **OAuth**: añadir los redirect URIs `https://vault.volt-3d.store/auth/google` y
   `https://vault.volt-3d.store/auth/facebook` en las apps de Google/Facebook.
   (Mientras no resuelva el DNS, se puede probar con `Host:` o por IP:3010.)

## Nginx (referencia)

```nginx
server {
    listen 80;
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
