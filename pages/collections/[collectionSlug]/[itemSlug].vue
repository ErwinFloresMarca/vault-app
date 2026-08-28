<script setup lang="ts">
import type { ItemDetail } from '~/types'

const route = useRoute()
const itemSlug = computed(() => String(route.params.itemSlug))
const collectionSlug = computed(() => String(route.params.collectionSlug))

useSeoMeta({
  title: () => (item.value?.name || 'Item') + ' — Volt Vault',
  description: () => item.value?.description ? undefined : 'Item de coleccionable impreso en 3D de Volt-3D.',
})

const { data, pending, error } = await useFetch<{ success: boolean; data: ItemDetail }>(`/api/items/${itemSlug.value}`)
const item = computed<ItemDetail | null>(() => data.value?.data ?? null)

const { user, isAuthenticated } = useAuthUser()
const { busy, toggle } = useCollectItem()

const collected = ref(item.value?.collected ?? false)

async function onToggle() {
  if (!item.value) return
  const ok = await toggle(item.value.id, collected.value)
  if (ok) collected.value = !collected.value
}
</script>

<template>
  <UPage v-if="item">
    <UContainer class="py-8">
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ItemGallery :files="item.files" />

        <div class="space-y-4">
          <NuxtLink :to="`/collections/${collectionSlug}`" class="text-sm text-muted hover:text-default">
            ← {{ item.collection.name }}
          </NuxtLink>

          <h1 class="text-3xl font-bold">{{ item.name }}</h1>

          <div class="flex items-center gap-2">
            <StatusBadge :status="item.status" />
            <StockIndicator :stock="item.stock" />
          </div>

          <MarkdownContent v-if="item.description" :source="item.description" />

          <div v-if="isAuthenticated" class="pt-2">
            <UButton
              v-if="!collected"
              icon="i-lucide-check"
              :loading="busy"
              :disabled="busy"
              @click="onToggle"
            >
              Conseguir
            </UButton>
            <UButton
              v-else
              color="success"
              icon="i-lucide-check-check"
              :loading="busy"
              :disabled="busy"
              @click="onToggle"
            >
              ✓ Conseguido
            </UButton>
          </div>
          <div v-else class="pt-2">
            <UButton to="/login" variant="subtle" icon="i-lucide-log-in">
              Inicia sesión para marcar este elemento como conseguido
            </UButton>
          </div>
        </div>
      </div>
    </UContainer>
  </UPage>

  <div v-else class="py-10">
    <UContainer>
      <USkeleton v-if="pending" class="h-64 rounded-lg" />
      <UAlert v-else-if="error" color="error" title="No se pudo cargar el item" />
      <UEmpty v-else title="Item no encontrado" />
    </UContainer>
  </div>
</template>
