<template>
  <div class="flex flex-col gap-6">
    <div v-for="(section, i) in sections" :key="i" class="flex flex-col gap-1">
      <p v-if="section.title && !collapsed" class="px-3 pb-1 font-display text-sm font-bold text-default">
        {{ section.title }}
      </p>
      <div v-else-if="section.title" class="mx-auto mb-1 h-px w-8 bg-accented" />
      <NuxtLink
        v-for="item in section.items"
        :key="item.to"
        :to="item.to"
        :title="collapsed ? item.label : undefined"
        :aria-label="collapsed ? item.label : undefined"
        class="group relative flex items-center rounded-lg py-2.5 font-display text-[0.9375rem] font-semibold transition-colors"
        :class="[
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          isActive(item.to) ? 'bg-elevated text-highlighted' : 'text-muted hover:bg-elevated/60 hover:text-default',
        ]"
      >
        <UIcon
          :name="item.icon"
          class="size-5 shrink-0 transition-colors"
          :class="isActive(item.to) ? 'text-primary' : 'text-dimmed group-hover:text-default'"
        />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        <span
          v-if="item.badge && !collapsed"
          class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[0.625rem] font-bold leading-none text-inverted"
        >
          {{ item.badge }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SidebarNavItem {
  label: string
  icon: string
  to: string
  badge?: string
}

export interface SidebarNavSection {
  title?: string
  items: SidebarNavItem[]
}

withDefaults(defineProps<{
  sections: SidebarNavSection[]
  /** Barra plegada: solo iconos. */
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const route = useRoute()

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>
