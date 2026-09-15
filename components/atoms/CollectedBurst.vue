<template>
  <div class="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
    <span
      v-for="piece in pieces"
      :key="piece.i"
      class="vv-piece"
      :style="{
        '--tx': piece.tx,
        '--ty': piece.ty,
        '--rot': piece.rot,
        '--delay': piece.delay,
        backgroundColor: piece.color,
      }"
    />
  </div>
</template>

<script setup lang="ts">
const COLORS = ['var(--color-volt-blue)', 'var(--color-volt-yellow)', 'var(--color-rarity-epic)']

const pieces = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const dist = 42 + (i % 4) * 16
  return {
    i,
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist)}px`,
    rot: `${(i % 2 ? 1 : -1) * (120 + i * 18)}deg`,
    delay: `${(i % 5) * 20}ms`,
    color: COLORS[i % COLORS.length],
  }
})
</script>
