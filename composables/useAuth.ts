/**
 * Composable para autenticación
 * Proporciona acceso a datos del usuario y funciones de auth.
 *
 * Usa useFetch('/api/auth/me') con una key compartida para que la sesión
 * se recupere ya en el SSR y se hidrate en el cliente vía el payload de Nuxt,
 * de modo que tras el redirect de OAuth el usuario queda identificado.
 */

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: 'USER' | 'ADMIN'
  lastLoginAt: string
  oauthProviders: string[]
}

export const useAuthUser = () => {
  const { data: user, pending, error, refresh } = useFetch<AuthUser>(
    '/api/auth/me',
    { key: 'auth:user' }
  )

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isLoading = computed(() => pending.value)

  const fetchUser = () => refresh()

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    fetchUser,
    logout,
  }
}

/**
 * Composable para redirigir a login si no está autenticado
 */
export const useRequireAuth = (callback?: () => void) => {
  const { user, isLoading, isAuthenticated } = useAuthUser()

  onMounted(async () => {
    if (!isAuthenticated.value && !isLoading.value) {
      await useAuthUser().fetchUser()
    }

    if (!isAuthenticated.value) {
      navigateTo('/login')
    } else if (callback) {
      callback()
    }
  })

  return { user, isAuthenticated }
}

/**
 * Composable para redirigir si no es admin
 */
export const useRequireAdmin = () => {
  const { user, isAdmin } = useAuthUser()

  onMounted(() => {
    if (!isAdmin.value) {
      navigateTo('/')
    }
  })

  return { user, isAdmin }
}
