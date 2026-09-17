<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Inventario — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface ItemRow {
  id: string
  name: string
  stock: number
  soldQuantity: number
  collectionId?: string
  collection?: { id: string; name: string } | null
}

interface CollectionOption {
  id: string
  name: string
}

interface BatchLine {
  item: ItemRow
  quantity: number
}

interface BatchListEntry {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'
  reason: string | null
  createdAt: string
  collectionId: string | null
  collection: { id: string; name: string } | null
  registeredByName?: string | null
  customerName?: string | null
  movements: { id: string; item: { id: string; name: string }; quantity: number }[]
}

const { data: itemsData, refresh: refreshItems } = await useFetch<{ success: boolean; data: ItemRow[] }>('/api/admin/items')
const items = computed<ItemRow[]>(() => itemsData.value?.data ?? [])

const { data: collectionsData } = await useFetch<{ success: boolean; data: CollectionOption[] }>('/api/admin/collections')
const collections = computed<CollectionOption[]>(() => collectionsData.value?.data ?? [])

// Filtros: colección + búsqueda por nombre
const selectedCollectionId = ref('all')
const search = ref('')

const filteredItems = computed<ItemRow[]>(() => {
  let list = items.value
  if (selectedCollectionId.value !== 'all') {
    list = list.filter((i) => i.collectionId === selectedCollectionId.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((i) => i.name.toLowerCase().includes(q))
  }
  return list
})

const itemsPage = ref(1)
const itemsPageSize = 8
const paginatedItems = computed<ItemRow[]>(() => {
  const from = (itemsPage.value - 1) * itemsPageSize
  return filteredItems.value.slice(from, from + itemsPageSize)
})
watch([selectedCollectionId, search], () => { itemsPage.value = 1 })

const itemColumns: TableColumn<ItemRow>[] = [
  { accessorKey: 'name', header: 'Item' },
  { accessorKey: 'collection.name', header: 'Colección', id: 'collection' },
  { accessorKey: 'stock', header: 'Stock' },
  { id: 'actions', header: '' },
]

// Modal de inventario individual
const inventoryItem = ref<ItemRow | null>(null)
const inventoryOpen = ref(false)
function openInventory(item: ItemRow) {
  inventoryItem.value = item
  inventoryOpen.value = true
}

// Batch en curso
const batchLines = ref<BatchLine[]>([])
const batchForm = reactive({ type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE', reason: '', customerUserId: '', customerName: '', customerEmail: '' })
const batchError = ref('')
const savingBatch = ref(false)
const batchPendingQty = ref(1)

interface CustomerUser {
  id: string
  name: string | null
  email: string | null
}
const { data: usersData, pending: customersPending } = useFetch<{ success: boolean; data: CustomerUser[] }>('/api/admin/users?role=USER')
const users = computed<CustomerUser[]>(() => usersData.value?.data ?? [])
const batchRequiresCustomer = computed(() => batchForm.type === 'OUT' || batchForm.type === 'SALE')

// collectionId automático: 1 colección única → esa; 0 o >=2 → global (null)
const batchCollectionId = computed<string | null>(() => {
  const unique = new Set(batchLines.value.map((l) => l.item.collectionId).filter(Boolean))
  return unique.size === 1 ? [...unique][0] as string : null
})

function addToBatch(item: ItemRow) {
  const existing = batchLines.value.find((l) => l.item.id === item.id)
  if (existing) {
    existing.quantity += batchPendingQty.value
  } else {
    batchLines.value.push({ item, quantity: batchPendingQty.value })
  }
  batchPendingQty.value = 1
}
function setLineQty(line: BatchLine, value: unknown) {
  let n = Number(value)
  if (!Number.isFinite(n) || n < 0) n = 0
  line.quantity = n
}
function removeLine(idx: number) {
  batchLines.value.splice(idx, 1)
}

function buildBatchCustomer() {
  if (!batchRequiresCustomer.value) return undefined
  const userId = batchForm.customerUserId || undefined
  const selectedUser = userId ? users.value.find((u) => u.id === userId) : undefined
  const name = batchForm.customerName.trim() || selectedUser?.name || undefined
  const email = batchForm.customerEmail.trim() || selectedUser?.email || undefined
  return { userId, name, email }
}

async function submitBatch() {
  const lines = batchLines.value
    .map((l) => ({ itemId: l.item.id, quantity: l.quantity }))
    .filter((l) => Number.isInteger(l.quantity) && l.quantity > 0)
  if (!lines.length) {
    batchError.value = 'Agrega al menos un item con cantidad mayor a 0'
    return
  }
  savingBatch.value = true
  batchError.value = ''
  try {
    await $fetch('/api/admin/inventory/batch', {
      method: 'POST',
      body: {
        type: batchForm.type,
        collectionId: batchCollectionId.value ?? undefined,
        reason: batchForm.reason || undefined,
        lines,
        customer: buildBatchCustomer(),
      },
    })
    batchLines.value = []
    batchForm.reason = ''
    batchForm.customerUserId = ''
    batchForm.customerName = ''
    batchForm.customerEmail = ''
    await refreshBatches()
    await refreshItems()
  } catch (e) {
    batchError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Error al registrar el batch'
  } finally {
    savingBatch.value = false
  }
}

// Historial global de batches (server-side paginado)
const batchesPage = ref(1)
const pageSize = 10
const { data: batchesData, pending: batchesPending, refresh: refreshBatches } = await useFetch<{
  success: boolean; data: BatchListEntry[]; total: number; page: number; pageSize: number
}>(() => `/api/admin/inventory/batch?page=${batchesPage.value}&pageSize=${pageSize}`)
const batches = computed<BatchListEntry[]>(() => batchesData.value?.data ?? [])
const batchesTotal = computed(() => batchesData.value?.total ?? 0)

const batchColumns: TableColumn<BatchListEntry>[] = [
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'reason', header: 'Motivo' },
  { accessorKey: 'registeredByName', header: 'Registrado por' },
  { accessorKey: 'customerName', header: 'Cliente' },
  { accessorKey: 'collection.name', header: 'Colección', id: 'collection' },
  { accessorKey: 'createdAt', header: 'Fecha' },
]

const batchTypes = [
  { label: 'Entrada (IN)', value: 'IN' },
  { label: 'Salida (OUT)', value: 'OUT' },
  { label: 'Ajuste (ADJUSTMENT)', value: 'ADJUSTMENT' },
  { label: 'Venta (SALE)', value: 'SALE' },
]

function typeBadge(type: BatchListEntry['type']) {
  switch (type) {
    case 'IN':
      return { label: 'IN', class: 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400' }
    case 'OUT':
      return { label: 'OUT', class: 'rounded bg-orange-500/15 px-1.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400' }
    case 'SALE':
      return { label: 'VENTA', class: 'rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400' }
    case 'ADJUSTMENT':
      return { label: 'AJUSTE', class: 'rounded bg-neutral-500/15 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400' }
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es', { timeZone: 'UTC' })
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Inventario" />

    <UContainer class="p-6 space-y-6">
      <UAlert v-if="!items.length" color="neutral" title="No hay items registrados" description="Crea items desde la sección Items para gestionar su inventario." />

      <template v-else>
        <!-- Filtros -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UFormField label="Colección">
            <USelect v-model="selectedCollectionId" :items="[{ label: 'Todas las colecciones', value: 'all' }, ...collections.map(c => ({ label: c.name, value: c.id }))]" />
          </UFormField>
          <UFormField label="Buscar por nombre" class="md:col-span-2">
            <UInput v-model="search" placeholder="Buscar item..." icon="i-lucide-search" />
          </UFormField>
        </div>

        <!-- Lista de items -->
        <UPageCard>
          <template #header>
            <h3 class="font-semibold">Items</h3>
          </template>
          <div class="flex items-center justify-end gap-4 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted">Cant.</span>
              <UInput v-model.number="batchPendingQty" type="number" min="1" class="w-24" />
            </div>
            <span class="text-xs text-muted">Usa "Agregar a batch" para sumar items a un registro por grupo — agrega en lotes desde una o varias colecciones.</span>
          </div>
          <UTable :data="paginatedItems" :columns="itemColumns" :empty="'Sin items para los filtros'">
            <template #name-cell="{ row }">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ row.original.name }}</span>
              </div>
            </template>
            <template #collection-cell="{ row }">
              <span class="text-sm">{{ row.original.collection?.name ?? '—' }}</span>
            </template>
            <template #stock-cell="{ row }">
              <UBadge :label="String(row.original.stock)" :color="row.original.stock > 0 ? 'success' : 'error'" variant="subtle" />
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton icon="i-lucide-plus" label="Agregar a batch" size="sm" variant="solid" @click="addToBatch(row.original)" />
                <UButton icon="i-lucide-archive" size="sm" variant="ghost" color="neutral" :aria-label="`Inventario individual de ${row.original.name}`" @click="openInventory(row.original)" />
              </div>
            </template>
          </UTable>
          <div v-if="filteredItems.length > itemsPageSize" class="mt-4 flex justify-end">
            <UPagination v-model:page="itemsPage" :total="filteredItems.length" :items-per-page="itemsPageSize" />
          </div>
        </UPageCard>

        <!-- Batch en curso -->
        <UPageCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Nuevo registro por grupo (batch)</h3>
              <span v-if="batchLines.length" class="text-xs text-muted">
                Colección del lote: <strong>{{ batchCollectionId ? (collections.find(c => c.id === batchCollectionId)?.name ?? '—') : 'Global (varias colecciones)' }}</strong>
              </span>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <!-- Formulario -->
            <div class="lg:col-span-2 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Tipo">
                  <USelect v-model="batchForm.type" :items="batchTypes" value-key="value" />
                </UFormField>
                <UFormField label="Motivo (opcional)">
                  <UInput v-model="batchForm.reason" placeholder="Ej.: imprimir tanda, venta..." />
                </UFormField>
              </div>

              <template v-if="batchRequiresCustomer">
                <USeparator label="Persona a quien se vende/entrega" />
                <UFormField label="Cliente con cuenta (opcional)">
                  <USelect v-model="batchForm.customerUserId" clearable :items="users.map(u => ({ label: `${u.name}${u.email ? ` · ${u.email}` : ''}`, value: u.id }))" :disabled="customersPending" />
                </UFormField>
                <div class="grid grid-cols-2 gap-3">
                  <UFormField label="Nombre">
                    <UInput v-model="batchForm.customerName" placeholder="Nombre de la persona" />
                  </UFormField>
                  <UFormField label="Email (opcional)">
                    <UInput v-model="batchForm.customerEmail" placeholder="correo@ejemplo.com" type="email" />
                  </UFormField>
                </div>
              </template>

              <div v-if="batchError" class="text-sm text-(--ui-error)">{{ batchError }}</div>
              <div class="flex gap-2">
                <UButton block :loading="savingBatch" :disabled="!batchLines.length" @click="submitBatch">
                  Finalizar ({{ batchLines.length }} item{{ batchLines.length !== 1 ? 's' : '' }})
                </UButton>
                <UButton color="neutral" variant="outline" :disabled="!batchLines.length" @click="batchLines = []">
                  Cancelar
                </UButton>
              </div>
              <UAlert v-if="!batchLines.length" color="neutral" title="Sin items en el lote" description="Agrega items con el botón 'Agregar a batch' para registrar un grupo." />
            </div>

            <!-- Items añadidos -->
            <div class="lg:col-span-3">
              <div v-if="batchLines.length" class="max-h-80 space-y-2 overflow-y-auto pr-1">
                <div v-for="(line, idx) in batchLines" :key="line.item.id" class="flex items-center justify-between gap-3 rounded-md border border-(--ui-border) px-3 py-2">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ line.item.name }}</p>
                    <p class="text-xs text-muted">{{ line.item.collection?.name ?? 'Sin colección' }} · Stock: {{ line.item.stock }}</p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <UInput :model-value="line.quantity" type="number" min="1" class="w-24" @update:model-value="(v) => setLineQty(line, v)" />
                    <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" :aria-label="`Quitar ${line.item.name}`" @click="removeLine(idx)" />
                  </div>
                </div>
              </div>
              <UEmpty v-else title="Lote vacío" description="Los items añadidos aparecerán aquí con su cantidad editable." />
            </div>
          </div>
        </UPageCard>

        <!-- Historial global de batches -->
        <UPageCard>
          <template #header>
            <h3 class="font-semibold">Historial de registros (batches)</h3>
          </template>
          <div v-if="batchesPending" class="flex justify-center py-8">
            <USkeleton class="h-40 w-full" />
          </div>
          <template v-else>
            <UTable :data="batches" :columns="batchColumns" :empty="'Sin batches registrados'">
              <template #type-cell="{ row }">
                <span :class="typeBadge(row.original.type).class">{{ typeBadge(row.original.type).label }}</span>
              </template>
              <template #reason-cell="{ row }">
                <span class="text-sm">{{ row.original.reason ?? '—' }}</span>
              </template>
              <template #registeredByName-cell="{ row }">
                <span class="text-sm">{{ row.original.registeredByName ?? '—' }}</span>
              </template>
              <template #customerName-cell="{ row }">
                <span class="text-sm">{{ row.original.customerName ?? '—' }}</span>
              </template>
              <template #collection-cell="{ row }">
                <span class="text-sm">{{ row.original.collection?.name ?? 'Global' }}</span>
              </template>
              <template #createdAt-cell="{ row }">
                <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
              </template>
            </UTable>
            <div v-if="batchesTotal > pageSize" class="mt-4 flex justify-end">
              <UPagination v-model:page="batchesPage" :total="batchesTotal" :items-per-page="pageSize" />
            </div>
          </template>
        </UPageCard>
      </template>
    </UContainer>

    <InventoryModal
      :open="inventoryOpen"
      :item="inventoryItem"
      @update:open="inventoryOpen = $event"
      @changed="refreshItems"
    />
  </UDashboardPanel>
</template>
