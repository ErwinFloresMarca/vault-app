<template>
  <VaultCard :to="`/collections/${collectionSlug}/${item.slug}`" :tier="item.rarity">
    <div class="relative aspect-square w-full overflow-hidden">
      <AppImage
        :src="item.mainImage?.url"
        :alt="item.name"
        class="h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <div class="absolute left-2 top-2">
        <RarityBadge :rarity="item.rarity" />
      </div>
      <span
        v-if="item.collected"
        class="label-caps absolute right-2 top-2 rounded-full border border-success/40 bg-success/15 px-2 py-1 text-success"
      >
        Conseguido
      </span>
    </div>

    <div class="p-4">
      <h3 class="line-clamp-1 font-display text-base font-bold">{{ item.name }}</h3>
      <div class="mt-2">
        <StockIndicator :stock="item.stock" />
      </div>
    </div>
  </VaultCard>
</template>

<script setup lang="ts">
import type { ItemSummary } from '~/types'

defineProps<{
  item: ItemSummary
  collectionSlug: string
}>()
</script>
