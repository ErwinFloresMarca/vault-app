/**
 * Middleware de páginas de /admin.
 * Requiere rol ADMIN: sin sesión → /login; sin rol → /.
 * Se aplica con definePageMeta({ middleware: 'admin' }).
 */
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch('/api/auth/me', { key: 'auth:user' })

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
