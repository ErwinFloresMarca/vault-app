<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header="{ collapsed }">
        <NuxtLink to="/admin/dashboard" class="flex items-center gap-2 px-2">
          <img src="/icon-192.png" alt="" class="h-7 w-7 rounded-lg">
          <span v-if="!collapsed" class="font-display font-bold tracking-tight">Volt Vault · Admin</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navItems"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex flex-col gap-1">
          <UButton
            :icon="collapsed ? 'i-lucide-arrow-left' : undefined"
            :label="collapsed ? undefined : 'Volver al sitio'"
            color="neutral"
            variant="ghost"
            block
            to="/"
          />
          <UButton
            :icon="collapsed ? 'i-lucide-log-out' : undefined"
            :label="collapsed ? undefined : 'Cerrar sesión'"
            color="error"
            variant="ghost"
            block
            @click="logout"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthUser } from '~/composables/useAuth'

const { logout } = useAuthUser()

const navItems = computed<NavigationMenuItem[]>(() => [{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/admin/dashboard',
}, {
  label: 'Colecciones',
  icon: 'i-lucide-library',
  to: '/admin/collections',
}, {
  label: 'Items',
  icon: 'i-lucide-box',
  to: '/admin/items',
}, {
  label: 'Importar',
  icon: 'i-lucide-cloud-download',
  to: '/admin/import',
}, {
  label: 'Inventario',
  icon: 'i-lucide-boxes',
  to: '/admin/inventory',
}])
</script>
