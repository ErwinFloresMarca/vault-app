<template>
  <UPageCard v-if="collection" :to="`/collections/${collection.slug}`">
    <template #image>
      <AppImage
        :src="collection.coverImage?.url"
        :alt="collection.name"
        class="aspect-[4/3]"
      />
    </template>

    <template #content>
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-semibold">{{ collection.name }}</h3>
        <span v-if="collection.itemCount !== undefined" class="text-xs text-muted shrink-0">
          {{ collection.itemCount }} {{ collection.itemCount === 1 ? 'item' : 'items' }}
        </span>
      </div>
      <p v-if="collection.description" class="line-clamp-2 text-sm text-muted">
        {{ stripMarkdown(collection.description) }}
      </p>
      <TagList v-if="collection.tags?.length" :tags="collection.tags" class="mt-2" />
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
import type { CollectionSummary } from '~/types'

const props = defineProps<{
  collection: CollectionSummary
}>()

function stripMarkdown(md: string): string {
  return md
    .replace(/[`*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
</script>
