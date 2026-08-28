<template>
  <UBadge
    :color="color"
    :variant="variant"
    size="sm"
  >
    {{ label }}
  </UBadge>
</template>

<script setup lang="ts">
import type { CollectionStatus, ItemStatus } from '~/types'

type AnyStatus = CollectionStatus | ItemStatus

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
type BadgeVariant = 'subtle' | 'solid'

const props = defineProps<{
  status: AnyStatus
}>()

const info = computed<{ label: string; color: BadgeColor; variant: BadgeVariant }>(() => {
  switch (props.status) {
    case 'DRAFT': return { label: 'Borrador', color: 'neutral', variant: 'subtle' }
    case 'PUBLISHED': return { label: 'Publicado', color: 'success', variant: 'subtle' }
    case 'AVAILABLE': return { label: 'Disponible', color: 'success', variant: 'subtle' }
    case 'SOLD_OUT': return { label: 'Agotado', color: 'error', variant: 'subtle' }
    case 'ARCHIVED': return { label: 'Archivado', color: 'neutral', variant: 'subtle' }
    default: return { label: props.status, color: 'neutral' as BadgeColor, variant: 'subtle' as BadgeVariant }
  }
})

const label = computed(() => info.value.label)
const color = computed<BadgeColor>(() => info.value.color)
const variant = computed<BadgeVariant>(() => info.value.variant)
</script>
