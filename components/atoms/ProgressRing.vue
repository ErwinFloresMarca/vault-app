<template>
  <div
    class="relative inline-flex shrink-0 items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg :width="size" :height="size" class="-rotate-90">
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="var(--ui-border-accented)"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
    <div class="absolute text-center leading-none">
      <span class="block font-display text-lg font-extrabold tabular-nums">{{ percent }}%</span>
      <span v-if="label" class="label-caps mt-0.5 block text-muted">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  percent: number
  size?: number
  strokeWidth?: number
  label?: string
  color?: 'gold' | 'volt' | 'neon'
}>(), {
  size: 96,
  strokeWidth: 8,
  label: '',
  color: 'gold',
})

const STROKE = {
  gold: 'var(--color-gold)',
  volt: 'var(--color-volt)',
  neon: 'var(--color-neon)',
}

const strokeColor = computed(() => STROKE[props.color] ?? STROKE.gold)
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() =>
  circumference.value * (1 - Math.min(100, Math.max(0, props.percent)) / 100),
)
</script>
