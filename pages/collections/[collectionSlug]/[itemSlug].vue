<script setup lang="ts">
import type { ItemDetail } from '~/types'
import { metaDescription, absoluteUrl } from '~/utils/seo'

const route = useRoute()
const itemSlug = computed(() => String(route.params.itemSlug))
const collectionSlug = computed(() => String(route.params.collectionSlug))

const { data, pending, error } = await useFetch<{ success: boolean; data: ItemDetail }>(`/api/items/${itemSlug.value}`)
const item = computed<ItemDetail | null>(() => data.value?.data ?? null)

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/collections/${collectionSlug.value}/${itemSlug.value}`)
const metaDesc = computed(() =>
  metaDescription(item.value?.description, 'Item de coleccionable impreso en 3D de Volt-3D.'),
)
const ogImage = computed(() => absoluteUrl(item.value?.files?.[0]?.url, config.public.siteUrl))

useSeoMeta({
  title: () => (item.value?.name || 'Item') + ' — Volt Vault',
  description: metaDesc,
  ogTitle: () => item.value?.name || 'Item',
  ogDescription: metaDesc,
  ogType: 'article',
  ogUrl: canonical,
  ogImage,
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })

const { isAuthenticated } = useAuthUser()
const { busy, toggle } = useCollectItem()
const { busy: wishlistBusy, toggle: toggleWishlist } = useWishlistItem()
const toast = useToast()

const collected = ref(item.value?.collected ?? false)
const celebrate = ref(false)
const wishlisted = ref(item.value?.wishlisted ?? false)
const wishlistCount = ref(item.value?.wishlistCount ?? 0)

async function onWishlist() {
  if (!item.value) return
  const was = wishlisted.value
  const ok = await toggleWishlist(item.value.id, was)
  if (!ok) return
  wishlisted.value = !was
  wishlistCount.value += was ? -1 : 1
}

async function checkCollectionCompleted() {
  try {
    const res = await $fetch<{ data: { progress?: { percent: number } | null } }>(
      `/api/collections/${collectionSlug.value}`,
    )
    if (res.data.progress?.percent === 100) {
      toast.add({
        title: '¡Colección completada!',
        description: 'Has conseguido todos los items de esta colección.',
        icon: 'i-lucide-trophy',
        color: 'primary',
        duration: 6000,
      })
    }
  } catch {
    // El logro es opcional: si falla la comprobación no rompemos la acción.
  }
}

async function onToggle() {
  if (!item.value) return
  const wasCollected = collected.value
  const ok = await toggle(item.value.id, wasCollected)
  if (!ok) return
  collected.value = !wasCollected
  if (!wasCollected) {
    celebrate.value = true
    setTimeout(() => { celebrate.value = false }, 800)
    toast.add({
      title: '¡Conseguido!',
      description: item.value.name,
      icon: 'i-lucide-check-check',
      color: 'success',
    })
    await checkCollectionCompleted()
  }
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
            <RarityBadge :rarity="item.rarity" />
          </div>

          <MarkdownContent v-if="item.description" :source="item.description" />

          <div v-if="isAuthenticated" class="relative inline-block pt-2">
            <CollectedBurst v-if="celebrate" />
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
              :class="{ 'animate-pop': celebrate }"
              color="success"
              icon="i-lucide-check-check"
              :loading="busy"
              :disabled="busy"
              @click="onToggle"
            >
              Conseguido
            </UButton>
          </div>
          <div v-else class="pt-2">
            <UButton to="/login" variant="subtle" icon="i-lucide-log-in">
              Inicia sesión para marcar este elemento como conseguido
            </UButton>
          </div>

          <div v-if="isAuthenticated" class="pt-2">
            <UButton
              :color="wishlisted ? 'error' : 'neutral'"
              :variant="wishlisted ? 'solid' : 'outline'"
              icon="i-lucide-heart"
              :loading="wishlistBusy"
              :disabled="wishlistBusy"
              @click="onWishlist"
            >
              {{ wishlisted ? 'En mi lista' : 'Lo quiero' }}
            </UButton>
          </div>

          <div class="flex items-center gap-4 pt-2 text-xs text-muted">
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-users" /> {{ item.collectedCount ?? 0 }} lo tienen
            </span>
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-heart" /> {{ wishlistCount }} lo quieren
            </span>
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
