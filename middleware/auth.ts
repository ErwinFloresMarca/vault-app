/**
 * Middleware para verificar autenticación
 * Si la ruta requiere autenticación y el usuario no está autenticado,
 * redirige a login.
 */
export default defineRouteMiddleware(async (to, from) => {
  // Rutas públicas
  const publicRoutes = ['/', '/galeria', '/contacto', '/auth/error']

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Verificar si el usuario está autenticado
  const { data: user } = await useFetch('/api/auth/me')

  if (!user.value) {
    // Si no está autenticado, redirigir a login
    return navigateTo('/login')
  }
})
