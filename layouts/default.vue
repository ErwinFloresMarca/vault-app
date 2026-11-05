<template>
  <div class="min-h-screen bg-default">
    <!-- Barra lateral fija (escritorio) — estilo MakerWorld, plegable -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-default bg-sidebar transition-[width] duration-200 lg:flex"
      :class="collapsed ? 'w-[4.5rem]' : 'w-60'"
    >
      <div class="flex h-16 shrink-0 items-center" :class="collapsed ? 'justify-center px-2' : 'px-5'">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5" aria-label="Volt Vault — inicio">
          <img src="/logos/volt-vault-logo.png" alt="" class="size-9 shrink-0 object-contain">
          <span v-if="!collapsed" class="truncate font-display text-lg font-extrabold tracking-tight">Volt Vault</span>
        </NuxtLink>
      </div>

      <nav class="flex-1 overflow-y-auto pb-4 pt-3" :class="collapsed ? 'px-2' : 'px-3'">
        <SidebarNav :sections="navSections" :collapsed="collapsed" />

        <div v-if="!user && !collapsed" class="mt-6 rounded-xl border border-default bg-elevated/50 p-4">
          <p class="font-display text-sm font-bold">Tu bóveda personal</p>
          <p class="mt-1 text-xs text-muted">Inicia sesión para marcar figuras y seguir tu progreso.</p>
          <UButton to="/login" label="Iniciar sesión" size="sm" block class="mt-3" />
        </div>
      </nav>

      <div v-if="collapsed" class="flex justify-center border-t border-default py-3">
        <SocialLinks vertical />
      </div>
      <div v-else class="flex flex-col gap-2 border-t border-default px-6 py-4 text-xs text-dimmed">
        <SocialLinks class="-ml-2" />
        <div class="flex items-center gap-3">
          <NuxtLink to="/privacy" class="hover:text-default">Privacidad</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-default">Términos</NuxtLink>
        </div>
        <p>© {{ new Date().getFullYear() }} Volt Vault</p>
      </div>
    </aside>

    <!-- Menú lateral (móvil) -->
    <USlideover v-model:open="mobileOpen" side="left" :ui="{ content: 'max-w-72' }">
      <template #content>
        <div class="flex h-full flex-col bg-sidebar">
          <div class="flex h-16 shrink-0 items-center justify-between px-5">
            <NuxtLink to="/" class="flex items-center gap-2.5">
              <img src="/logos/volt-vault-logo.png" alt="" class="size-9 object-contain">
              <span class="font-display text-lg font-extrabold tracking-tight">Volt Vault</span>
            </NuxtLink>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Cerrar menú" @click="setMobileMenu(false)" />
          </div>
          <nav class="flex-1 overflow-y-auto px-3 pb-4 pt-2">
            <SidebarNav :sections="navSections" />
            <UButton v-if="!user" to="/login" label="Iniciar sesión" block class="mt-6" />
          </nav>
          <div class="flex items-center gap-3 border-t border-default px-5 py-3 text-xs text-dimmed">
            <NuxtLink to="/privacy" class="hover:text-default">Privacidad</NuxtLink>
            <NuxtLink to="/terms" class="hover:text-default">Términos</NuxtLink>
            <SocialLinks class="ml-auto" />
          </div>
        </div>
      </template>
    </USlideover>

    <div class="flex min-h-screen flex-col transition-[padding] duration-200" :class="collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-60'">
      <!-- Barra superior -->
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-default bg-default/85 px-4 backdrop-blur-xl sm:px-6">
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          class="lg:hidden"
          aria-label="Abrir menú"
          @click="setMobileMenu(true)"
        />
        <!-- Botón para guardar / mostrar la barra lateral (escritorio) -->
        <UTooltip :text="collapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral'">
          <UButton
            :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            color="neutral"
            variant="ghost"
            size="lg"
            class="hidden lg:inline-flex"
            :aria-label="collapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral'"
            :aria-expanded="!collapsed"
            @click="toggleSidebar"
          />
        </UTooltip>
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2 lg:hidden">
          <img src="/logos/volt-vault-logo.png" alt="" class="size-8 object-contain">
          <span class="hidden font-display font-extrabold tracking-tight sm:inline">Volt Vault</span>
        </NuxtLink>

        <form class="relative min-w-0 flex-1 lg:max-w-3xl" role="search" @submit.prevent="onSearch">
          <UIcon name="i-lucide-search" class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-dimmed" />
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Buscar colecciones..."
            aria-label="Buscar colecciones"
            class="h-10 w-full rounded-full border border-transparent bg-elevated pl-11 pr-4 text-sm text-default outline-none transition placeholder:text-dimmed hover:border-accented focus:border-primary/60 focus:bg-muted"
          >
        </form>

        <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <UButton
            v-if="user?.role === 'ADMIN'"
            to="/admin/dashboard"
            icon="i-lucide-layout-dashboard"
            label="Admin"
            color="primary"
            variant="soft"
            class="hidden sm:inline-flex"
          />
          <UChip :text="cartCount" :show="cartCount > 0" size="3xl" color="primary" inset>
            <UButton
              to="/cart"
              icon="i-lucide-shopping-cart"
              color="neutral"
              variant="ghost"
              :aria-label="cartCount ? `Carrito (${cartCount})` : 'Carrito'"
            />
          </UChip>
          <UColorModeButton />
          <UDropdownMenu v-if="user" :items="userMenuItems" :content="{ align: 'end' }">
            <button type="button" class="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-accented" :aria-label="user.name">
              <UAvatar :src="user.avatarUrl || undefined" :alt="user.name" icon="i-lucide-user" size="md" />
            </button>
          </UDropdownMenu>
          <UButton v-else to="/login" icon="i-lucide-log-in" aria-label="Iniciar sesión">
            <span class="hidden sm:inline">Iniciar sesión</span>
          </UButton>
        </div>
      </header>

      <UMain class="flex-1">
        <slot />
      </UMain>

      <footer class="border-t border-default px-4 py-6 sm:px-6">
        <div class="flex flex-col items-start justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
          <div class="flex items-center gap-2">
            <img src="/logos/volt-vault-logo.png" alt="" class="size-5 object-contain">
            <p>La bóveda definitiva para descubrir, catalogar y completar tus colecciones.</p>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <NuxtLink to="/collections" class="hover:text-default">Colecciones</NuxtLink>
            <NuxtLink to="/privacy" class="hover:text-default">Privacidad</NuxtLink>
            <NuxtLink to="/terms" class="hover:text-default">Términos</NuxtLink>
            <SocialLinks size="md" class="-my-2" />
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SidebarNavSection } from '~/components/molecules/SidebarNav.vue'
import { useAuthUser } from '~/composables/useAuth'

const { user, logout } = useAuthUser()
const route = useRoute()

// Contador del carrito (se lee del navegador; en SSR es 0)
const { count: cartCount } = useCart()

// Barra lateral plegable: el estado se guarda en una cookie para que el SSR
// la pinte igual al recargar.
const sidebarCookie = useCookie<boolean>('vv-sidebar-collapsed', { default: () => false, maxAge: 60 * 60 * 24 * 365 })
const collapsed = computed(() => sidebarCookie.value === true)
function toggleSidebar() {
  sidebarCookie.value = !collapsed.value
}

const mobileOpen = ref(false)
function setMobileMenu(open: boolean) {
  mobileOpen.value = open
}
watch(() => route.fullPath, () => setMobileMenu(false))

// Buscador de la barra superior: lleva a /collections?q=...
const searchTerm = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, (q) => { searchTerm.value = typeof q === 'string' ? q : '' })

function onSearch() {
  const q = searchTerm.value.trim()
  navigateTo({ path: '/collections', query: q ? { q } : {} })
}

const navSections = computed<SidebarNavSection[]>(() => {
  const you: SidebarNavSection = {
    title: 'Tú',
    items: [
      { label: 'Mi colección', icon: 'i-lucide-bookmark', to: '/me' },
      { label: 'Configuración', icon: 'i-lucide-settings', to: '/settings' },
    ],
  }
  if (user.value?.role === 'ADMIN') {
    you.items.push({ label: 'Panel admin', icon: 'i-lucide-layout-dashboard', to: '/admin/dashboard' })
    you.items.push({ label: 'Pedidos', icon: 'i-lucide-receipt-text', to: '/admin/orders' })
  }
  return [
    {
      items: [
        { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
        { label: 'Todas las colecciones', icon: 'i-lucide-layers', to: '/collections' },
      ],
    },
    you,
  ]
})

const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  const items: DropdownMenuItem[] = [{
    label: 'Mi colección',
    icon: 'i-lucide-library',
    to: '/me',
  }, {
    label: 'Configuración',
    icon: 'i-lucide-settings',
    to: '/settings',
  }]
  if (user.value?.role === 'ADMIN') {
    items.push({
      label: 'Panel admin',
      icon: 'i-lucide-layout-dashboard',
      to: '/admin/dashboard',
    }, {
      label: 'Pedidos',
      icon: 'i-lucide-receipt-text',
      to: '/admin/orders',
    })
  }
  return [
    [{ label: user.value?.name ?? '', type: 'label', avatar: { src: user.value?.avatarUrl || undefined, icon: 'i-lucide-user' } }],
    items,
    [{
      label: 'Cerrar sesión',
      icon: 'i-lucide-log-out',
      onSelect: () => logout(),
    }],
  ]
})
</script>
