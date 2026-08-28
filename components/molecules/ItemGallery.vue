<template>
  <div v-if="files.length">
    <div class="overflow-hidden rounded-lg ring ring-default">
      <AppImage
        :src="active.url"
        :alt="active.alt || 'Imagen del item'"
        class="aspect-square"
      />
    </div>

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
  </div>
</template>

<script setup lang="ts">
import type { FileDto } from '~/types'

const props = defineProps<{
  files: FileDto[]
}>()

const active = ref<FileDto>(props.files[0]!)
</script>
