<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

defineProps<{
  collections: CollectionSummary[]
}>()
</script>
