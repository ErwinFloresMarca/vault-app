<template>
  <div class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
    <ItemCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :collection-slug="collectionSlug"
    />
  </div>
</template>

<script setup lang="ts">
import type { ItemSummary } from '~/types'

defineProps<{
  items: ItemSummary[]
  collectionSlug: string
}>()
</script>
