<template>
  <MDC
    v-if="source"
    :value="source"
    tag="div"
    class="prose prose-neutral dark:prose-invert max-w-none"
  />
</template>

<script setup lang="ts">
defineProps<{
  source?: string | null
}>()
</script>
