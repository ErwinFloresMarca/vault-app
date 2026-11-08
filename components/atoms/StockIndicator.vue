<template>
  <div class="flex items-center gap-1.5 text-xs">
    <span class="size-2 rounded-full" :class="dotClass" />
    <span class="text-muted">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import type { ItemStatus } from '~/types'
import { saleState } from '~/utils/itemAvailability'

const props = defineProps<{
  stock: number
  status?: ItemStatus
}>()

// Sin estado se comporta como antes (solo según el stock).
const state = computed(() => saleState(props.status ?? 'AVAILABLE', props.stock))

const label = computed(() => {
  if (state.value === 'on_demand') return 'A pedido'
  if (state.value === 'sold_out') return 'Agotado'
  if (state.value === 'unavailable') return 'No disponible'
  if (props.stock > 10) return `Disponible (${props.stock})`
  return `¡Últimas ${props.stock} unidades!`
})

const dotClass = computed(() => {
  if (state.value === 'on_demand') return 'bg-volt-blue'
  if (state.value === 'sold_out' || state.value === 'unavailable') return 'bg-danger'
  if (props.stock > 10) return 'bg-success'
  return 'bg-warning'
})
</script>
