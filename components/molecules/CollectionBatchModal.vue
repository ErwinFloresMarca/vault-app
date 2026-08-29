<template>
  <UModal :open="open" :title="`Inventario · ${collection?.name ?? ''}`" description="Registra un movimiento por grupo afectando a uno o más items de la colección." @update:open="(v) => !v && emit('update:open', false)">
    <template #body>
      <div v-if="collection" class="space-y-4">
        <UTabs :items="tabs" v-model="tab">
          <template #movimiento>
            <div class="space-y-4 pt-4">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Tipo">
                  <USelect v-model="form.type" :items="movementTypes" value-key="value" />
                </UFormField>
                <UFormField label="Motivo (opcional)">
                  <UInput v-model="form.reason" placeholder="Ej.: imprimir tanda, reposición..." />
                </UFormField>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between">
                  <p class="text-sm font-medium">Items a afectar</p>
                  <button type="button" class="text-xs text-primary hover:underline" @click="toggleAll">{{ allSelected ? 'Deseleccionar todos' : 'Seleccionar todos' }}</button>
                </div>
                <div v-if="itemsPending" class="space-y-2">
                  <USkeleton v-for="i in 3" :key="i" class="h-12 w-full rounded-md" />
                </div>
                <div v-else-if="items.length" class="max-h-64 space-y-2 overflow-y-auto rounded-md border border-(--ui-border) p-2 pr-1">
                  <div
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition"
                    :class="isSelected(item.id) ? 'bg-(--ui-primary)/5' : ''"
                  >
                    <UCheckbox
                      :model-value="isSelected(item.id)"
                      :label="item.name"
                      :description="`Stock: ${item.stock}`"
                      @update:model-value="(v) => setSelected(item.id, !!v)"
                    />
                    <UInput
                      :model-value="qtyOf(item.id)"
                      type="number"
                      min="0"
                      class="w-24 shrink-0"
                      :disabled="!isSelected(item.id)"
                      placeholder="Cant."
                      @update:model-value="(v) => setQty(item.id, v)"
                    />
                  </div>
                </div>
                <UEmpty v-else title="Sin items" description="Esta colección no tiene items para inventariar." />
              </div>

              <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>

              <UButton block :loading="saving" :disabled="!selectedCount" @click="submit">
                {{ selectedCount ? `Registrar ${selectedCount} movimiento${selectedCount > 1 ? 's' : ''}` : 'Selecciona items con cantidad' }}
              </UButton>
            </div>
          </template>

          <template #historial>
            <div class="space-y-3 pt-4">
              <div v-if="batchesPending" class="flex justify-center py-8">
                <USkeleton class="h-32 w-full rounded-md" />
              </div>
              <div v-else-if="batches.length" class="max-h-96 space-y-2 overflow-y-auto pr-1">
                <div
                  v-for="batch in batches"
                  :key="batch.id"
                  class="rounded-md border border-(--ui-border) p-3"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span :class="typeBadge(batch.type).class">{{ typeBadge(batch.type).label }}</span>
                      <span v-if="batch.reason" class="text-sm text-muted">{{ batch.reason }}</span>
                    </div>
                    <span class="text-xs text-muted">{{ formatDate(batch.createdAt) }}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="m in batch.movements"
                      :key="m.id"
                      class="rounded bg-elevated px-2 py-0.5 text-xs"
                    >{{ m.item.name }} · {{ m.quantity }}</span>
                  </div>
                </div>
              </div>
              <UEmpty v-else title="Sin movimientos por grupo" description="Aún no hay batches registrados para esta colección." />
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  collection: { id: string; name: string } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  changed: []
}>()

interface ItemOption {
  id: string
  name: string
  stock: number
  soldQuantity: number
}

interface BatchMovement {
  id: string
  quantity: number
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'
  item: { id: string; name: string }
}

interface Batch {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'
  reason: string | null
  createdAt: string
  collection: { id: string; name: string } | null
  movements: BatchMovement[]
}

const tabs = [
  { label: 'Registrar movimiento', value: 'movimiento', slot: 'movimiento' },
  { label: 'Historial de grupos', value: 'historial', slot: 'historial' },
]
const tab = ref<string>('movimiento')

const movementTypes = [
  { label: 'Entrada (IN)', value: 'IN' },
  { label: 'Salida (OUT)', value: 'OUT' },
  { label: 'Ajuste (ADJUSTMENT)', value: 'ADJUSTMENT' },
  { label: 'Venta (SALE)', value: 'SALE' },
]

const form = reactive({ type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE', reason: '' })
const formError = ref('')
const saving = ref(false)
const selected = reactive<Record<string, boolean>>({})
const quantities = reactive<Record<string, number>>({})

const { collection } = toRefs(props)

const { data: itemsData, pending: itemsPending, refresh: refreshItems } = useFetch<{ success: boolean; data: ItemOption[] }>(
  () => (collection.value?.id ? `/api/admin/items?collectionId=${collection.value.id}&pageSize=200` : ''),
  { immediate: false, watch: false },
)
const items = computed<ItemOption[]>(() => itemsData.value?.data ?? [])

const { data: batchesData, pending: batchesPending, refresh: refreshBatches } = useFetch<{ success: boolean; data: Batch[] }>(
  () => (collection.value?.id ? `/api/admin/inventory/batch?collectionId=${collection.value.id}&pageSize=50` : ''),
  { immediate: false, watch: false },
)
const batches = computed<Batch[]>(() => batchesData.value?.data ?? [])

watch(collection, async (col) => {
  resetState()
  if (col) {
    await Promise.all([refreshItems(), refreshBatches()])
  }
}, { immediate: true })

watch(items, (list) => {
  list.forEach((i) => { if (selected[i.id] === undefined) selected[i.id] = true })
}, { deep: true })

function resetState() {
  Object.keys(selected).forEach((k) => delete selected[k])
  Object.keys(quantities).forEach((k) => delete quantities[k])
  form.type = 'IN'
  form.reason = ''
  formError.value = ''
  tab.value = 'movimiento'
}

function isSelected(id: string) {
  return !!selected[id]
}
function setSelected(id: string, value: boolean) {
  selected[id] = value
}
const allSelected = computed(() => items.value.length > 0 && items.value.every((i) => selected[i.id]))
function toggleAll() {
  const newVal = !allSelected.value
  items.value.forEach((i) => { selected[i.id] = newVal })
}

function qtyOf(id: string) {
  return quantities[id] ?? 0
}
function setQty(id: string, value: unknown) {
  let n = Number(value)
  if (!Number.isFinite(n)) n = 0
  quantities[id] = n
}

const selectedCount = computed(() => items.value.filter((i) => selected[i.id] && (quantities[i.id] ?? 0) > 0).length)

async function submit() {
  if (!props.collection) return
  const lines = items.value
    .filter((i) => selected[i.id] && (quantities[i.id] ?? 0) > 0)
    .map((i) => ({ itemId: i.id, quantity: quantities[i.id] }))
  if (!lines.length) {
    formError.value = 'Marca al menos un item e indica su cantidad'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    await $fetch('/api/admin/inventory/batch', {
      method: 'POST',
      body: {
        type: form.type,
        collectionId: props.collection.id,
        reason: form.reason || undefined,
        lines,
      },
    })
    Object.keys(quantities).forEach((k) => delete quantities[k])
    await refreshBatches()
    await refreshItems()
    emit('changed')
  } catch (e: any) {
    formError.value = e?.data?.statusMessage ?? 'Error al registrar el movimiento'
  } finally {
    saving.value = false
  }
}

function typeBadge(type: Batch['type']) {
  switch (type) {
    case 'IN': return { label: 'IN', class: 'rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400' }
    case 'OUT': return { label: 'OUT', class: 'rounded bg-orange-500/15 px-1.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400' }
    case 'SALE': return { label: 'VENTA', class: 'rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400' }
    case 'ADJUSTMENT': return { label: 'AJUSTE', class: 'rounded bg-neutral-500/15 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400' }
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es')
}
</script>
