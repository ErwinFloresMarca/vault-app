<template>
  <span
    class="label-caps inline-flex items-center gap-1.5 rounded-full border px-2 py-1"
    :style="style"
  >
    <span
      class="size-1.5 rounded-full"
      :style="{ backgroundColor: info.color, boxShadow: `0 0 6px ${info.color}` }"
    />
    {{ info.label }}
  </span>
</template>

<script setup lang="ts">
import type { Rarity } from '~/types'

const props = defineProps<{ rarity: Rarity }>()

const MAP: Record<Rarity, { label: string; color: string }> = {
  COMMON: { label: 'Común', color: 'var(--color-rarity-common)' },
  RARE: { label: 'Rara', color: 'var(--color-rarity-rare)' },
  EPIC: { label: 'Épica', color: 'var(--color-rarity-epic)' },
  LEGENDARY: { label: 'Legendaria', color: 'var(--color-rarity-legendary)' },
}

const info = computed(() => MAP[props.rarity] ?? MAP.COMMON)
const style = computed(() => ({
  color: info.value.color,
  borderColor: info.value.color,
  backgroundColor: `color-mix(in srgb, ${info.value.color} 15%, transparent)`,
}))
</script>
