<template>
  <div class="flex items-center gap-1.5 text-sm">
    <span class="h-2 w-2 rounded-full" :class="dotClass" />
    <span class="text-muted">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  stock: number
}>()

const label = computed(() => {
  if (props.stock > 10) return `Disponible (${props.stock})`
  if (props.stock > 0) return `¡Últimas ${props.stock} unidades!`
  return 'Agotado'
})

const dotClass = computed(() => {
  if (props.stock > 10) return 'bg-emerald-500'
  if (props.stock > 0) return 'bg-amber-500'
  return 'bg-red-500'
})
</script>
