<template>
  <VaultCard :to="`/collections/${collection.slug}`">
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
        <span class="font-display text-4xl font-extrabold uppercase text-white/80">{{ initials }}</span>
      </div>

      <div
        v-if="collection.progress"
        class="absolute bottom-2 right-2 rounded-full border border-default bg-default/80 p-1 backdrop-blur"
      >
        <ProgressRing :percent="collection.progress.percent" :size="48" :stroke-width="5" />
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-display text-lg font-bold">{{ collection.name }}</h3>
        <span class="label-caps shrink-0 text-muted">
          {{ collection.itemCount }} {{ collection.itemCount === 1 ? 'item' : 'items' }}
        </span>
      </div>
      <p v-if="collection.description" class="mt-1 line-clamp-2 text-sm text-muted">
        {{ stripMarkdown(collection.description) }}
      </p>
      <TagList v-if="collection.tags?.length" :tags="collection.tags" class="mt-3" />
    </div>

    <div class="flex items-center justify-between border-t border-default px-4 py-3">
      <span class="label-caps text-muted">Progreso</span>
      <span class="font-display font-bold tabular-nums">
        {{ collection.progress ? `${collection.progress.collected}/${collection.progress.total}` : '—' }}
      </span>
    </div>
  </VaultCard>
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
