/**
 * Middleware GLOBAL de autenticación.
 * Deja pasar las rutas públicas (catálogo + auth); el resto requiere sesión y
 * redirige a /login. La autorización real de datos sigue en las APIs
 * (requireUser/requireAdmin): esto es UX/redirección, no la única barrera.
 *
 * Para añadir una página pública nueva, inclúyela aquí (o en el prefijo).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/auth/error',
    '/collections',
    '/privacy',
    '/terms',
    '/cart',
  ]

  // Catálogo público (incluye rutas dinámicas /collections/[slug]/…).
  if (publicRoutes.includes(to.path) || to.path.startsWith('/collections/')) {
    return
  }

  // Comparte la key con useAuthUser() para no duplicar el fetch.
  const { data: user } = await useFetch('/api/auth/me', { key: 'auth:user' })

  if (!user.value) {
    return navigateTo('/login')
  }
})
