<script setup lang="ts">
import type { UserStats } from '~/types'

useSeoMeta({
  title: 'Mi colección — Volt Vault',
})

const { user } = useAuthUser()

const { data: statsData } = await useFetch<{ success: boolean; data: UserStats }>('/api/me/stats')
const stats = computed<UserStats | null>(() => statsData.value?.data ?? null)

const { data, pending, error } = await useFetch<{ success: boolean; total: number; data: Array<{
  id: string
  obtainedAt: string
  item: { id: string; name: string; slug: string; image: { url: string; alt: string | null } | null; collection: { name: string; slug: string } }
}> }>('/api/me/collection')

const items = computed(() => data.value?.data ?? [])
</script>

<template>
  <UPage>
    <UPageHero
      :title="`Mi colección`"
      :description="user ? `Hola ${user.name}. Estos son los elementos que has conseguido hasta ahora.` : 'Inicia sesión para ver tu colección.'"
    />

    <UPageBody>
      <UContainer>
        <div v-if="stats" class="mb-8 flex flex-wrap items-center gap-6 rounded-lg border border-muted p-4">
          <ProgressRing :percent="stats.percent" :size="96" label="global" />
          <div class="text-sm">
            <p>{{ stats.collectedItems }} / {{ stats.totalItems }} conseguidos</p>
            <p class="text-muted">{{ stats.completedCollections }} de {{ stats.collections }} colecciones completadas</p>
          </div>
        </div>

        <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <USkeleton v-for="i in 8" :key="i" class="h-48 rounded-lg" />
        </div>

        <UAlert v-else-if="error" color="error" title="Error al cargar tu colección" />

        <template v-else-if="items.length">
          <p class="mb-4 text-sm text-muted">{{ items.length }} {{ items.length === 1 ? 'elemento conseguido' : 'elementos conseguidos' }}</p>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <UPageCard
              v-for="entry in items"
              :key="entry.id"
              :to="`/collections/${entry.item.collection.slug}/${entry.item.slug}`"
            >
              <AppImage :src="entry.item.image?.url" :alt="entry.item.name" class="aspect-square" />
              <div class="p-4">
                <h3 class="font-semibold">{{ entry.item.name }}</h3>
                <p class="text-xs text-muted">{{ entry.item.collection.name }}</p>
              </div>
            </UPageCard>
          </div>
        </template>

        <UEmpty v-else title="Aún no has conseguido nada" description="Explora las colecciones y empieza a completar la tuya.">
          <template #actions>
            <UButton to="/collections" icon="i-lucide-library">Ver colecciones</UButton>
          </template>
        </UEmpty>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
