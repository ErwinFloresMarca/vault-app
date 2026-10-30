<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ItemStatus, Rarity, ItemSpecDto } from '~/types'

useSeoMeta({ title: 'Items — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ItemRow {
  id: string
  name: string
  slug: string
  status: ItemStatus
  rarity: Rarity
  stock: number
  soldQuantity: number
  collection?: { id: string; name: string }
  files?: Array<{ file: { id: string; url: string } }>
  spec?: ItemSpecDto | null
}

interface CollectionOption {
  id: string
  name: string
  status: string
}

const columns: TableColumn<ItemRow>[] = [
  { accessorKey: 'name', header: 'Item' },
  { accessorKey: 'rarity', header: 'Rareza', id: 'rarity' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'stock', header: 'Stock' },
  { accessorKey: 'soldQuantity', header: 'Vendidos' },
  { id: 'actions', header: ' ' },
]

const { data, pending, error, refresh } = await useFetch<{ success: boolean; data: ItemRow[] }>('/api/admin/items')
const rows = computed<ItemRow[]>(() => data.value?.data ?? [])

const toast = useToast()
const localizingId = ref<string | null>(null)

const { data: collectionsData } = await useFetch<{ success: boolean; data: CollectionOption[] }>('/api/admin/collections')
const collections = computed<CollectionOption[]>(() => collectionsData.value?.data ?? [])

const modalOpen = ref(false)
const editing = ref<ItemRow | null>(null)
const saving = ref(false)
const form = reactive({
  name: '',
  description: '',
  status: 'AVAILABLE',
  rarity: 'COMMON',
  collectionId: '',
  stockInicial: 0,
  fileId: null as string | null,
  spec: { scale: '', material: '', lighting: '', base: '' },
})
const formError = ref('')

const inventoryOpen = ref(false)
const inventoryItem = ref<ItemRow | null>(null)

function mainImageOf(row: ItemRow | null) {
  return row?.files?.find((f) => f.file)?.file ?? null
}

function isRemoteImage(file: { url: string } | null | undefined): boolean {
  return !!file?.url && /^https:\/\/(makerworld\.bblmw\.com|images\.unsplash\.com)\//.test(file.url)
}

async function localizeImage(file: { id: string; url: string } | null, row?: ItemRow | null) {
  if (!file || !isRemoteImage(file)) return

  localizingId.value = file.id
  try {
    const response = await $fetch<{ success: boolean; data: { id: string; url: string } }>(
      `/api/admin/files/${file.id}/localize`,
      { method: 'POST' },
    )

    const updatedUrl = response.data.url
    const target = row?.files?.find((item) => item.file.id === file.id)
    if (target) target.file.url = updatedUrl
    const editingTarget = editing.value?.files?.find((item) => item.file.id === file.id)
    if (editingTarget) editingTarget.file.url = updatedUrl

    toast.add({
      title: 'Foto guardada en local',
      description: 'La imagen ya no depende del servidor original.',
      icon: 'i-lucide-check-check',
      color: 'success',
    })
    await refresh()
  } catch (e) {
    const message = (e as { data?: { statusMessage?: string } })?.data?.statusMessage
      ?? 'No se pudo guardar la foto en local'
    toast.add({
      title: 'Error al guardar la foto',
      description: message,
      icon: 'i-lucide-circle-alert',
      color: 'error',
    })
  } finally {
    localizingId.value = null
  }
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
  form.rarity = 'COMMON'
  form.collectionId = collections.value[0]?.id ?? ''
  form.stockInicial = 0
  form.fileId = null
  form.spec = { scale: '', material: '', lighting: '', base: '' }
  formError.value = ''
  modalOpen.value = true
}

function openEdit(row: ItemRow) {
  editing.value = row
  form.name = row.name
  form.description = ''
  form.status = row.status
  form.rarity = row.rarity
  form.collectionId = row.collection?.id ?? ''
  form.stockInicial = 0
  form.fileId = mainImageOf(row)?.id ?? null
  form.spec = {
    scale: row.spec?.scale ?? '',
    material: row.spec?.material ?? '',
    lighting: row.spec?.lighting ?? '',
    base: row.spec?.base ?? '',
  }
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
        rarity: form.rarity,
        fileIds: form.fileId ? [form.fileId] : undefined,
        spec: form.spec,
      }
      await $fetch(`/api/admin/items/${editing.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/items', {
        method: 'POST',
        body: {
          name: form.name,
          description: form.description || undefined,
          status: form.status,
          rarity: form.rarity,
          collectionId: form.collectionId,
          stockInicial: Number(form.stockInicial) || 0,
          fileIds: form.fileId ? [form.fileId] : undefined,
          spec: form.spec,
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
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 shrink-0 overflow-hidden rounded-xl border border-default bg-elevated">
                <AppImage
                  v-if="mainImageOf(row.original)?.url"
                  :src="mainImageOf(row.original)!.url"
                  :alt="row.original.name"
                  class="h-full w-full"
                  :width="80"
                  :height="80"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <UIcon name="i-lucide-image" class="size-4 text-muted" />
                </div>
              </div>
              <div class="flex min-w-0 flex-col">
                <span class="truncate font-display font-semibold">{{ row.original.name }}</span>
                <span class="label-caps text-muted">{{ row.original.collection?.name ?? '—' }}</span>
              </div>
            </div>
          </template>
          <template #rarity-cell="{ row }">
            <RarityBadge :rarity="row.original.rarity" />
          </template>
          <template #status-cell="{ row }">
            <StatusBadge :status="row.original.status" />
          </template>
          <template #stock-cell="{ row }">
            <span class="font-display font-bold tabular-nums">{{ row.original.stock }}</span>
          </template>
          <template #soldQuantity-cell="{ row }">
            <span class="font-display font-bold tabular-nums">{{ row.original.soldQuantity }}</span>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton
                v-if="isRemoteImage(mainImageOf(row.original))"
                icon="i-lucide-download"
                variant="ghost"
                color="neutral"
                :aria-label="`Guardar foto de ${row.original.name} en local`"
                title="Guardar foto en local"
                :loading="localizingId === mainImageOf(row.original)?.id"
                @click="localizeImage(mainImageOf(row.original), row.original)"
              />
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
          <UButton
            v-if="editing && isRemoteImage(mainImageOf(editing))"
            class="mt-2"
            icon="i-lucide-download"
            variant="outline"
            color="neutral"
            size="xs"
            label="Guardar foto en local"
            :loading="localizingId === mainImageOf(editing)?.id"
            @click="localizeImage(mainImageOf(editing), editing)"
          />
        </UFormField>
        <UFormField label="Estado">
          <USelect v-model="form.status" :items="['AVAILABLE', 'DRAFT', 'SOLD_OUT', 'ARCHIVED']" />
        </UFormField>
        <UFormField label="Rareza">
          <USelect v-model="form.rarity" :items="['COMMON', 'RARE', 'EPIC', 'LEGENDARY']" />
        </UFormField>
        <USeparator label="Ficha técnica (opcional)" />
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Escala / Altura">
            <UInput v-model="form.spec.scale" placeholder="Ej.: 18 cm" />
          </UFormField>
          <UFormField label="Material / Acabado">
            <UInput v-model="form.spec.material" placeholder="Ej.: Vinilo mate" />
          </UFormField>
          <UFormField label="Iluminación">
            <UInput v-model="form.spec.lighting" placeholder="Ej.: LED electroluminiscente" />
          </UFormField>
          <UFormField label="Base / Soporte">
            <UInput v-model="form.spec.base" placeholder="Ej.: Base acrílica" />
          </UFormField>
        </div>
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
