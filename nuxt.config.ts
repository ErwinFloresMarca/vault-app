// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  vite: {
    optimizeDeps: {
      include: ['@nuxtjs/mdc']
    }
  },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    'nuxt-auth-utils',
    'nuxt-og-image'
  ],

  // @nuxt/fonts: fuentes del design system. `global: true` para que satori
  // (og:image) las encuentre al renderizar las cards.
  fonts: {
    families: [
      // Figtree: tipografía de la interfaz (estilo MakerWorld).
      { name: 'Figtree', weights: [400, 500, 600, 700, 800, 900], global: true },
      // Plus Jakarta / Hanken: se mantienen para las og:image (satori).
      { name: 'Plus Jakarta Sans', weights: [500, 600, 700, 800], global: true },
      { name: 'Hanken Grotesk', weights: [400, 500, 600, 700], global: true },
    ],
  },

  // OG images generadas (1200×630, PNG) servidas desde el propio dominio.
  ogImage: {
    defaults: {
      width: 1200,
      height: 630,
      extension: 'png',
      cacheMaxAgeSeconds: 60 * 60 * 24 * 30,
    },
    buildCache: true,
  },

  routeRules: {
    '/_og/**': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
  },

  // Atomic Design: registrar los componentes de atoms/molecules/organisms
  // sin el prefijo de directorio (p.ej. <AppImage>, <TagList>, <CollectionCard>).
  components: [
    { path: '~/components/atoms', pathPrefix: false },
    { path: '~/components/molecules', pathPrefix: false },
    { path: '~/components/organisms', pathPrefix: false },
  ],

  // @nuxt/hints: silenciar sugerencias que generan ruido/logs en dev
  // (lazy-load 404, validación HTML, web-vitals) sin utilidad para el usuario.
  hints: {
    features: {
      lazyLoad: false,
      htmlValidate: false,
      webVitals: false,
      hydration: false,
    },
  },

  // @nuxt/image: permitir las imágenes remotas (Unsplash + CDN de MakerWorld) para evitar fallbacks tipo `/1x`.
  image: {
    domains: ['images.unsplash.com', 'makerworld.bblmw.com'],
    provider: 'ipx',
  },

  runtimeConfig: {
    // Private keys - solo servidor
    // nuxt-auth-utils lee runtimeConfig.session.password (o la env NUXT_SESSION_PASSWORD).
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || 'default-32-character-secret-key!!',
    },
    smtpHost: process.env.NUXT_SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.NUXT_SMTP_PORT || '587'),
    smtpUser: process.env.NUXT_SMTP_USER || '',
    smtpPass: process.env.NUXT_SMTP_PASS || '',
    smtpFrom: process.env.NUXT_SMTP_FROM || 'noreply@volt3d.com',
    // Correo(s) que reciben el aviso de cada pedido nuevo (separados por comas).
    orderNotifyEmail: process.env.NUXT_ORDER_NOTIFY_EMAIL || '',
    // Correos que serán administradores automáticamente al iniciar sesión (separados por comas).
    adminEmails: process.env.NUXT_ADMIN_EMAILS || '',
    // Imagen del QR de pago que va en el correo "Pedido realizado" (URL completa o ruta
    // pública, p. ej. /images/qr-pago.png). Vacío = el correo dice que se enviará aparte.
    paymentQrUrl: process.env.NUXT_PAYMENT_QR_URL || '',

    // OAuth
    oauth: {
      google: {
        id: process.env.NUXT_OAUTH_GOOGLE_ID || '',
        secret: process.env.NUXT_OAUTH_GOOGLE_SECRET || '',
      },
      facebook: {
        id: process.env.NUXT_OAUTH_FACEBOOK_ID || '',
        secret: process.env.NUXT_OAUTH_FACEBOOK_SECRET || '',
      },
    },

    // Public keys - disponibles en cliente
    public: {
      apiBase: process.env.NUXT_API_BASE_URL || 'http://localhost:3000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000',
      exchangeRateApiKey: process.env.NUXT_EXCHANGE_RATE_API_KEY || '',
    },
  },

  // sitemap.xml y robots.txt se sirven dinámicamente por sus handlers en server/routes
  // (el prerender de rutas server no es fiable; se omiten expresamente)
  nitro: {
    prerender: {
      crawlLinks: false,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },

  // Tema oscuro (Cyber-Luxe) por defecto; el usuario puede cambiar a claro.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '@gen-prisma': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  }
})