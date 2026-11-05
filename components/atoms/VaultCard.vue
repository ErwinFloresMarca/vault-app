<template>
  <NuxtLink v-if="to" :to="to" :class="classes" :style="tierStyle">
    <slot />
  </NuxtLink>
  <div v-else :class="classes" :style="tierStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Rarity } from '~/types'

const props = withDefaults(defineProps<{
  to?: string
  tier?: Rarity | null
  glow?: boolean
}>(), {
  to: '',
  tier: null,
  glow: true,
})

const TIER: Record<Rarity, string> = {
  COMMON: 'var(--color-rarity-common)',
  RARE: 'var(--color-rarity-rare)',
  EPIC: 'var(--color-rarity-epic)',
  LEGENDARY: 'var(--color-rarity-legendary)',
}

const classes = computed(() => [
  'group relative block overflow-hidden rounded-xl border border-default bg-muted transition duration-300',
  props.to ? 'hover:-translate-y-1 hover:border-accented hover:shadow-card' : '',
])

const tierStyle = computed(() => {
  if (!props.tier || props.tier === 'COMMON') return {}
  const color = TIER[props.tier]
  return {
    borderColor: color,
    boxShadow: props.glow ? `0 0 25px -8px ${color}` : undefined,
  }
})
</script>
