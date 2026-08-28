/**
 * Composable para marcar/desmarcar items como conseguidos.
 * Requiere sesión. Los endpoints viven en /api/items/:id/collect (módulo me-collection).
 */
export function useCollectItem() {
  const { isAuthenticated } = useAuthUser()
  const busy = ref(false)

  const toggle = async (itemId: string, collected: boolean) => {
    if (!isAuthenticated.value) {
      await navigateTo('/login')
      return false
    }
    busy.value = true
    try {
      await $fetch(`/api/items/${itemId}/collect`, {
        method: collected ? 'DELETE' : 'POST',
      })
      return true
    } finally {
      busy.value = false
    }
  }

  return { busy, toggle }
}
