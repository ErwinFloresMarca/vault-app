<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Colecciones — Volt Vault Admin' })

definePageMeta({ layout: 'admin' })

interface CollectionRow {
  id: string
  name: string
  slug: string
  description?: string | null
  status: string
  _count?: { items: number }
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
const form = reactive({ name: '', description: '', status: 'PUBLISHED' as string })
const formError = ref('')

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  form.status = 'PUBLISHED'
  formError.value = ''
  modalOpen.value = true
}

function openEdit(row: CollectionRow) {
  editing.value = row
  form.name = row.name
  form.description = row.description ?? ''
  form.status = row.status
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
    const payload = { name: form.name, description: form.description || undefined, status: form.status }
    if (editing.value) {
      await $fetch(`/api/admin/collections/${editing.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/collections', { method: 'POST', body: payload })
    }
    modalOpen.value = false
    await refresh()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function remove(row: CollectionRow) {
  await $fetch(`/api/admin/collections/${row.id}`, { method: 'DELETE' })
  await refresh()
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
          :rows="rows"
          :columns="columns"
          :empty-state="{ icon: 'i-lucide-collection', label: 'Sin colecciones' }"
        >
          <template #status="{ row }">
            <UBadge :label="row.original.status" :color="row.original.status === 'PUBLISHED' ? 'success' : (row.original.status === 'ARCHIVED' ? 'neutral' : 'warning')" />
          </template>
          <template #actions="{ row }">
            <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" @click="openEdit(row.original)" />
            <UModal :title="`Eliminar ${row.original.name}?`" description="Se archivará la colección.">
              <template #trigger>
                <UButton icon="i-lucide-trash" variant="ghost" color="error" />
              </template>
              <UButton color="error" block label="Archivar" @click="remove(row.original)" />
            </UModal>
          </template>
        </UTable>
      </UPageCard>
    </UContainer>

    <UModal v-model="modalOpen" :title="editing ? 'Editar colección' : 'Nueva colección'">
      <UForm :state="form" class="space-y-4" @submit="save">
        <UFormField label="Nombre">
          <UInput v-model="form.name" />
        </UFormField>
        <UFormField label="Descripción (Markdown)">
          <UTextarea v-model="form.description" :rows="4" placeholder="Descripción con formato Markdown..." />
        </UFormField>
        <UFormField label="Estado">
          <USelect v-model="form.status" :items="['PUBLISHED', 'DRAFT', 'ARCHIVED']" />
        </UFormField>
        <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>
        <UButton type="submit" block :loading="saving" :label="editing ? 'Guardar cambios' : 'Crear' " />
      </UForm>
    </UModal>
  </UDashboardPanel>
</template>
