<template>
  <UModal :open="open" title="Inventario" :description="item ? item.name : undefined" @update:open="(v) => emit('update:open', v)">
    <template #body>
      <div v-if="item" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <UPageCard class="flex flex-col items-center justify-center gap-1 p-3">
            <p class="text-sm text-muted">Stock actual</p>
            <p class="text-3xl font-bold">{{ item.stock }}</p>
          </UPageCard>
          <UPageCard class="flex flex-col items-center justify-center gap-1 p-3">
            <p class="text-sm text-muted">Vendidos</p>
            <p class="text-3xl font-bold">{{ item.soldQuantity }}</p>
          </UPageCard>
        </div>

        <USeparator label="Registrar movimiento" />

        <UForm :state="form" class="space-y-4" @submit="submitMovement">
          <UFormField label="Tipo">
            <USelect v-model="form.type" :items="movementTypes" value-key="value" />
          </UFormField>
          <UFormField label="Cantidad">
            <UInput v-model.number="form.quantity" type="number" :min="form.type === 'ADJUSTMENT' ? 0 : 1" />
          </UFormField>

          <template v-if="requiresCustomer">
            <USeparator label="Persona a quien se vende/entrega" />
            <UFormField label="Cliente con cuenta (opcional)">
              <USelect
                v-model="form.customerUserId"
                clearable
                :items="users.map(u => ({ label: `${u.name}${u.email ? ` · ${u.email}` : ''}`, value: u.id }))"
                :disabled="customersPending"
              />
            </UFormField>
            <UFormField label="Nombre">
              <UInput v-model="form.customerName" placeholder="Nombre de la persona" />
            </UFormField>
            <UFormField label="Email (opcional)">
              <UInput v-model="form.customerEmail" placeholder="correo@ejemplo.com" type="email" />
            </UFormField>
          </template>

          <UFormField label="Motivo (opcional)">
            <UInput v-model="form.reason" placeholder="Ej.: reposición, devolución, venta..." />
          </UFormField>
          <div v-if="formError" class="text-sm text-(--ui-error)">{{ formError }}</div>
          <UButton type="submit" block :loading="saving">Registrar</UButton>
        </UForm>

        <USeparator label="Historial de movimientos" />

        <div v-if="movements.length && !movementsPending" class="max-h-64 space-y-2 overflow-y-auto pr-1">
          <div
            v-for="m in movements"
            :key="m.id"
            class="flex items-center justify-between rounded-md border border-(--ui-border) px-3 py-2"
          >
            <div class="flex items-center gap-2 text-sm">
              <span :class="typeBadge(m.type).class">{{ typeBadge(m.type).label }}</span>
              <span class="font-medium">{{ m.quantity }}</span>
              <span v-if="m.reason" class="text-muted">· {{ m.reason }}</span>
              <span v-if="m.customerName" class="text-muted">→ {{ m.customerName }}</span>
            </div>
            <span class="text-xs text-muted">{{ formatDate(m.createdAt) }}</span>
          </div>
        </div>
        <div v-else-if="movementsPending" class="flex justify-center py-6">
          <USkeleton class="h-20 w-full" />
        </div>
        <UEmpty v-else title="Sin movimientos" description="Registra el primer movimiento de este item." />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  item: {
    id: string
    name: string
    stock?: number
    soldQuantity?: number
  } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  changed: []
}>()

interface Movement {
  id: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE'
  quantity: number
  reason: string | null
  customerName?: string | null
  createdAt: string
}

interface CustomerUser {
  id: string
  name: string | null
  email: string | null
}

const movementTypes = [
  { label: 'Entrada (IN)', value: 'IN' },
  { label: 'Salida (OUT)', value: 'OUT' },
  { label: 'Ajuste (ADJUSTMENT)', value: 'ADJUSTMENT' },
  { label: 'Venta (SALE)', value: 'SALE' },
]

const form = reactive({
  type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE',
  quantity: 1,
  reason: '',
  customerUserId: '',
  customerName: '',
  customerEmail: '',
})
const formError = ref('')
const saving = ref(false)
const movements = ref<Movement[]>([])
const movementsPending = ref(false)

const requiresCustomer = computed(() => form.type === 'OUT' || form.type === 'SALE')

const { data: usersData, pending: customersPending } = useFetch<{ success: boolean; data: CustomerUser[] }>('/api/admin/users?role=USER')
const users = computed<CustomerUser[]>(() => usersData.value?.data ?? [])

const { item } = toRefs(props)
const { data: movementsData, pending: movementsPendingRef, refresh: refreshMovements } = useFetch<{ success: boolean; data: Movement[] }>(
  () => `/api/admin/inventory?itemId=${item.value?.id ?? ''}&pageSize=100`,
  { immediate: false },
)
watch(movementsPendingRef, (v) => { movementsPending.value = v })
watch(movementsData, (v) => { movements.value = v?.data ?? [] }, { immediate: true })

watch(item, async (val) => {
  if (val) {
    movements.value = []
    form.type = 'IN'
    form.quantity = 1
    form.reason = ''
    form.customerUserId = undefined
    form.customerName = ''
    form.customerEmail = ''
    formError.value = ''
    await refreshMovements()
  }
}, { immediate: true })

async function submitMovement() {
  const qty = Number(form.quantity)
  if (!props.item || !Number.isInteger(qty)) {
    formError.value = 'Cantidad inválida'
    return
  }
  if (form.type !== 'ADJUSTMENT' && qty <= 0) {
    formError.value = 'La cantidad debe ser mayor a 0'
    return
  }

  let customer: { userId?: string; name?: string; email?: string } | undefined
  if (requiresCustomer.value) {
    const userId = form.customerUserId || undefined
    const selectedUser = userId ? users.value.find((u) => u.id === userId) : undefined
    const name = form.customerName.trim() || selectedUser?.name || undefined
    const email = form.customerEmail.trim() || selectedUser?.email || undefined
    customer = { userId, name, email }
  }

  saving.value = true
  formError.value = ''
  try {
    await $fetch('/api/admin/inventory', {
      method: 'POST',
      body: {
        itemId: props.item.id,
        type: form.type,
        quantity: qty,
        reason: form.reason || undefined,
        customer,
      },
    })
    form.quantity = 1
    form.reason = ''
    form.customerUserId = undefined
    form.customerName = ''
    form.customerEmail = ''
    await refreshMovements()
    emit('changed')
  } catch (e) {
    formError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Error al registrar el movimiento'
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
  return new Date(iso).toLocaleString('es', { timeZone: 'UTC' })
}
</script>
