<template>
  <span
    class="label-caps inline-flex items-center gap-1.5 rounded-full border px-2 py-1"
    :style="{ color: info.color, borderColor: info.color, backgroundColor: `color-mix(in srgb, ${info.color} 15%, transparent)` }"
  >
    <span class="size-1.5 rounded-full" :style="{ backgroundColor: info.color }" />
    {{ info.label }}
  </span>
</template>

<script setup lang="ts">
import type { CollectionStatus, ItemStatus } from '~/types'

type AnyStatus = CollectionStatus | ItemStatus

const props = defineProps<{ status: AnyStatus }>()

const MAP: Record<AnyStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: '#f59e0b' },
  PUBLISHED: { label: 'Publicado', color: '#22c55e' },
  AVAILABLE: { label: 'Disponible', color: '#22c55e' },
  SOLD_OUT: { label: 'Agotado', color: '#ffb4ab' },
  ARCHIVED: { label: 'Archivado', color: '#94a3b8' },
}

const info = computed(() => MAP[props.status] ?? { label: props.status, color: '#94a3b8' })
</script>
