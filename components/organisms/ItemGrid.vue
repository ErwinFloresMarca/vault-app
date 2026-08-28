<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
