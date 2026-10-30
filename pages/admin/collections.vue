<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CollectionStatus } from '~/types'

useSeoMeta({ title: 'Colecciones — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CollectionRow {
  id: string
  name: string
  slug: string
  description?: string | null
  status: CollectionStatus
  _count?: { items: number }
  files?: Array<{ file: { id: string; url: string } }>
}

const columns: TableColumn<CollectionRow>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: '_count.items', header: 'Items' },
  { id: 'actions', header: ' ' },
]

const route = useRoute()
const router = useRouter()
const pageSize = 20
const initialPage = Number(route.query.page)
const page = ref(Number.isFinite(initialPage) && initialPage > 0 ? Math.floor(initialPage) : 1)

const query = computed(() => ({ page: String(page.value), pageSize: String(pageSize) }))
const { data, pending, error, refresh } = await useFetch<{
  success: boolean
  data: CollectionRow[]
  total: number
  page: number
  pageSize: number
}>('/api/admin/collections', { query })
const rows = computed<CollectionRow[]>(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const rangeStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * pageSize + 1)
const rangeEnd = computed(() => Math.min(page.value * pageSize, total.value))

watch(page, () => {
  router.replace({ query: page.value > 1 ? { page: String(page.value) } : {} })
})
watch(total, (value) => {
  const maxPage = Math.max(1, Math.ceil(value / pageSize))
  if (page.value > maxPage) page.value = maxPage
}, { immediate: true })

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
  const wasEditing = !!editing.value
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
    if (!wasEditing) page.value = 1
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
    <template #header>
      <UDashboardNavbar title="Colecciones">
        <template #right>
          <UButton icon="i-lucide-plus" label="Nueva colección" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UAlert v-if="error" color="error" title="No se pudieron cargar las colecciones" />
      <div v-else-if="pending && !data" class="flex justify-center py-16">
        <USkeleton class="h-64 w-full rounded-2xl" />
      </div>
      <UPageCard v-else class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <h2 class="font-display font-bold">Colecciones</h2>
              <UBadge color="neutral" variant="subtle">{{ total }} {{ total === 1 ? 'colección' : 'colecciones' }}</UBadge>
              <UIcon v-if="pending" name="i-lucide-loader-circle" class="size-4 animate-spin text-muted" />
            </div>
            <span v-if="total > 0" class="text-sm text-muted">Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ total }}</span>
          </div>
        </template>
        <div class="min-w-0 overflow-x-auto">
          <UTable
            :data="rows"
            :columns="columns"
            :empty="'Sin colecciones'"
          >
          <template #name-cell="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-10 shrink-0 overflow-hidden rounded-xl border border-default bg-elevated">
                <AppImage
                  v-if="coverOf(row.original)?.url"
                  :src="coverOf(row.original)!.url"
                  :alt="row.original.name"
                  class="h-full w-full"
                  :width="80"
                  :height="80"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <UIcon name="i-lucide-image" class="size-4 text-muted" />
                </div>
              </div>
              <div class="flex flex-col">
                <span class="font-display font-semibold">{{ row.original.name }}</span>
                <span class="label-caps text-muted">{{ row.original.slug }}</span>
              </div>
            </div>
          </template>
          <template #status-cell="{ row }">
            <StatusBadge :status="row.original.status" />
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <UButton
                icon="i-lucide-list-filter"
                variant="ghost"
                color="neutral"
                :aria-label="`Ver items de ${row.original.name}`"
                title="Ver items de esta colección"
                :to="{ path: '/admin/items', query: { collectionId: row.original.id } }"
              />
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
        </div>
        <div v-if="total > pageSize" class="mt-4 flex justify-end">
          <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" show-edges :sibling-count="1" />
        </div>
      </UPageCard>

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
        <div v-if="formError" class="text-sm text-error">{{ formError }}</div>
        <UButton type="submit" block :loading="saving" :label="editing ? 'Guardar cambios' : 'Crear'" />
      </UForm>
      </template>
    </UModal>

    <CollectionBatchModal
      :open="batchOpen"
      :collection="batchCollection"
      @update:open="batchOpen = $event"
      @changed="refresh"
    />
    </template>
  </UDashboardPanel>
</template>
