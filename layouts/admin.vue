<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2 px-2">
          <div class="flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-7 w-7">
            <Icon name="i-lucide-box" class="h-4 w-4" />
          </div>
          <span v-if="!collapsed" class="font-semibold tracking-tight">Volt Vault · Admin</span>
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
        <UButton
          :icon="collapsed ? 'i-lucide-arrow-left' : undefined"
          :label="collapsed ? undefined : 'Volver al sitio'"
          color="neutral"
          variant="ghost"
          block
          to="/"
        />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const navItems = computed<NavigationMenuItem[]>(() => [{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/admin/dashboard',
}, {
  label: 'Colecciones',
  icon: 'i-lucide-collection',
  to: '/admin/collections',
}, {
  label: 'Items',
  icon: 'i-lucide-box',
  to: '/admin/items',
}])
</script>
