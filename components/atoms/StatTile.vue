<template>
  <div class="flex items-center gap-4 rounded-xl border border-default bg-muted p-4 transition-colors hover:border-accented hover:bg-elevated">
    <div
      class="flex size-11 shrink-0 items-center justify-center rounded-lg"
      :style="{ backgroundColor: `color-mix(in srgb, ${info.color} 18%, transparent)`, color: info.color }"
    >
      <UIcon :name="icon" class="size-6" />
    </div>
    <div class="flex flex-col">
      <span class="font-display text-2xl font-extrabold tabular-nums tracking-tight">{{ value }}</span>
      <span class="text-sm text-muted">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number | string
  label: string
  icon?: string
  color?: 'gold' | 'volt' | 'neon' | 'success'
}>(), {
  icon: 'i-lucide-box',
  color: 'volt',
})

const COLORS = {
  gold: 'var(--color-gold)',
  volt: 'var(--color-volt)',
  neon: 'var(--color-neon)',
  success: 'var(--color-success)',
}

const info = computed(() => ({ color: COLORS[props.color] ?? COLORS.volt }))
</script>
