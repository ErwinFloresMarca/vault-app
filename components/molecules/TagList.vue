<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1.5" :class="$attrs.class">
    <TagBadge v-for="tag in tags" :key="tag.id" :tag="tag" />
  </div>
</template>

<script setup lang="ts">
import type { TagDto } from '~/types'

defineProps<{
  tags: TagDto[]
}>()
</script>
