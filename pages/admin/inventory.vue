<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Inventario — Volt Vault Admin' })

definePageMeta({ layout: 'admin' })

interface ItemOption {
  id: string
  name: string
  stock: number
  soldQuantity: number
  collection?: { name: string }
}

interface Movement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'
  quantity: number
  reason: string | null
  createdAt: string
}

const { data: itemsData, refresh: refreshItems } = await useFetch<{ success: boolean; data: ItemOption[] }>('/api/admin/items')
const items = computed<ItemOption[]>(() => itemsData.value?.data ?? [])

const selectedId = ref('')
watch(items, (val) => {
  if (!selectedId.value && val.length) {
    selectedId.value = val[0].id
  }
}, { immediate: true })
const selected = computed<ItemOption | null>(() => items.value.find((i) => i.id === selectedId.value) ?? null)

watch(selectedId, () => {
  if (selectedId.value) {
    formError.value = ''
    refreshMovements().catch(() => {})
  }
})

const movementTypes = [
  { label: 'Entrada (IN)', value: 'IN' },
  { label: 'Salida (OUT)', value: 'OUT' },
  { label: 'Ajuste (ADJUSTMENT)', value: 'ADJUSTMENT' },
  { label: 'Venta (SALE)', value: 'SALE' },
]

const form = reactive({ type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE', quantity: 1, reason: '' })
const formError = ref('')
const saving = ref(false)

const { data: movementsData, pending: movementsPending, refresh: refreshMovements, error: movementsError } = useFetch<{ success: boolean; data: Movement[]; total: number }>(
  () => (selectedId.value ? `/api/admin/inventory?itemId=${selectedId.value}&pageSize=100` : ''),
  { watch: false },
)
const movements = computed<Movement[]>(() => movementsData.value?.data ?? [])
const movementsErrorText = computed(() => movementsError.value ? 'No se pudieron cargar los movimientos.' : '')

const columns: TableColumn<Movement>[] = [
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'quantity', header: 'Cantidad' },
  { accessorKey: 'reason', header: 'Motivo' },
  { accessorKey: 'createdAt', header: 'Fecha' },
]

async function submitMovement() {
  const qty = Number(form.quantity)
  if (!selected.value) {
    formError.value = 'Selecciona un item'
    return
  }
  if (!Number.isInteger(qty)) {
    formError.value = 'Cantidad inválida'
    return
  }
  if (form.type !== 'ADJUSTMENT' && qty <= 0) {
    formError.value = 'La cantidad debe ser mayor a 0'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await $fetch('/api/admin/inventory', {
      method: 'POST',
      body: { itemId: selected.value.id, type: form.type, quantity: qty, reason: form.reason || undefined },
    })
    form.quantity = 1
    form.reason = ''
    await refreshMovements()
    await refreshItems()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage ?? 'Error al registrar el movimiento'
  } finally {
    saving.value = false
  }
}

function typeBadge(type: Movement['type']) {
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
  return new Date(iso).toLocaleString('es')
}
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Inventario" />
    <UContainer class="p-6">
      <UAlert v-if="!items.length" color="neutral" title="No hay items registrados" description="Crea items desde la sección Items para gestionar su inventario." />

      <template v-else>
        <UFormField label="Item">
          <USelect
            v-model="selectedId"
            :items="items.map(i => ({ label: `${i.name}${i.collection ? ` · ${i.collection.name}` : ''}`, value: i.id }))"
            size="lg"
          />
        </UFormField>

        <UAlert v-if="movementsErrorText" color="error" :title="movementsErrorText" />

        <div v-if="selected" class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <UPageCard class="flex flex-col items-center justify-center gap-1 p-4">
                <p class="text-sm text-muted">Stock actual</p>
                <p class="text-3xl font-bold">{{ selected.stock }}</p>
              </UPageCard>
              <UPageCard class="flex flex-col items-center justify-center gap-1 p-4">
                <p class="text-sm text-muted">Vendidos</p>
                <p class="text-3xl font-bold">{{ selected.soldQuantity }}</p>
              </UPageCard>
            </div>

            <UPageCard>
              <template #header>
                <h3 class="font-semibold">Registrar movimiento</h3>
              </template>
              <UForm :state="form" class="space-y-4" @submit="submitMovement">
                <UFormField label="Tipo">
                  <USelect v-model="form.type" :items="movementTypes" value-key="value" />
                </UFormField>
                <UFormField label="Cantidad">
                  <UInput v-model.number="form.quantity" type="number" :min="form.type === 'ADJUSTMENT' ? 0 : 1" />
                </UFormField>
                <UFormField label="Motivo (opcional)">
                  <UInput v-model="form.reason" placeholder="Ej.: reposición, devolución, venta..." />
                </UFormField>
                <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>
                <UButton type="submit" block :loading="saving">Registrar</UButton>
              </UForm>
            </UPageCard>
          </div>

          <UPageCard>
            <template #header>
              <h3 class="font-semibold">Historial de movimientos</h3>
            </template>
            <div v-if="movementsPending" class="flex justify-center py-10">
              <USkeleton class="h-40 w-full" />
            </div>
            <UTable v-else :data="movements" :columns="columns" :empty="'Sin movimientos registrados'">
              <template #type-cell="{ row }">
                <UBadge :label="typeBadge(row.original.type).label" :color="row.original.type === 'IN' ? 'success' : (row.original.type === 'OUT' ? 'warning' : (row.original.type === 'SALE' ? 'primary' : 'neutral'))" />
              </template>
              <template #reason-cell="{ row }">
                <span class="text-sm">{{ row.original.reason ?? '—' }}</span>
              </template>
              <template #createdAt-cell="{ row }">
                <span class="text-sm text-muted">{{ formatDate(row.original.createdAt) }}</span>
              </template>
            </UTable>
          </UPageCard>
        </div>
      </template>
    </UContainer>
  </UDashboardPanel>
</template>
