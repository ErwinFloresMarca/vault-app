/**
 * Middleware para verificar autenticación.
 * Si la ruta no está en la lista pública y el usuario no está autenticado,
 * redirige a login.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Rutas públicas (catálogo + auth)
  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/auth/error',
    '/collections',
    '/collections/',
    '/galeria',
    '/contacto',
    '/privacy',
    '/terms',
  ]

  // Compatible con rutas dinámicas de catálogo público
  if (
    publicRoutes.includes(to.path) ||
    to.path.startsWith('/collections/')
  ) {
    return
  }

  // Verificar si el usuario está autenticado
  const { data: user } = await useFetch('/api/auth/me')

  if (!user.value) {
    return navigateTo('/login')
  }
})
