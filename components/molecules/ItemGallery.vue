<template>
  <div v-if="files.length">
    <button
      type="button"
      class="group relative block w-full overflow-hidden rounded-lg ring ring-default"
      :aria-label="`Ampliar ${active.alt || 'imagen'}`"
      @click="lightboxOpen = true"
    >
      <AppImage
        :src="active.url"
        :alt="active.alt || 'Imagen del item'"
        class="aspect-square w-full"
      />
      <span
        class="absolute right-2 top-2 rounded-full bg-default/80 p-1.5 opacity-0 backdrop-blur transition group-hover:opacity-100 motion-reduce:transition-none"
      >
        <UIcon name="i-lucide-maximize-2" class="size-4" />
      </span>
    </button>

    <div v-if="files.length > 1" class="mt-3 grid grid-cols-4 gap-2">
      <button
        v-for="file in files"
        :key="file.id"
        type="button"
        class="overflow-hidden rounded-md ring-1 transition"
        :class="file.id === active.id ? 'ring-primary' : 'ring-default hover:ring-muted'"
        @click="active = file"
      >
        <AppImage
          :src="file.url"
          :alt="file.alt || 'Miniatura'"
          class="aspect-square"
        />
      </button>
    </div>

    <UModal v-model:open="lightboxOpen" :ui="{ content: 'max-w-3xl', body: 'p-0' }">
      <template #body>
        <div class="relative">
          <AppImage
            :src="active.url"
            :alt="active.alt || 'Imagen del item'"
            class="max-h-[80vh] w-full object-contain"
          />
          <button
            v-if="files.length > 1"
            type="button"
            class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-default/80 p-2 backdrop-blur"
            aria-label="Imagen anterior"
            @click="prev"
          >
            <UIcon name="i-lucide-chevron-left" class="size-5" />
          </button>
          <button
            v-if="files.length > 1"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-default/80 p-2 backdrop-blur"
            aria-label="Imagen siguiente"
            @click="next"
          >
            <UIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { FileDto } from '~/types'

const props = defineProps<{
  files: FileDto[]
}>()

const active = ref<FileDto>(props.files[0]!)
const lightboxOpen = ref(false)

function prev() {
  const i = props.files.findIndex((f) => f.id === active.value.id)
  active.value = props.files[(i - 1 + props.files.length) % props.files.length]!
}
function next() {
  const i = props.files.findIndex((f) => f.id === active.value.id)
  active.value = props.files[(i + 1) % props.files.length]!
}
</script>
