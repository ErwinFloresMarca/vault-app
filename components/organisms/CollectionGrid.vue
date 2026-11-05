<template>
  <div
    class="grid grid-cols-2 gap-3 sm:gap-4"
    :class="columns === 'three' ? 'md:grid-cols-3' : 'md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'"
  >
    <CollectionCard
      v-for="collection in collections"
      :key="collection.id"
      :collection="collection"
    />
  </div>
</template>

<script setup lang="ts">
import CollectionCard from '~/components/molecules/CollectionCard.vue'
import type { CollectionSummary } from '~/types'

withDefaults(defineProps<{
  collections: CollectionSummary[]
  /** Solo presentación: 'three' fija 3 columnas (p.ej. destacados del inicio). */
  columns?: 'auto' | 'three'
}>(), {
  columns: 'auto',
})
</script>
