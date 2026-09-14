<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Colecciones — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CollectionRow {
  id: string
  name: string
  slug: string
  description?: string | null
  status: string
  _count?: { items: number }
  files?: Array<{ file: { id: string; url: string } }>
}

const columns: TableColumn<CollectionRow>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: '_count.items', header: 'Items' },
  { id: 'actions', header: '' },
]

const { data, pending, error, refresh } = await useFetch<{ success: boolean; data: CollectionRow[] }>('/api/admin/collections')
const rows = computed<CollectionRow[]>(() => data.value?.data ?? [])

const modalOpen = ref(false)
const editing = ref<CollectionRow | null>(null)
const saving = ref(false)
const form = reactive({ name: '', description: '', status: 'PUBLISHED' as string, fileId: null as string | null })
const formError = ref('')

function coverOf(row: CollectionRow) {
  return row.files?.find((f) => f.file)?.file ?? null
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  form.status = 'PUBLISHED'
  form.fileId = null
  formError.value = ''
  modalOpen.value = true
}

function openEdit(row: CollectionRow) {
  editing.value = row
  form.name = row.name
  form.description = row.description ?? ''
  form.status = row.status
  form.fileId = coverOf(row)?.id ?? null
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  if (!form.name) {
    formError.value = 'El nombre es obligatorio'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      fileIds: form.fileId ? [form.fileId] : undefined,
    }
    if (editing.value) {
      await $fetch(`/api/admin/collections/${editing.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/collections', { method: 'POST', body: payload })
    }
    modalOpen.value = false
    await refresh()
  } catch (e) {
    formError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function remove(row: CollectionRow) {
  await $fetch(`/api/admin/collections/${row.id}`, { method: 'DELETE' })
  await refresh()
}

const batchCollection = ref<{ id: string; name: string } | null>(null)
const batchOpen = ref(false)

function openBatch(row: CollectionRow) {
  batchCollection.value = { id: row.id, name: row.name }
  batchOpen.value = true
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Colecciones">
      <template #right>
        <UButton icon="i-lucide-plus" label="Nueva colección" @click="openCreate" />
      </template>
    </UDashboardNavbar>
    <UContainer class="p-6">
      <UAlert v-if="error" color="error" title="No se pudieron cargar las colecciones" />
      <div v-else-if="pending" class="flex justify-center py-16">
        <USkeleton class="h-64 w-full rounded-lg" />
      </div>
      <UPageCard v-else>
        <UTable
          :data="rows"
          :columns="columns"
          :empty="'Sin colecciones'"
        >
          <template #status-cell="{ row }">
            <UBadge :label="row.original.status" :color="row.original.status === 'PUBLISHED' ? 'success' : (row.original.status === 'ARCHIVED' ? 'neutral' : 'warning')" />
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton icon="i-lucide-boxes" variant="ghost" color="neutral" :aria-label="`Inventario de ${row.original.name}`" title="Registrar movimiento por grupo" @click="openBatch(row.original)" />
              <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" :aria-label="`Editar ${row.original.name}`" @click="openEdit(row.original)" />
              <UModal :title="`Eliminar ${row.original.name}?`" description="Se archivará la colección.">
                <UButton icon="i-lucide-trash" variant="ghost" color="error" :aria-label="`Eliminar ${row.original.name}`" />
                <template #footer="{ close }">
                  <UButton color="neutral" variant="outline" label="Cancelar" @click="close" />
                  <UButton color="error" label="Archivar" @click="remove(row.original)" />
                </template>
              </UModal>
            </div>
          </template>
        </UTable>
      </UPageCard>
    </UContainer>

    <UModal v-model:open="modalOpen" :title="editing ? 'Editar colección' : 'Nueva colección'">
      <template #body>
      <UForm :state="form" class="space-y-4" @submit="save">
        <UFormField label="Nombre">
          <UInput v-model="form.name" />
        </UFormField>
        <UFormField label="Descripción (Markdown)">
          <UTextarea v-model="form.description" :rows="4" placeholder="Descripción con formato Markdown..." />
        </UFormField>
        <UFormField label="Imagen de portada">
          <ImageField v-model="form.fileId" :preview-url="editing ? coverOf(editing)?.url : null" />
        </UFormField>
        <UFormField label="Estado">
          <USelect v-model="form.status" :items="['PUBLISHED', 'DRAFT', 'ARCHIVED']" />
        </UFormField>
        <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>
        <UButton type="submit" block :loading="saving" :label="editing ? 'Guardar cambios' : 'Crear' " />
      </UForm>
      </template>
    </UModal>

    <CollectionBatchModal
      :open="batchOpen"
      :collection="batchCollection"
      @update:open="batchOpen = $event"
      @changed="refresh"
    />
  </UDashboardPanel>
</template>
