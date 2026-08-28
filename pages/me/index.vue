<script setup lang="ts">
useSeoMeta({
  title: 'Mi colección — Volt Vault',
})

const { user } = useAuthUser()

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
              <template #image>
                <AppImage :src="entry.item.image?.url" :alt="entry.item.name" class="aspect-square" />
              </template>
              <template #content>
                <h3 class="font-semibold">{{ entry.item.name }}</h3>
                <p class="text-xs text-muted">{{ entry.item.collection.name }}</p>
              </template>
            </UPageCard>
          </div>
        </template>

        <UEmptyState v-else title="Aún no has conseguido nada" description="Explora las colecciones y empieza a completar la tuya.">
          <template #actions>
            <UButton to="/collections" icon="i-lucide-collection">Ver colecciones</UButton>
          </template>
        </UEmptyState>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
