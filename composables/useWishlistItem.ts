/**
 * Composable para añadir/quitar items de la wishlist ("lo quiero").
 * Requiere sesión. Endpoint: /api/items/:id/wishlist (SEL-52).
 */
export function useWishlistItem() {
  const { isAuthenticated } = useAuthUser()
  const busy = ref(false)

  const toggle = async (itemId: string, wishlisted: boolean) => {
    if (!isAuthenticated.value) {
      await navigateTo('/login')
      return false
    }
    busy.value = true
    try {
      await $fetch(`/api/items/${itemId}/wishlist`, {
        method: wishlisted ? 'DELETE' : 'POST',
      })
      return true
    } finally {
      busy.value = false
    }
  }

  return { busy, toggle }
}
