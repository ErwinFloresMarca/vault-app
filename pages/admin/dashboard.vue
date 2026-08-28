<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

useSeoMeta({ title: 'Dashboard — Volt Vault Admin' })

definePageMeta({ layout: 'admin' })

const { data, pending, error } = await useFetch<{
  success: boolean
  data: {
    counts: { collections: number; items: number; users: number; collected: number }
    sales: { total: number; avg: number }
    top: Array<{ id: string; name: string; soldQuantity: number; stock: number; collection: { name: string } }>
    recent: Array<{ obtainedAt: string; user: { name: string | null; email: string }; item: { name: string } }>
  }
}>('/api/admin/dashboard/stats')

const stats = computed(() => data.value?.data)

const topColumns: TableColumn<NonNullable<typeof stats.value>['top'][number]>[] = [
  { accessorKey: 'name', header: 'Item' },
  { accessorKey: 'collection.name', header: 'Colección' },
  { accessorKey: 'soldQuantity', header: 'Vendidos' },
  { accessorKey: 'stock', header: 'Stock' },
]

const recentItems = computed(() =>
  (stats.value?.recent ?? []).map((r) => ({
    title: `${r.user.name ?? r.user.email} consiguió "${r.item.name}"`,
    description: new Date(r.obtainedAt).toLocaleString('es'),
    icon: 'i-lucide-check-check',
    color: 'success' as const,
  })),
)
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Dashboard" />
    <UContainer class="p-6">
      <UAlert v-if="error" color="error" title="No se pudo cargar el dashboard" />

      <div v-else-if="stats" class="space-y-8">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <UPageCard>
            <template #content>
              <p class="text-sm text-muted">Colecciones</p>
              <p class="text-3xl font-bold">{{ stats.counts.collections }}</p>
            </template>
          </UPageCard>
          <UPageCard>
            <template #content>
              <p class="text-sm text-muted">Items</p>
              <p class="text-3xl font-bold">{{ stats.counts.items }}</p>
            </template>
          </UPageCard>
          <UPageCard>
            <template #content>
              <p class="text-sm text-muted">Usuarios</p>
              <p class="text-3xl font-bold">{{ stats.counts.users }}</p>
            </template>
          </UPageCard>
          <UPageCard>
            <template #content>
              <p class="text-sm text-muted">Elementos conseguidos</p>
              <p class="text-3xl font-bold">{{ stats.counts.collected }}</p>
            </template>
          </UPageCard>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UPageCard>
            <template #header>
              <h3 class="font-semibold">Más vendidos</h3>
            </template>
            <template #content>
              <UTable
                :rows="stats.top"
                :columns="topColumns"
                :empty-state="{ icon: 'i-lucide-box', label: 'Sin ventas registradas' }"
              />
            </template>
          </UPageCard>

          <UPageCard>
            <template #header>
              <h3 class="font-semibold">Actividad reciente</h3>
            </template>
            <template #content>
              <div v-if="!stats.recent.length" class="text-sm text-muted">Sin actividad reciente.</div>
              <UTimeline v-else :items="recentItems" />
            </template>
          </UPageCard>
        </div>
      </div>

      <div v-else class="flex justify-center py-16">
        <USkeleton class="h-64 w-full rounded-lg" />
      </div>
    </UContainer>
  </UDashboardPanel>
</template>
