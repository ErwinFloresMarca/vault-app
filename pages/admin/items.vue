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
  price?: string | number | null
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
  { accessorKey: 'price', header: 'Precio', id: 'price' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'stock', header: 'Stock' },
  { accessorKey: 'soldQuantity', header: 'Vendidos' },
  { id: 'actions', header: ' ' },
]

const itemStatusOptions = [
  { label: 'Disponible (en stock)', value: 'AVAILABLE' },
  { label: 'A pedido (se crea al confirmar el pago)', value: 'ON_DEMAND' },
  { label: 'Agotado', value: 'SOLD_OUT' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Archivado', value: 'ARCHIVED' },
]

const rarityFormOptions = [
  { label: 'Común', value: 'COMMON' },
  { label: 'Rara', value: 'RARE' },
  { label: 'Épica', value: 'EPIC' },
  { label: 'Legendaria', value: 'LEGENDARY' },
]

const toast = useToast()
const localizingId = ref<string | null>(null)
const localizingAllId = ref<string | null>(null)

const { data: collectionsData } = await useFetch<{ success: boolean; data: CollectionOption[] }>('/api/admin/collections')
const collections = computed<CollectionOption[]>(() => collectionsData.value?.data ?? [])

const route = useRoute()
const router = useRouter()
const pageSize = 20

const initialStatus = typeof route.query.status === 'string' && ['DRAFT', 'AVAILABLE', 'ON_DEMAND', 'SOLD_OUT', 'ARCHIVED'].includes(route.query.status)
  ? route.query.status
  : 'all'
const initialRarity = typeof route.query.rarity === 'string' && ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'].includes(route.query.rarity)
  ? route.query.rarity
  : 'all'
const initialPage = Number(route.query.page)

const page = ref(Number.isFinite(initialPage) && initialPage > 0 ? Math.floor(initialPage) : 1)
const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const q = ref(searchInput.value.trim())
const selectedCollectionId = ref(typeof route.query.collectionId === 'string' ? route.query.collectionId : 'all')
const statusFilter = ref(initialStatus)
const rarityFilter = ref(initialRarity)

const statusOptions = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Disponible', value: 'AVAILABLE' },
  { label: 'A pedido', value: 'ON_DEMAND' },
  { label: 'Agotado', value: 'SOLD_OUT' },
  { label: 'Archivado', value: 'ARCHIVED' },
]
const rarityOptions = [
  { label: 'Todas las rarezas', value: 'all' },
  { label: 'Común', value: 'COMMON' },
  { label: 'Rara', value: 'RARE' },
  { label: 'Épica', value: 'EPIC' },
  { label: 'Legendaria', value: 'LEGENDARY' },
]
const collectionOptions = computed(() => [
  { label: 'Todas las colecciones', value: 'all' },
  ...collections.value.map((collection) => ({ label: collection.name, value: collection.id })),
])

const query = computed<Record<string, string>>(() => {
  const params: Record<string, string> = { page: String(page.value), pageSize: String(pageSize) }
  if (q.value) params.q = q.value
  if (selectedCollectionId.value !== 'all') params.collectionId = selectedCollectionId.value
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  if (rarityFilter.value !== 'all') params.rarity = rarityFilter.value
  return params
})

const { data, pending, error, refresh } = await useFetch<{
  success: boolean
  data: ItemRow[]
  total: number
  page: number
  pageSize: number
}>('/api/admin/items', { query })

const rows = computed<ItemRow[]>(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const rangeStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * pageSize + 1)
const rangeEnd = computed(() => Math.min(page.value * pageSize, total.value))
const hasFilters = computed(() =>
  !!q.value
  || selectedCollectionId.value !== 'all'
  || statusFilter.value !== 'all'
  || rarityFilter.value !== 'all',
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { q.value = value.trim() }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

watch([q, selectedCollectionId, statusFilter, rarityFilter], () => {
  page.value = 1
  syncQuery()
})
watch(page, syncQuery)
watch(total, (value) => {
  const maxPage = Math.max(1, Math.ceil(value / pageSize))
  if (page.value > maxPage) page.value = maxPage
}, { immediate: true })

function syncQuery() {
  const next: Record<string, string> = {}
  if (q.value) next.q = q.value
  if (selectedCollectionId.value !== 'all') next.collectionId = selectedCollectionId.value
  if (statusFilter.value !== 'all') next.status = statusFilter.value
  if (rarityFilter.value !== 'all') next.rarity = rarityFilter.value
  if (page.value > 1) next.page = String(page.value)
  router.replace({ query: next })
}

function clearFilters() {
  searchInput.value = ''
  q.value = ''
  selectedCollectionId.value = 'all'
  statusFilter.value = 'all'
  rarityFilter.value = 'all'
  page.value = 1
}

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
  price: '' as string,
  priceUndefined: false,
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

function remoteFilesOf(row: ItemRow | null) {
  return row?.files?.filter((item) => isRemoteImage(item.file)) ?? []
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

async function localizeAllImages(row: ItemRow | null) {
  if (!row || remoteFilesOf(row).length === 0) return

  localizingAllId.value = row.id
  try {
    const response = await $fetch<{
      success: boolean
      data: {
        localized: number
        skipped: number
        failed: number
        files: Array<{ id: string; url?: string; ok: boolean; error?: string }>
      }
    }>(`/api/admin/items/${row.id}/localize-images`, { method: 'POST' })

    for (const result of response.data.files) {
      if (!result.url) continue
      const target = row.files?.find((item) => item.file.id === result.id)
      if (target) target.file.url = result.url
      const editingTarget = editing.value?.files?.find((item) => item.file.id === result.id)
      if (editingTarget) editingTarget.file.url = result.url
    }

    const { localized, failed, skipped } = response.data
    toast.add({
      title: localized > 0
        ? `${localized} ${localized === 1 ? 'foto guardada' : 'fotos guardadas'} en local`
        : 'No había fotos remotas',
      description: failed > 0
        ? `${failed} ${failed === 1 ? 'imagen no se pudo guardar' : 'imágenes no se pudieron guardar'}`
        : skipped > 0
          ? `${skipped} ${skipped === 1 ? 'ya estaba en local' : 'ya estaban en local'}`
          : 'Todas las imágenes están en el servidor.',
      icon: failed > 0 ? 'i-lucide-circle-alert' : 'i-lucide-check-check',
      color: failed > 0 ? 'warning' : 'success',
    })
    await refresh()
  } catch (e) {
    const message = (e as { data?: { statusMessage?: string } })?.data?.statusMessage
      ?? 'No se pudieron guardar las fotos en local'
    toast.add({
      title: 'Error al guardar las fotos',
      description: message,
      icon: 'i-lucide-circle-alert',
      color: 'error',
    })
  } finally {
    localizingAllId.value = null
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
  form.price = ''
  form.priceUndefined = false
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
  form.price = row.price != null ? String(Number(row.price)) : ''
  form.priceUndefined = row.price == null
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
  if (!form.collectionId) {
    formError.value = 'Selecciona una colección'
    return
  }
  if (!form.priceUndefined && String(form.price).trim() === '') {
    formError.value = 'Pon un precio o marca «Precio indefinido»'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      // Solo se tocan las fotos si cambió la principal; así no se pierde la
      // galería (antes se reemplazaban todas por la principal al guardar).
      const originalMainId = mainImageOf(editing.value)?.id ?? null
      let fileIds: string[] | undefined
      if (form.fileId && form.fileId !== originalMainId) {
        const others = (editing.value.files ?? [])
          .map((f) => f.file.id)
          .filter((fid) => fid !== form.fileId && fid !== originalMainId)
        fileIds = [form.fileId, ...others]
      }
      const payload = {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        rarity: form.rarity,
        price: form.priceUndefined || form.price === '' ? null : form.price,
        fileIds,
        spec: form.spec,
        collectionId: form.collectionId,
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
          price: form.priceUndefined || form.price === '' ? null : form.price,
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
    <template #header>
      <UDashboardNavbar title="Items">
        <template #right>
          <UButton icon="i-lucide-plus" label="Nuevo item" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="min-w-0 space-y-4">
        <div class="rounded-2xl border border-default bg-muted p-4">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <UFormField label="Buscar" class="lg:col-span-4">
              <UInput v-model="searchInput" icon="i-lucide-search" placeholder="Nombre o slug..." />
            </UFormField>
            <UFormField label="Colección" class="lg:col-span-3">
              <USelect v-model="selectedCollectionId" :items="collectionOptions" />
            </UFormField>
            <UFormField label="Estado" class="lg:col-span-2">
              <USelect v-model="statusFilter" :items="statusOptions" />
            </UFormField>
            <UFormField label="Rareza" class="lg:col-span-3">
              <USelect v-model="rarityFilter" :items="rarityOptions" />
            </UFormField>
          </div>
        </div>

        <UAlert v-if="error" color="error" title="No se pudieron cargar los items" />
        <div v-else-if="pending && !data" class="flex justify-center py-16">
          <USkeleton class="h-64 w-full rounded-lg" />
        </div>
        <UPageCard v-else class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <h2 class="font-display font-bold">Items</h2>
                <UBadge color="neutral" variant="subtle">{{ total }} {{ total === 1 ? 'item' : 'items' }}</UBadge>
                <UIcon v-if="pending" name="i-lucide-loader-circle" class="size-4 animate-spin text-muted" />
              </div>
              <div class="flex items-center gap-3">
                <span v-if="total > 0" class="text-sm text-muted">Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ total }}</span>
                <UButton v-if="hasFilters" icon="i-lucide-x" variant="ghost" color="neutral" size="sm" label="Limpiar filtros" @click="clearFilters" />
              </div>
            </div>
          </template>
          <div class="min-w-0 overflow-x-auto">
            <UTable
              :data="rows"
              :columns="columns"
              :empty="'Sin items para los filtros'"
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
          <template #price-cell="{ row }">
            <span v-if="row.original.price != null" class="font-display font-semibold tabular-nums">Bs {{ Number(row.original.price).toFixed(2) }}</span>
            <span v-else class="text-xs text-muted">Indefinido</span>
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
              <UButton
                v-if="remoteFilesOf(row.original).length > 1"
                icon="i-lucide-images"
                variant="ghost"
                color="neutral"
                :aria-label="`Guardar todas las fotos de ${row.original.name} en local`"
                title="Guardar todas las fotos en local"
                :loading="localizingAllId === row.original.id"
                @click="localizeAllImages(row.original)"
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
          </div>
          <div v-if="total > pageSize" class="mt-4 flex justify-end">
            <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" show-edges :sibling-count="1" />
          </div>
        </UPageCard>
      </div>

      <UModal v-model:open="modalOpen" :title="editing ? 'Editar item' : 'Nuevo item'">
      <template #body>
      <UForm :state="form" class="space-y-4" @submit="save">
        <UFormField label="Nombre">
          <UInput v-model="form.name" />
        </UFormField>
        <UFormField label="Colección" :help="editing ? 'Cámbiala para mover el item a otra colección.' : undefined">
          <USelect v-model="form.collectionId" :items="collections.map(c => ({ label: c.name, value: c.id }))" />
        </UFormField>
        <UFormField label="Descripción (Markdown)">
          <UTextarea v-model="form.description" :rows="4" placeholder="Descripción con formato Markdown..." />
        </UFormField>
        <UFormField label="Imagen principal">
          <ImageField v-model="form.fileId" :preview-url="editing ? mainImageOf(editing)?.url : null" />
          <div v-if="editing && remoteFilesOf(editing).length" class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-if="isRemoteImage(mainImageOf(editing))"
              icon="i-lucide-download"
              variant="outline"
              color="neutral"
              size="xs"
              label="Guardar foto en local"
              :loading="localizingId === mainImageOf(editing)?.id"
              @click="localizeImage(mainImageOf(editing), editing)"
            />
            <UButton
              v-if="remoteFilesOf(editing).length > 1"
              icon="i-lucide-images"
              variant="outline"
              color="neutral"
              size="xs"
              label="Guardar todas las fotos en local"
              :loading="localizingAllId === editing?.id"
              @click="localizeAllImages(editing)"
            />
          </div>
        </UFormField>
        <UFormField label="Estado">
          <USelect v-model="form.status" :items="itemStatusOptions" />
        </UFormField>
        <UFormField label="Rareza">
          <USelect v-model="form.rarity" :items="rarityFormOptions" />
        </UFormField>
        <UFormField
          label="Precio de venta (Bs)"
          help="Con precio indefinido no se vende por el carrito: el catálogo no muestra precio y la ficha dice «Indefinido»."
        >
          <div class="flex flex-col gap-2">
            <UInput v-model="form.price" type="number" min="0" step="0.5" placeholder="Ej.: 45" :disabled="form.priceUndefined" />
            <UCheckbox v-model="form.priceUndefined" label="Precio indefinido" />
          </div>
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
    </template>
  </UDashboardPanel>
</template>
