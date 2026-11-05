<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Rarity } from '~/types'

useSeoMeta({ title: 'Dashboard — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { user } = useAuthUser()

const { data, error } = await useFetch<{
  success: boolean
  data: {
    counts: { collections: number; items: number; users: number; collected: number }
    sales: { total: number; avg: number }
    top: Array<{ id: string; name: string; slug: string; soldQuantity: number; stock: number; status: string; rarity: Rarity; collection: { name: string } }>
    recent: Array<{ obtainedAt: string; user: { name: string | null; email: string }; item: { name: string; slug: string } }>
  }
}>('/api/admin/dashboard/stats')

const stats = computed(() => data.value?.data)

const kpis = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'Colecciones', value: s.counts.collections, sub: 'activas', icon: 'i-lucide-library', color: 'var(--color-volt)' },
    { label: 'Items totales', value: s.counts.items, sub: 'piezas en catálogo', icon: 'i-lucide-box', color: 'var(--color-gold)' },
    { label: 'Usuarios', value: s.counts.users, sub: 'coleccionistas', icon: 'i-lucide-users', color: 'var(--color-volt)' },
    { label: 'Conseguidos', value: s.counts.collected, sub: 'marcas de posesión', icon: 'i-lucide-badge-check', color: 'var(--color-neon)' },
    { label: 'Unidades vendidas', value: s.sales.total, sub: `promedio ${s.sales.avg.toFixed(1)} / item`, icon: 'i-lucide-banknote', color: 'var(--color-success)' },
  ]
})

const topColumns: TableColumn<NonNullable<typeof stats.value>['top'][number]>[] = [
  { accessorKey: 'name', header: 'Item' },
  { accessorKey: 'collection.name', header: 'Colección' },
  { accessorKey: 'soldQuantity', header: 'Vendidos' },
  { accessorKey: 'stock', header: 'Stock', id: 'stock' },
  { accessorKey: 'rarity', header: 'Rareza', id: 'rarity' },
]

const recentItems = computed(() =>
  (stats.value?.recent ?? []).map((r) => ({
    title: `${r.user.name ?? r.user.email} consiguió "${r.item.name}"`,
    description: new Date(r.obtainedAt).toLocaleString('es', { timeZone: 'UTC' }),
    icon: 'i-lucide-check-check',
    color: 'success' as const,
  })),
)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Dashboard" />
    </template>
    <template #body>
    <UContainer class="min-w-0 space-y-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-1">
          <div class="label-caps flex items-center gap-2 text-volt">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-volt opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-volt" />
            </span>
            Sincronización · Nodo central
          </div>
          <h1 class="font-display text-headline font-extrabold tracking-tight">Dashboard general</h1>
          <p class="text-sm text-muted">Bienvenido, {{ user?.name ?? 'coleccionista' }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UButton to="/admin/collections" color="neutral" variant="subtle" icon="i-lucide-shapes">Nueva colección</UButton>
          <UButton to="/admin/items" color="neutral" variant="subtle" icon="i-lucide-box">Nuevo item</UButton>
          <UButton to="/admin/inventory" icon="i-lucide-package-plus">Registrar lote</UButton>
        </div>
      </div>

      <UAlert v-if="error" color="error" title="No se pudo cargar el dashboard" />

      <template v-else-if="stats">
        <!-- KPIs -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div
            v-for="kpi in kpis"
            :key="kpi.label"
            class="relative overflow-hidden rounded-2xl border border-default bg-muted p-4"
          >
            <div
              class="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-xl"
              :style="{ backgroundColor: `color-mix(in srgb, ${kpi.color} 20%, transparent)` }"
            />
            <div class="relative flex items-center justify-between">
              <span class="label-caps text-muted">{{ kpi.label }}</span>
              <div
                class="flex size-8 items-center justify-center rounded-full"
                :style="{ backgroundColor: `color-mix(in srgb, ${kpi.color} 18%, transparent)`, color: kpi.color }"
              >
                <UIcon :name="kpi.icon" class="size-4" />
              </div>
            </div>
            <p class="relative mt-3 font-display text-3xl font-extrabold tabular-nums tracking-tight">{{ kpi.value }}</p>
            <p class="relative mt-1 text-xs text-muted">{{ kpi.sub }}</p>
          </div>
        </div>

        <!-- Split: top + activity -->
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div class="min-w-0 rounded-2xl border border-default bg-muted p-5 xl:col-span-8">
            <div class="flex items-center justify-between pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full bg-gold" />
                  <h2 class="font-display font-bold">Top 5 más vendidos</h2>
                </div>
                <p class="mt-0.5 text-sm text-muted">Ranking por unidades vendidas</p>
              </div>
              <span class="label-caps hidden rounded-full bg-elevated px-2.5 py-1 text-volt sm:inline">Telemetría</span>
            </div>

            <div class="min-w-0 overflow-x-auto">
              <UTable :data="stats.top" :columns="topColumns" :empty="'Sin ventas registradas'">
              <template #name-cell="{ row }">
                <div class="flex flex-col">
                  <span class="font-display font-semibold">{{ row.original.name }}</span>
                  <span class="label-caps text-muted">{{ row.original.slug }}</span>
                </div>
              </template>
              <template #collection-name-cell="{ row }">
                <span class="text-sm text-muted">{{ row.original.collection.name }}</span>
              </template>
              <template #soldQuantity-cell="{ row }">
                <span class="font-display font-bold tabular-nums">{{ row.original.soldQuantity }}</span>
              </template>
              <template #stock-cell="{ row }">
                <UBadge :color="row.original.stock > 0 ? 'success' : 'error'" variant="subtle" :label="`${row.original.stock} disp.`" />
              </template>
              <template #rarity-cell="{ row }">
                <RarityBadge :rarity="row.original.rarity" />
              </template>
            </UTable>
            </div>
          </div>

          <div class="rounded-2xl border border-default bg-muted p-5 xl:col-span-4">
            <div class="flex items-center justify-between pb-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-radar" class="size-5 text-gold" />
                <h2 class="font-display font-bold">Actividad reciente</h2>
              </div>
              <span class="label-caps inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-volt">
                <span class="size-1.5 rounded-full bg-volt" /> En vivo
              </span>
            </div>
            <p v-if="!stats.recent.length" class="text-sm text-muted">Sin actividad reciente.</p>
            <UTimeline v-else :items="recentItems" />
          </div>
        </div>

        <!-- Status bar -->
        <div class="flex flex-col items-center justify-between gap-4 rounded-2xl border border-default bg-elevated p-4 sm:flex-row">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-full bg-muted text-gold">
              <UIcon name="i-lucide-network" class="size-5" />
            </div>
            <div>
              <p class="font-display font-semibold">Estado del enclave Volt Vault</p>
              <p class="text-sm text-muted">
                {{ stats.counts.collections }} colecciones · {{ stats.counts.items }} items · {{ stats.counts.collected }} piezas conseguidas
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-volt">
            <span class="size-2.5 rounded-full bg-volt shadow-[0_0_10px_var(--color-volt)]" />
            <span class="label-caps">Operativo</span>
          </div>
        </div>
      </template>

      <div v-else class="flex justify-center py-16">
        <USkeleton class="h-64 w-full rounded-2xl" />
      </div>
    </UContainer>
    </template>
  </UDashboardPanel>
</template>
