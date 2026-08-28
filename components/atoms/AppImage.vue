<template>
  <NuxtImg
    :src="resolvedSrc"
    :alt="alt || 'Imagen'"
    :width="width"
    :height="height"
    loading="lazy"
    class="object-cover"
    :class="imgClass"
    fallback="/logos/volt3d-icon.svg"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  width?: number
  height?: number
  imgClass?: string
}>(), {
  src: null,
  alt: 'Imagen',
  width: 600,
  height: 450,
  imgClass: 'w-full h-full',
})

const resolvedSrc = computed(() => props.src ?? '')
</script>
