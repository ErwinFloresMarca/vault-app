<template>
  <VaultCard :to="`/collections/${collectionSlug}/${item.slug}`" :tier="item.rarity">
    <div class="relative aspect-square w-full overflow-hidden bg-elevated">
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
        class="label-caps absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-inverted"
      >
        <UIcon name="i-lucide-check" class="size-3.5" /> Conseguido
      </span>
    </div>

    <div class="flex flex-col gap-1.5 p-3">
      <h3 class="line-clamp-1 font-display text-[0.9375rem] font-bold transition-colors group-hover:text-primary">{{ item.name }}</h3>
      <div class="flex items-center justify-between gap-2">
        <StockIndicator :stock="item.stock" />
        <span v-if="item.price != null" class="font-display text-sm font-extrabold tabular-nums">{{ formatBs(item.price) }}</span>
      </div>
    </div>
  </VaultCard>
</template>

<script setup lang="ts">
import type { ItemSummary } from '~/types'
import { formatBs } from '~/composables/useCart'

defineProps<{
  item: ItemSummary
  collectionSlug: string
}>()
</script>
