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

      <span class="label-caps absolute right-2 top-2 rounded-full bg-default/80 px-2.5 py-1 text-default backdrop-blur">
        {{ collection.itemCount }} {{ collection.itemCount === 1 ? 'item' : 'items' }}
      </span>

      <span
        v-if="collection.progress?.percent === 100"
        class="label-caps absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-ink"
      >
        <UIcon name="i-lucide-stars" class="size-3.5" /> Completada
      </span>
    </div>

    <div class="p-4">
      <h3 class="font-display text-lg font-bold transition-colors group-hover:text-gold">{{ collection.name }}</h3>
      <p v-if="collection.description" class="mt-1 line-clamp-2 text-sm text-muted">
        {{ stripMarkdown(collection.description) }}
      </p>
      <TagList v-if="collection.tags?.length" :tags="collection.tags" class="mt-3" />
    </div>

    <div class="flex items-center justify-between border-t border-default px-4 py-3">
      <template v-if="collection.progress">
        <div class="flex items-center gap-2.5">
          <ProgressRing :percent="collection.progress.percent" :size="40" :stroke-width="4" :color="collection.progress.percent === 100 ? 'gold' : 'volt'" />
          <div class="flex flex-col leading-tight">
            <span class="font-display text-sm font-bold tabular-nums">
              {{ collection.progress.collected }} / {{ collection.progress.total }}
            </span>
            <span class="label-caps text-muted">conseguidos</span>
          </div>
        </div>
        <UIcon name="i-lucide-arrow-right" class="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
      </template>
      <template v-else>
        <span class="label-caps text-muted">Vitrina pública</span>
        <UIcon name="i-lucide-arrow-right" class="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
      </template>
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
