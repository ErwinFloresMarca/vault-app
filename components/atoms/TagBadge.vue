<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="inline-flex items-center rounded-full border border-muted px-2.5 py-0.5 text-xs font-medium text-muted transition hover:border-default hover:text-default"
  >
    #{{ tag.name }}
  </NuxtLink>
  <span
    v-else
    class="inline-flex items-center rounded-full border border-muted px-2.5 py-0.5 text-xs font-medium text-muted"
  >
    #{{ tag.name }}
  </span>
</template>

<script setup lang="ts">
import type { TagDto } from '~/types'

const props = withDefaults(defineProps<{
  tag: TagDto
  to?: string
}>(), {
  to: '',
})
</script>
