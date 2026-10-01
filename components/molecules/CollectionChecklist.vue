<template>
  <ul class="flex flex-col gap-2">
    <li v-for="(item, index) in items" :key="item.id">
      <NuxtLink
        :to="`/collections/${collectionSlug}/${item.slug}`"
        class="group flex items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-elevated"
        :class="item.collected ? 'border-success/40 bg-success/5' : 'border-default bg-muted'"
      >
        <span class="w-8 shrink-0 text-center font-display text-sm font-bold tabular-nums text-muted">
          {{ String(index + 1).padStart(2, '0') }}
        </span>

        <div class="size-12 shrink-0 overflow-hidden rounded-xl border border-default bg-elevated">
          <AppImage
            v-if="item.mainImage?.url"
            :src="item.mainImage.url"
            :alt="item.name"
            class="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="flex h-full w-full items-center justify-center">
            <UIcon name="i-lucide-box" class="size-5 text-muted" />
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate font-display font-semibold">{{ item.name }}</span>
          <div class="mt-0.5 flex items-center gap-2">
            <RarityBadge :rarity="item.rarity" />
            <StockIndicator v-if="!item.collected" :stock="item.stock" />
          </div>
        </div>

        <UIcon
          :name="item.collected ? 'i-lucide-circle-check' : 'i-lucide-circle'"
          class="size-6 shrink-0"
          :class="item.collected ? 'text-success' : 'text-muted'"
        />
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ItemSummary } from '~/types'

defineProps<{
  items: ItemSummary[]
  collectionSlug: string
}>()
</script>
