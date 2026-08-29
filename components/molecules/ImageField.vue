<template>
  <div class="space-y-3">
    <div class="flex items-start gap-3">
      <div v-if="fileId" class="flex h-24 w-24 shrink-0 overflow-hidden rounded-md border border-(--ui-border)">
        <AppImage :src="currentPreview" class="h-full w-full" img-class="rounded-md" />
      </div>
      <div v-else class="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-(--ui-border) text-muted">
        <Icon name="i-lucide-image" class="h-6 w-6" />
      </div>

      <div class="flex flex-col items-start gap-1.5 pt-1">
        <div class="flex items-center gap-1.5">
          <UButton icon="i-lucide-upload" :label="fileId ? 'Reemplazar' : 'Subir imagen'" :loading="uploading" @click="triggerUpload" />
          <UButton v-if="fileId" icon="i-lucide-x" variant="ghost" color="error" size="sm" label="Quitar" @click="remove" />
        </div>
        <UButton v-if="existingFiles.length" icon="i-lucide-images" variant="ghost" color="neutral" size="xs" label="Elegir de la galería" @click="galleryOpen = true" />
        <p class="text-xs text-muted">JPG, PNG, WebP o GIF · máx. 5 MB</p>
        <p v-if="formError" class="text-xs text-(--ui-error)">{{ formError }}</p>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFileSelected" />

    <UModal v-model:open="galleryOpen" title="Galería de imágenes">
      <template #body>
        <div v-if="existingFiles.length" class="grid grid-cols-3 gap-3">
          <button
            v-for="f in existingFiles"
            :key="f.id"
            type="button"
            class="overflow-hidden rounded-md border border-(--ui-border) p-1 transition hover:border-(--ui-primary)"
            @click="pick(f)"
          >
            <AppImage :src="f.url" class="aspect-square w-full" img-class="rounded-md" />
          </button>
        </div>
        <UEmpty v-else title="Sin imágenes subidas" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | null
  previewUrl?: string | null
}>(), {
  modelValue: null,
  previewUrl: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const fileId = computed<string | null>(() => props.modelValue ?? null)

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const galleryOpen = ref(false)
const formError = ref('')

interface FileItem {
  id: string
  url: string
}

const { data: existingFilesData, refresh: refreshFiles } = await useFetch<FileItem[]>('/api/files')
const existingFiles = computed<FileItem[]>(() => existingFilesData.value ?? [])

const currentPreview = computed<string | null>(() => {
  if (props.previewUrl) return props.previewUrl
  if (fileId.value) {
    return existingFiles.value.find((f) => f.id === fileId.value)?.url ?? null
  }
  return null
})

function triggerUpload() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  formError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ success: boolean; file: FileItem }>('/api/admin/files', {
      method: 'POST',
      body: formData,
    })
    emit('update:modelValue', res.file.id)
    await refreshFiles()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage ?? 'Error al subir la imagen'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function pick(file: FileItem) {
  emit('update:modelValue', file.id)
  galleryOpen.value = false
}

function remove() {
  emit('update:modelValue', null)
}
</script>
