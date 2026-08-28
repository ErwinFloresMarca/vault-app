<template>
  <UPageCard v-if="item" :to="`/collections/${collectionSlug}/${item.slug}`">
    <template #image>
      <AppImage
        :src="item.mainImage?.url"
        :alt="item.name"
        class="aspect-square"
      />
    </template>

    <template #content>
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold">{{ item.name }}</h3>
        <StockIndicator :stock="item.stock" class="shrink-0" />
      </div>
      <div class="mt-2 flex items-center gap-2">
        <UBadge v-if="item.collected" color="success" variant="subtle" icon="i-lucide-check">
          Conseguido
        </UBadge>
      </div>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
import type { ItemSummary } from '~/types'

const props = defineProps<{
  item: ItemSummary
  collectionSlug: string
}>()
</script>
