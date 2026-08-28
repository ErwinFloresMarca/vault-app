/**
 * Composable para autenticación
 * Proporciona acceso a datos del usuario y funciones de auth
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
  const user = useState<AuthUser | null>('auth.user', () => null)
  const isLoading = useState<boolean>('auth.isLoading', () => false)
  const error = useState<string | null>('auth.error', () => null)

  const fetchUser = async () => {
    isLoading.value = true
    try {
      const { data, error: err } = await useFetch<AuthUser>('/api/auth/me')
      if (err.value) {
        user.value = null
      } else {
        user.value = data.value ?? null
      }
      error.value = err.value?.message ?? null
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      await navigateTo('/')
    } catch (err) {
      error.value = (err as Error)?.message ?? 'Error al cerrar sesión'
    } finally {
      isLoading.value = false
    }
  }

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

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
