/**
 * Middleware para proteger rutas del panel admin.
 * Requiere rol ADMIN; si el usuario no está autenticado redirige a login,
 * si no es admin redirige a inicio.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: user } = await useFetch('/api/auth/me')

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
