<template>
  <VaultCard :to="`/collections/${collection.slug}`">
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-elevated">
      <AppImage
        v-if="collection.coverImage?.url"
        :src="collection.coverImage.url"
        :alt="collection.name"
        class="h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-elevated to-accented"
      >
        <span class="font-display text-4xl font-extrabold uppercase text-white/70">{{ initials }}</span>
      </div>

      <span
        v-if="collection.progress?.percent === 100"
        class="label-caps absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-inverted"
      >
        <UIcon name="i-lucide-stars" class="size-3.5" /> Completada
      </span>

      <span class="label-caps absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-white backdrop-blur">
        <UIcon name="i-lucide-box" class="size-3.5" />
        {{ collection.itemCount }} {{ collection.itemCount === 1 ? 'item' : 'items' }}
      </span>
    </div>

    <div class="flex flex-col gap-2 p-3">
      <h3 class="line-clamp-1 font-display text-[0.9375rem] font-bold transition-colors group-hover:text-primary">{{ collection.name }}</h3>
      <p v-if="collection.description" class="line-clamp-2 text-xs leading-relaxed text-muted">
        {{ stripMarkdown(collection.description) }}
      </p>
      <TagList v-if="collection.tags?.length" :tags="collection.tags" />

      <div class="mt-1 flex items-center gap-2 text-xs text-muted">
        <template v-if="collection.progress">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-accented">
            <div
              class="h-full rounded-full transition-[width] duration-700"
              :class="collection.progress.percent === 100 ? 'bg-gold' : 'bg-primary'"
              :style="{ width: `${collection.progress.percent}%` }"
            />
          </div>
          <span class="shrink-0 font-display font-semibold tabular-nums text-default">
            {{ collection.progress.collected }}/{{ collection.progress.total }}
          </span>
        </template>
        <template v-else>
          <UIcon name="i-lucide-eye" class="size-3.5" />
          <span>Vitrina pública</span>
          <UIcon name="i-lucide-arrow-right" class="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
        </template>
      </div>
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
