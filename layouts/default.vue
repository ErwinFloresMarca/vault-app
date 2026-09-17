<template>
  <div class="min-h-screen flex flex-col">
    <UHeader>
      <template #title>
        <img src="/icon-192.png" alt="" class="h-8 w-8">
        <span class="text-xl tracking-tight">Volt Vault</span>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <UColorModeButton />
        <template v-if="user">
          <UDropdownMenu :items="userMenuItems">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-user"
              :label="user.name"
            />
          </UDropdownMenu>
        </template>
        <UButton v-else label="Iniciar sesión" color="neutral" variant="subtle" to="/login" />
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain class="flex-1">
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <div class="flex items-center gap-2">
          <img src="/icon-192.png" alt="" class="h-5 w-5">
          <p class="text-muted text-sm">
            © {{ new Date().getFullYear() }} Volt Vault · Volt-3D. Coleccionables impresos en 3D.
          </p>
        </div>
      </template>
      <template #right>
        <UButton icon="i-lucide-library" color="neutral" variant="ghost" to="/collections" label="Colecciones" />
        <NuxtLink to="/privacy" class="text-muted text-sm hover:text-default">
          Privacidad
        </NuxtLink>
        <NuxtLink to="/terms" class="text-muted text-sm hover:text-default">
          Términos
        </NuxtLink>
      </template>
    </UFooter>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useAuthUser } from '~/composables/useAuth'

const { user, logout } = useAuthUser()

const navItems = computed<NavigationMenuItem[]>(() => [{
  label: 'Inicio',
  to: '/',
}, {
  label: 'Colecciones',
  to: '/collections',
}])

const userMenuItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [{
    label: 'Mi colección',
    icon: 'i-lucide-library',
    to: '/me',
  }]
  if (user.value?.role === 'ADMIN') {
    items.push({
      label: 'Panel admin',
      icon: 'i-lucide-layout-dashboard',
      to: '/admin/dashboard',
    })
  }
  items.push({
    label: 'Cerrar sesión',
    icon: 'i-lucide-log-out',
    onSelect: () => logout(),
  })
  return items
})
</script>
