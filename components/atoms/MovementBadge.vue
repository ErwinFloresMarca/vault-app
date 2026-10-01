<template>
  <span
    class="label-caps inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
    :style="{ color: info.color, borderColor: `color-mix(in srgb, ${info.color} 40%, transparent)`, backgroundColor: `color-mix(in srgb, ${info.color} 15%, transparent)` }"
  >
    <span class="size-1.5 rounded-full" :style="{ backgroundColor: info.color }" />
    {{ info.label }}
  </span>
</template>

<script setup lang="ts">
type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'

const props = defineProps<{ type: MovementType }>()

const MAP: Record<MovementType, { label: string; color: string }> = {
  IN: { label: 'Entrada', color: 'var(--color-success)' },
  OUT: { label: 'Salida', color: 'var(--color-warning)' },
  SALE: { label: 'Venta', color: 'var(--color-volt)' },
  ADJUSTMENT: { label: 'Ajuste', color: 'var(--color-rarity-common)' },
}

const info = computed(() => MAP[props.type] ?? MAP.ADJUSTMENT)
</script>
