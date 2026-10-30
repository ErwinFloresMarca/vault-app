<template>
  <img
    v-if="isLocalUpload"
    :src="resolvedSrc"
    :alt="alt || 'Imagen'"
    :width="width"
    :height="height"
    loading="lazy"
    class="object-cover"
    :class="imgClass"
    @error="onError"
  >
  <NuxtImg
    v-else
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

// Los uploads de runtime viven en `public/uploads` y se sirven por `/uploads/...`.
// Se usan como <img> directo porque IPX en producción solo lee `.output/public`
// y devolvería 404. Las URLs remotas siguen pasando por NuxtImg/IPX.
const isLocalUpload = computed(() => resolvedSrc.value.startsWith('/uploads/'))

function onError(event: Event) {
  const image = event.target as HTMLImageElement
  if (!image.src.endsWith('/logos/volt3d-icon.svg')) {
    image.src = '/logos/volt3d-icon.svg'
  }
}
</script>
