/**
 * Composable para marcar/desmarcar items como conseguidos.
 * Requiere sesión. Los endpoints viven en /api/items/:id/collect (módulo me-collection).
 */

export interface GamificationState {
  xp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  collectedItems: number
  completedCollections: number
  unlockedKeys: string[]
}

export function useCollectItem() {
  const { isAuthenticated } = useAuthUser()
  const busy = ref(false)

  const toggle = async (itemId: string, collected: boolean) => {
    if (!isAuthenticated.value) {
      await navigateTo('/login')
      return null
    }
    busy.value = true
    try {
      const res = await $fetch<{ success: boolean; collected: boolean; gamification?: GamificationState }>(
        `/api/items/${itemId}/collect`,
        { method: collected ? 'DELETE' : 'POST' },
      )
      return res.gamification ?? null
    } finally {
      busy.value = false
    }
  }

  return { busy, toggle }
}
