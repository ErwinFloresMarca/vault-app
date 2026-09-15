<template>
  <UPageCard
    v-if="collection"
    :to="`/collections/${collection.slug}`"
    class="group overflow-hidden hover:shadow-pill"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden">
      <AppImage
        v-if="collection.coverImage?.url"
        :src="collection.coverImage.url"
        :alt="collection.name"
        class="h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800"
      >
        <span class="text-4xl uppercase tracking-wide text-white/80">{{ initials }}</span>
      </div>

      <div
        v-if="collection.progress"
        class="absolute bottom-2 right-2 rounded-full bg-default/90 p-1 backdrop-blur"
      >
        <ProgressRing :percent="collection.progress.percent" :size="44" :stroke-width="5" />
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3>{{ collection.name }}</h3>
        <span v-if="collection.itemCount !== undefined" class="shrink-0 text-xs text-muted">
          {{ collection.itemCount }} {{ collection.itemCount === 1 ? 'item' : 'items' }}
        </span>
      </div>
      <p v-if="collection.description" class="line-clamp-2 text-sm text-muted">
        {{ stripMarkdown(collection.description) }}
      </p>
      <TagList v-if="collection.tags?.length" :tags="collection.tags" class="mt-2" />
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import type { CollectionSummary } from '~/types'

const props = defineProps<{
  collection: CollectionSummary
}>()

const initials = computed(() =>
  props.collection.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join(''),
)

function stripMarkdown(md: string): string {
  return md
    .replace(/[`*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
</script>
