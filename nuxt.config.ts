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

  runtimeConfig: {
    // Private keys - solo servidor
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'default-32-character-secret-key!!',
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

  // Auth config
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/sitemap.xml', '/robots.txt']
    }
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '@gen-prisma': fileURLToPath(new URL('./generated/prisma', import.meta.url))
  }
})