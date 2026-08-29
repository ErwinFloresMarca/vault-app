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
    'nuxt-auth-utils'
  ],

  // Atomic Design: registrar los componentes de atoms/molecules/organisms
  // sin el prefijo de directorio (p.ej. <AppImage>, <TagList>, <CollectionCard>).
  components: [
    { path: '~/components/atoms', pathPrefix: false },
    { path: '~/components/molecules', pathPrefix: false },
    { path: '~/components/organisms', pathPrefix: false },
  ],

  // @nuxt/hints: silenciar la sugerencia de lazy-load (genera un 404 en dev).
  hints: {
    features: {
      lazyLoad: false,
    },
  },

  // @nuxt/image: permitir las imágenes remotas (Unsplash) para evitar fallbacks tipo `/1x`.
  image: {
    domains: ['images.unsplash.com'],
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
    },
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '@gen-prisma': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  }
})