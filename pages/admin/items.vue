<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Items — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ItemRow {
  id: string
  name: string
  slug: string
  status: string
  stock: number
  soldQuantity: number
  collection?: { id: string; name: string }
  files?: Array<{ file: { id: string; url: string } }>
}

interface CollectionOption {
  id: string
  name: string
  status: string
}

const columns: TableColumn<ItemRow>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'collection.name', header: 'Colección' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'stock', header: 'Stock' },
  { accessorKey: 'soldQuantity', header: 'Vendidos' },
  { id: 'actions', header: '' },
]

const { data, pending, error, refresh } = await useFetch<{ success: boolean; data: ItemRow[] }>('/api/admin/items')
const rows = computed<ItemRow[]>(() => data.value?.data ?? [])

const { data: collectionsData } = await useFetch<{ success: boolean; data: CollectionOption[] }>('/api/admin/collections')
const collections = computed<CollectionOption[]>(() => collectionsData.value?.data ?? [])

const modalOpen = ref(false)
const editing = ref<ItemRow | null>(null)
const saving = ref(false)
const form = reactive({ name: '', description: '', status: 'AVAILABLE', collectionId: '', stockInicial: 0, fileId: null as string | null })
const formError = ref('')

const inventoryOpen = ref(false)
const inventoryItem = ref<ItemRow | null>(null)

function mainImageOf(row: ItemRow) {
  return row.files?.find((f) => f.file)?.file ?? null
}

function openInventory(row: ItemRow) {
  inventoryItem.value = row
  inventoryOpen.value = true
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  form.status = 'AVAILABLE'
  form.collectionId = collections.value[0]?.id ?? ''
  form.stockInicial = 0
  form.fileId = null
  formError.value = ''
  modalOpen.value = true
}

function openEdit(row: ItemRow) {
  editing.value = row
  form.name = row.name
  form.description = ''
  form.status = row.status
  form.collectionId = row.collection?.id ?? ''
  form.stockInicial = 0
  form.fileId = mainImageOf(row)?.id ?? null
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  if (!form.name) {
    formError.value = 'El nombre es obligatorio'
    return
  }
  if (!editing.value && !form.collectionId) {
    formError.value = 'Selecciona una colección'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        fileIds: form.fileId ? [form.fileId] : undefined,
      }
      await $fetch(`/api/admin/items/${editing.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/items', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description || undefined,
          status: form.status,
          collectionId: form.collectionId,
          stockInicial: Number(form.stockInicial) || 0,
          fileIds: form.fileId ? [form.fileId] : undefined,
        },
      })
    }
    modalOpen.value = false
    await refresh()
  } catch (e) {
    formError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function remove(row: ItemRow) {
  await $fetch(`/api/admin/items/${row.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Items">
      <template #right>
        <UButton icon="i-lucide-plus" label="Nuevo item" @click="openCreate" />
      </template>
    </UDashboardNavbar>
    <UContainer class="p-6">
      <UAlert v-if="error" color="error" title="No se pudieron cargar los items" />
      <div v-else-if="pending" class="flex justify-center py-16">
        <USkeleton class="h-64 w-full rounded-lg" />
      </div>
      <UPageCard v-else>
        <UTable
          :data="rows"
          :columns="columns"
          :empty="'Sin items'"
        >
          <template #status-cell="{ row }">
            <UBadge :label="row.original.status" :color="row.original.status === 'AVAILABLE' ? 'success' : (row.original.status === 'ARCHIVED' ? 'neutral' : 'warning')" />
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton icon="i-lucide-boxes" variant="ghost" color="neutral" :aria-label="`Inventario de ${row.original.name}`" @click="openInventory(row.original)" />
              <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" :aria-label="`Editar ${row.original.name}`" @click="openEdit(row.original)" />
              <UModal :title="`Eliminar ${row.original.name}?`" description="Se archivará el item.">
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

    <UModal v-model:open="modalOpen" :title="editing ? 'Editar item' : 'Nuevo item'">
      <template #body>
      <UForm :state="form" class="space-y-4" @submit="save">
        <UFormField label="Nombre">
          <UInput v-model="form.name" />
        </UFormField>
        <UFormField v-if="!editing" label="Colección">
          <USelect v-model="form.collectionId" :items="collections.map(c => ({ label: c.name, value: c.id }))" />
        </UFormField>
        <UFormField label="Descripción (Markdown)">
          <UTextarea v-model="form.description" :rows="4" placeholder="Descripción con formato Markdown..." />
        </UFormField>
        <UFormField label="Imagen principal">
          <ImageField v-model="form.fileId" :preview-url="editing ? mainImageOf(editing)?.url : null" />
        </UFormField>
        <UFormField label="Estado">
          <USelect v-model="form.status" :items="['AVAILABLE', 'DRAFT', 'SOLD_OUT', 'ARCHIVED']" />
        </UFormField>
        <UFormField v-if="!editing" label="Stock inicial">
          <UInput v-model.number="form.stockInicial" type="number" min="0" />
        </UFormField>
        <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>
        <UButton type="submit" block :loading="saving" :label="editing ? 'Guardar cambios' : 'Crear'" />
      </UForm>
        </template>
    </UModal>

    <InventoryModal v-model:open="inventoryOpen" :item="inventoryItem" @changed="refresh" />
  </UDashboardPanel>
</template>
