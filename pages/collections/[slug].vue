<script setup lang="ts">
import type { CollectionWithItems } from '~/types'
import { metaDescription, absoluteUrl } from '~/utils/seo'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, pending, error } = await useFetch<{ success: boolean; data: CollectionWithItems }>(`/api/collections/${slug.value}`)
const collection = computed<CollectionWithItems | null>(() => data.value?.data ?? null)

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/collections/${slug.value}`)
const metaDesc = computed(() =>
  metaDescription(collection.value?.description, 'Colección de coleccionables impresos en 3D de Volt-3D.'),
)
const ogImage = computed(() => absoluteUrl(collection.value?.coverImage?.url, config.public.siteUrl))

useSeoMeta({
  title: () => (collection.value?.name || 'Colección') + ' — Volt Vault',
  description: metaDesc,
  ogTitle: () => collection.value?.name || 'Colección',
  ogDescription: metaDesc,
  ogType: 'website',
  ogUrl: canonical,
  ogImage,
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <UPage v-if="collection">
    <UPageHero
      :title="collection.name"
      orientation="horizontal"
    >
      <template #default>
        <AppImage
          v-if="collection.coverImage"
          :src="collection.coverImage.url"
          :alt="collection.name"
          class="aspect-[4/3] rounded-lg"
        />
      </template>
      <template #description>
        <TagList v-if="collection.tags?.length" :tags="collection.tags" />
      </template>
    </UPageHero>

    <UPageBody>
      <UContainer class="space-y-8">
        <template v-if="collection.progress">
          <div class="flex items-center gap-4 rounded-lg border border-muted p-4">
            <ProgressRing :percent="collection.progress.percent" :size="88" label="completado" />
            <div class="text-sm">
              <p>Tu progreso</p>
              <p class="text-muted">{{ collection.progress.collected }} / {{ collection.progress.total }} conseguidos</p>
              <p
                v-if="collection.progress.percent === 100"
                class="mt-1 text-[11px] uppercase tracking-wide text-primary"
              >
                Colección completada
              </p>
            </div>
          </div>
        </template>

        <MarkdownContent v-if="collection.description" :source="collection.description" />

        <div>
          <h2 class="text-lg font-semibold">Items</h2>
          <ItemGrid v-if="collection.items.length" :items="collection.items" :collection-slug="collection.slug" class="mt-4" />
          <p v-else class="mt-4 text-muted">Esta colección aún no tiene items publicados.</p>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>

  <div v-else class="py-10">
    <UContainer>
      <USkeleton v-if="pending" class="h-64 rounded-lg" />
      <UAlert v-else-if="error" color="error" title="No se pudo cargar la colección" />
      <UEmpty v-else title="Colección no encontrada" description="Es posible que aún no se publique." />
    </UContainer>
  </div>
</template>
