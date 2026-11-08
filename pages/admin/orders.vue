<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OrderDto, OrderStatus } from '~/types'
import { formatBs } from '~/composables/useCart'
import { orderItemLabel } from '~/utils/orderItemLabel'

useSeoMeta({ title: 'Pedidos — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

const STATUS: Record<OrderStatus, { label: string; color: 'warning' | 'info' | 'primary' | 'secondary' | 'success' | 'neutral' | 'error' }> = {
  PENDING_PAYMENT: { label: 'Pedido realizado', color: 'warning' },
  PAID: { label: 'Pedido confirmado', color: 'info' },
  IN_PRODUCTION: { label: 'En impresión', color: 'secondary' },
  READY: { label: 'Listo', color: 'primary' },
  SHIPPED: { label: 'Enviado', color: 'info' },
  DELIVERED: { label: 'Entregado', color: 'success' },
  CANCELLED: { label: 'Cancelado', color: 'error' },
}
const statusItems = (Object.keys(STATUS) as OrderStatus[]).map((value) => ({ label: STATUS[value].label, value }))
const statusFilterItems = [{ label: 'Todos los estados', value: 'all' }, ...statusItems]

const columns: TableColumn<OrderDto>[] = [
  { accessorKey: 'number', header: 'Pedido' },
  { accessorKey: 'customerName', header: 'Cliente' },
  { id: 'products', header: 'Productos' },
  { accessorKey: 'status', header: 'Estado' },
  { accessorKey: 'total', header: 'Total' },
  { id: 'split', header: 'Utilidad / socio' },
  { id: 'actions', header: ' ' },
]

const route = useRoute()
const router = useRouter()
const pageSize = 20
const page = ref(Number(route.query.page) > 0 ? Math.floor(Number(route.query.page)) : 1)
const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : 'all')
const from = ref(typeof route.query.from === 'string' ? route.query.from : '')
const to = ref(typeof route.query.to === 'string' ? route.query.to : '')
const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
const qDebounced = ref(q.value)

let timer: ReturnType<typeof setTimeout> | undefined
watch(q, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => { qDebounced.value = v; page.value = 1 }, 300)
})
watch([statusFilter, from, to], () => { page.value = 1 })

const filters = computed(() => {
  const f: Record<string, string> = {}
  if (statusFilter.value !== 'all') f.status = statusFilter.value
  if (from.value) f.from = from.value
  if (to.value) f.to = to.value
  if (qDebounced.value.trim()) f.q = qDebounced.value.trim()
  return f
})
const query = computed(() => ({ ...filters.value, page: String(page.value), pageSize: String(pageSize) }))

watch(query, (val) => {
  router.replace({ query: { ...val, pageSize: undefined, page: val.page === '1' ? undefined : val.page } })
})

const { data, pending, error, refresh } = await useFetch<{
  success: boolean
  data: OrderDto[]
  total: number
  page: number
  pageSize: number
  summary: { orders: number; sales: number; printCost: number; netProfit: number; partnerShare: number }
}>('/api/admin/orders', { query })

const rows = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const summary = computed(() => data.value?.summary ?? { orders: 0, sales: 0, printCost: 0, netProfit: 0, partnerShare: 0 })
const hasFilters = computed(() => Object.keys(filters.value).length > 0)

function clearFilters() {
  statusFilter.value = 'all'
  from.value = ''
  to.value = ''
  q.value = ''
  qDebounced.value = ''
}

const exportUrl = computed(() => {
  const params = new URLSearchParams(filters.value).toString()
  return `/api/admin/orders/export${params ? `?${params}` : ''}`
})

const { data: meta } = await useFetch<{ success: boolean; data: { admins: { id: string; name: string; email: string }[] } }>('/api/admin/orders/meta')
const printerItems = computed(() => [
  { label: 'Sin asignar', value: 'none' },
  ...(meta.value?.data.admins ?? []).map((a) => ({ label: a.name, value: a.id })),
])

const internalNumber = (n: number) => `#${String(n).padStart(4, '0')}`
const dateFmt = (iso: string) => new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const waLink = (order: OrderDto) => {
  let digits = (order.customerPhone ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 8) digits = `591${digits}` // número boliviano sin código de país
  const text = `Hola ${order.customerName}, te escribimos de Volt 3D por tu pedido ${order.code}.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
const mailLink = (order: OrderDto) => `mailto:${order.customerEmail}?subject=${encodeURIComponent(`Tu pedido ${order.code} — Volt Vault`)}`

// ===== Detalle / edición =====
const open = ref(false)
const selected = ref<OrderDto | null>(null)
const saving = ref(false)
const saveError = ref('')
const edit = reactive({
  status: 'PENDING_PAYMENT' as OrderStatus,
  shippingCost: 0,
  printCost: 0,
  otherCosts: 0,
  printedByUserId: 'none',
  adminNotes: '',
})

function openOrder(order: OrderDto) {
  selected.value = order
  edit.status = order.status
  edit.shippingCost = order.shippingCost
  edit.printCost = order.printCost
  edit.otherCosts = order.otherCosts
  edit.printedByUserId = order.printedBy?.id ?? 'none'
  edit.adminNotes = order.adminNotes ?? ''
  saveError.value = ''
  open.value = true
  if (route.query.id !== order.id) router.replace({ query: { ...route.query, id: order.id } })
}

watch(open, (v) => {
  if (!v && route.query.id) {
    const { id: _id, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// Abrir directo desde el enlace del correo (?id=...)
onMounted(async () => {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  if (!id) return
  const found = rows.value.find((o) => o.id === id)
  if (found) return openOrder(found)
  try {
    const res = await $fetch<{ success: boolean; data: OrderDto }>(`/api/admin/orders/${id}`)
    openOrder(res.data)
  } catch {
    // pedido inexistente: se ignora
  }
})

const preview = computed(() => {
  const subtotal = selected.value?.subtotal ?? 0
  const net = Math.round((subtotal - Number(edit.printCost || 0) - Number(edit.otherCosts || 0)) * 100) / 100
  const share = Math.round((net / 2) * 100) / 100
  return { net, share, printerTotal: Math.round((Number(edit.printCost || 0) + share) * 100) / 100 }
})
const printerName = computed(() => printerItems.value.find((p) => p.value === edit.printedByUserId && p.value !== 'none')?.label ?? '')

const toast = useToast()
const resending = ref(false)
async function resendEmail() {
  if (!selected.value) return
  resending.value = true
  try {
    await $fetch(`/api/admin/orders/${selected.value.id}/resend`, { method: 'POST' })
    toast.add({ title: 'Correo reenviado', description: selected.value.customerEmail, icon: 'i-lucide-mail', color: 'success' })
  } catch (e) {
    toast.add({ title: 'No se pudo reenviar', description: (e as { data?: { statusMessage?: string } })?.data?.statusMessage, color: 'error' })
  } finally {
    resending.value = false
  }
}

function closeOrder() {
  open.value = false
}

async function save() {
  if (!selected.value) return
  saving.value = true
  saveError.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: OrderDto & { confirmationSent?: boolean } }>(`/api/admin/orders/${selected.value.id}`, {
      method: 'PUT',
      body: {
        status: edit.status,
        shippingCost: edit.shippingCost,
        printCost: edit.printCost,
        otherCosts: edit.otherCosts,
        printedByUserId: edit.printedByUserId === 'none' ? null : edit.printedByUserId,
        adminNotes: edit.adminNotes,
      },
    })
    const wasConfirmed = !!selected.value.confirmedAt
    selected.value = res.data
    if (!wasConfirmed && res.data.confirmedAt) {
      toast.add(res.data.confirmationSent
        ? { title: 'Pedido confirmado', description: `Se envió el correo de confirmación a ${res.data.customerEmail}.`, icon: 'i-lucide-mail-check', color: 'success' }
        : { title: 'Pedido confirmado, pero no se pudo enviar el correo', description: 'Revisa la configuración SMTP y usa «Reenviar correo».', icon: 'i-lucide-mail-x', color: 'warning' })
    } else {
      toast.add({ title: 'Cambios guardados', icon: 'i-lucide-check', color: 'success' })
    }
    await refresh()
    open.value = false
  } catch (e) {
    saveError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Pedidos">
        <template #right>
          <UButton :to="exportUrl" external download icon="i-lucide-file-spreadsheet" label="Exportar a Excel" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Resumen del filtro actual -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-xl border border-default bg-muted p-4">
          <p class="text-xs text-muted">Pedidos (sin cancelados)</p>
          <p class="mt-1 font-display text-2xl font-extrabold tabular-nums">{{ summary.orders }}</p>
        </div>
        <div class="rounded-xl border border-default bg-muted p-4">
          <p class="text-xs text-muted">Ventas (productos)</p>
          <p class="mt-1 font-display text-2xl font-extrabold tabular-nums">{{ formatBs(summary.sales) }}</p>
        </div>
        <div class="rounded-xl border border-default bg-muted p-4">
          <p class="text-xs text-muted">Utilidad neta</p>
          <p class="mt-1 font-display text-2xl font-extrabold tabular-nums">{{ formatBs(summary.netProfit) }}</p>
          <p class="text-xs text-muted">Costo de impresión: {{ formatBs(summary.printCost) }}</p>
        </div>
        <div class="rounded-xl border border-primary/40 bg-primary/10 p-4">
          <p class="text-xs text-muted">Para cada socio (50 %)</p>
          <p class="mt-1 font-display text-2xl font-extrabold tabular-nums text-primary">{{ formatBs(summary.partnerShare) }}</p>
          <p class="text-xs text-muted">+ costo de impresión a quien imprimió</p>
        </div>
      </div>

      <UAlert v-if="error" color="error" title="No se pudieron cargar los pedidos" />
      <UPageCard v-else class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
        <template #header>
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display font-bold">Pedidos</h2>
              <UBadge color="neutral" variant="subtle">{{ total }}</UBadge>
              <UIcon v-if="pending" name="i-lucide-loader-circle" class="size-4 animate-spin text-muted" />
            </div>
            <div class="flex flex-wrap items-end gap-2">
              <UInput v-model="q" icon="i-lucide-search" placeholder="Buscar código, cliente, correo o producto" class="w-full sm:w-72" />
              <USelect v-model="statusFilter" :items="statusFilterItems" class="w-48" />
              <UFormField label="Desde" :ui="{ label: 'text-xs' }">
                <UInput v-model="from" type="date" />
              </UFormField>
              <UFormField label="Hasta" :ui="{ label: 'text-xs' }">
                <UInput v-model="to" type="date" />
              </UFormField>
              <UButton v-if="hasFilters" color="neutral" variant="ghost" icon="i-lucide-x" label="Limpiar" @click="clearFilters" />
            </div>
          </div>
        </template>

        <div class="min-w-0 overflow-x-auto">
          <UTable :data="rows" :columns="columns" empty="Todavía no hay pedidos" class="min-w-[880px]" @select="(_e: Event, row: { original: OrderDto }) => openOrder(row.original)">
            <template #number-cell="{ row }">
              <div class="flex flex-col">
                <span class="font-mono text-sm font-bold">{{ row.original.code }}</span>
                <span class="text-xs text-muted">{{ internalNumber(row.original.number) }} · {{ dateFmt(row.original.createdAt) }}</span>
              </div>
            </template>
            <template #customerName-cell="{ row }">
              <div class="flex flex-col">
                <span class="font-semibold">{{ row.original.customerName }}</span>
                <span class="text-xs text-muted">{{ row.original.customerEmail }}</span>
                <span class="text-xs text-muted">{{ row.original.customerCity }}{{ row.original.customerPhone ? ` · ${row.original.customerPhone}` : '' }}</span>
              </div>
            </template>
            <template #products-cell="{ row }">
              <div class="flex max-w-72 flex-col">
                <span class="line-clamp-2 text-sm">{{ row.original.items.map((i) => `${i.quantity} × ${orderItemLabel(i)}`).join(', ') }}</span>
                <span class="text-xs text-muted">{{ row.original.deliveryMethod === 'SHIPPING' ? 'Envío departamental' : 'Entrega en la ciudad' }}</span>
              </div>
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="STATUS[row.original.status].color" variant="subtle">{{ STATUS[row.original.status].label }}</UBadge>
            </template>
            <template #total-cell="{ row }">
              <span class="font-display font-bold tabular-nums">{{ formatBs(row.original.total) }}</span>
            </template>
            <template #split-cell="{ row }">
              <div class="flex flex-col text-sm tabular-nums">
                <span>{{ formatBs(row.original.split.netProfit) }}</span>
                <span class="text-xs text-muted">{{ formatBs(row.original.split.partnerShare) }} c/u{{ row.original.printedBy ? ` · imprimió ${row.original.printedBy.name}` : '' }}</span>
              </div>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UButton :to="mailLink(row.original)" external icon="i-lucide-mail" color="neutral" variant="ghost" size="sm" aria-label="Correo" @click.stop />
                <UButton v-if="waLink(row.original)" :to="waLink(row.original)" target="_blank" icon="i-lucide-message-circle" color="neutral" variant="ghost" size="sm" aria-label="WhatsApp" @click.stop />
                <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" aria-label="Ver pedido" @click.stop="openOrder(row.original)" />
              </div>
            </template>
          </UTable>
        </div>

        <div v-if="total > pageSize" class="mt-4 flex justify-center">
          <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
        </div>
      </UPageCard>

      <!-- Detalle del pedido -->
      <USlideover v-model:open="open" :title="selected ? `Pedido ${selected.code}` : 'Pedido'" :description="selected ? `${internalNumber(selected.number)} · ${dateFmt(selected.createdAt)}` : ''" :ui="{ content: 'max-w-xl' }">
        <template #body>
          <div v-if="selected" class="flex flex-col gap-5">
            <section class="rounded-xl border border-default bg-muted p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-display font-bold">{{ selected.customerName }}</p>
                  <p class="truncate text-sm text-muted">{{ selected.customerEmail }}</p>
                  <p class="text-sm text-muted">{{ selected.customerCity }}{{ selected.customerPhone ? ` · ${selected.customerPhone}` : '' }}</p>
                </div>
                <div class="flex shrink-0 flex-col gap-1.5">
                  <UButton :to="mailLink(selected)" external icon="i-lucide-mail" size="sm" label="Correo" />
                  <UButton v-if="waLink(selected)" :to="waLink(selected)" target="_blank" icon="i-lucide-message-circle" size="sm" color="neutral" variant="subtle" label="WhatsApp" />
                </div>
              </div>
              <p class="mt-3 text-sm">
                <strong>Entrega:</strong> {{ selected.deliveryMethod === 'SHIPPING' ? 'Envío departamental' : 'Entrega en la ciudad / retiro' }}
                <template v-if="selected.address"> — {{ selected.address }}</template>
              </p>
              <p v-if="selected.notes" class="mt-2 rounded-lg bg-elevated p-2 text-sm"><strong>Notas del cliente:</strong> {{ selected.notes }}</p>
            </section>

            <section class="flex flex-col gap-2">
              <h3 class="font-display font-bold">Productos</h3>
              <div v-for="i in selected.items" :key="i.id" class="flex items-center gap-3 rounded-lg border border-default p-2">
                <div class="size-12 shrink-0 overflow-hidden rounded-md bg-elevated">
                  <AppImage v-if="i.imageUrl" :src="i.imageUrl" :alt="i.name" class="h-full w-full" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ i.name }}</p>
                  <p v-if="i.colorName" class="flex items-center gap-1.5 text-xs">
                    <span class="size-3 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: i.colorHex ?? undefined }" />
                    Color: <strong>{{ i.colorName }}</strong>
                  </p>
                  <p class="truncate text-xs text-muted">{{ i.collectionName }} · {{ i.quantity }} × {{ formatBs(i.unitPrice) }}</p>
                </div>
                <span class="font-display text-sm font-bold tabular-nums">{{ formatBs(i.lineTotal) }}</span>
              </div>
              <div class="flex justify-between text-sm"><span class="text-muted">Subtotal</span><span class="tabular-nums">{{ formatBs(selected.subtotal) }}</span></div>
            </section>

            <section class="grid gap-3 sm:grid-cols-2">
              <UFormField label="Estado" :help="selected.confirmedAt ? `Confirmado el ${dateFmt(selected.confirmedAt)}` : 'Al pasar a «Pedido confirmado» se envía el correo de confirmación al cliente.'">
                <USelect v-model="edit.status" :items="statusItems" class="w-full" />
              </UFormField>
              <UFormField label="Costo de envío (lo paga el cliente)">
                <UInput v-model.number="edit.shippingCost" type="number" min="0" step="0.5" class="w-full" />
              </UFormField>
              <UFormField label="Imprimió">
                <USelect v-model="edit.printedByUserId" :items="printerItems" class="w-full" />
              </UFormField>
              <UFormField label="Costo de impresión (Bs)">
                <UInput v-model.number="edit.printCost" type="number" min="0" step="0.5" class="w-full" />
              </UFormField>
              <UFormField label="Otros gastos (Bs)" class="sm:col-span-2" help="Comisiones, publicidad u otros gastos de esta venta.">
                <UInput v-model.number="edit.otherCosts" type="number" min="0" step="0.5" class="w-full" />
              </UFormField>
              <UFormField label="Notas internas" class="sm:col-span-2">
                <UTextarea v-model="edit.adminNotes" :rows="2" class="w-full" />
              </UFormField>
            </section>

            <section class="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
              <h3 class="mb-2 font-display font-bold">Reparto (contrato de socios)</h3>
              <div class="flex justify-between"><span>Utilidad neta</span><span class="font-bold tabular-nums">{{ formatBs(preview.net) }}</span></div>
              <div class="flex justify-between"><span>50 % para cada socio</span><span class="font-bold tabular-nums">{{ formatBs(preview.share) }}</span></div>
              <div v-if="printerName" class="flex justify-between"><span>Recibe {{ printerName }} (costo + 50 %)</span><span class="font-bold tabular-nums">{{ formatBs(preview.printerTotal) }}</span></div>
              <p class="mt-2 text-xs text-muted">Total que paga el cliente: {{ formatBs(selected.subtotal + Number(edit.shippingCost || 0)) }} (el envío no se reparte).</p>
            </section>

            <UAlert v-if="saveError" color="error" variant="subtle" :description="saveError" />
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="subtle" icon="i-lucide-mail" :label="selected?.confirmedAt ? 'Reenviar confirmación' : 'Reenviar correo'" :loading="resending" class="mr-auto" @click="resendEmail" />
            <UButton color="neutral" variant="ghost" label="Cerrar" @click="closeOrder" />
            <UButton :loading="saving" icon="i-lucide-save" label="Guardar cambios" @click="save" />
          </div>
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
