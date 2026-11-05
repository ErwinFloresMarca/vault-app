<script setup lang="ts">
import type { CollectionSummary } from '~/types'
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'
import { XP_PER_RARITY } from '~/utils/gamification'

useSeoMeta({
  title: 'Volt Vault — La bóveda de coleccionables',
  description: 'Explora colecciones de edición limitada, certifica tus piezas conseguidas y lleva el seguimiento de tu progreso al 100%.',
})

const { data } = await useFetch<{ success: boolean; data: CollectionSummary[] }>('/api/collections')
const { data: statsData } = await useFetch<{
  success: boolean
  data: { collections: number; items: number; legendary: number; collectors: number; collected: number }
}>('/api/stats')

const allCollections = computed<CollectionSummary[]>(() => data.value?.data ?? [])
const collections = computed<CollectionSummary[]>(() => allCollections.value.slice(0, 3))

const stats = computed(() => statsData.value?.data ?? { collections: 0, items: 0, legendary: 0, collectors: 0, collected: 0 })

const rarities = [
  { key: 'COMMON', name: 'Común', color: 'var(--color-rarity-common)', xp: XP_PER_RARITY.COMMON, desc: 'Figuras base de alta distribución, ideales para consolidar el núcleo de cualquier serie.' },
  { key: 'RARE', name: 'Rara', color: 'var(--color-rarity-rare)', xp: XP_PER_RARITY.RARE, desc: 'Variantes de color o acabados especiales, con tiradas más reducidas.' },
  { key: 'EPIC', name: 'Épica', color: 'var(--color-rarity-epic)', xp: XP_PER_RARITY.EPIC, desc: 'Piezas con detalles translúcidos, partes desmontables y presentación de coleccionista.' },
  { key: 'LEGENDARY', name: 'Legendaria', color: 'var(--color-rarity-legendary)', xp: XP_PER_RARITY.LEGENDARY, desc: 'Tiradas máximas numeradas, acabados oro y cromo y certificado de autenticidad.' },
]

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/`)

useSeoMeta({
  ogTitle: 'Volt Vault — La bóveda de coleccionables',
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })

defineOgImage('VoltVaultGeneric', { label: 'Catálogo completo' })
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-4 py-6 sm:px-6 lg:gap-14 lg:py-8">
    <!-- HERO — banner estilo MakerWorld (foto de fondo) -->
    <section class="relative isolate overflow-hidden rounded-2xl border border-default bg-[#16171b] text-white">
      <img
        src="/images/hero-volt.webp"
        alt=""
        width="1843"
        height="853"
        fetchpriority="high"
        class="block h-56 w-full object-cover object-[80%_center] sm:absolute sm:inset-0 sm:-z-10 sm:h-full sm:object-right"
      >
      <!-- Degradado para que el texto se lea sobre la foto -->
      <div class="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-t from-[#16171b] via-transparent to-transparent sm:inset-0 sm:-z-10 sm:h-full sm:bg-gradient-to-r sm:from-[#16171b] sm:via-[#16171b]/60 sm:to-transparent" />

      <div class="relative flex flex-col gap-5 px-6 pb-6 sm:min-h-[400px] sm:justify-center sm:gap-6 sm:p-10 lg:min-h-[460px] lg:px-14">
        <span class="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight sm:text-xl">
          <img src="/logos/volt-vault-logo.png" alt="" class="size-9 object-contain sm:size-10">
          Volt Vault
        </span>

        <h1 class="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
          Empieza una<br>
          <span class="text-brand">Aventura.</span>
        </h1>

        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            to="/collections"
            class="inline-flex items-center gap-3 rounded-full bg-brand px-7 py-3.5 font-display text-lg font-extrabold text-[#111] shadow-glow-brand transition hover:-translate-y-0.5 hover:bg-brand-300"
          >
            <UIcon name="i-lucide-gamepad-2" class="size-6" />
            Ver colección
            <UIcon name="i-lucide-arrow-right" class="size-5" />
          </NuxtLink>
          <NuxtLink
            to="/me"
            class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-6 py-3.5 font-display font-bold text-white backdrop-blur transition hover:bg-white/10"
          >
            <UIcon name="i-lucide-lock-open" class="size-5" />
            Mi colección
          </NuxtLink>
        </div>

        <div class="flex items-center gap-3 text-sm text-white/70">
          <div class="flex -space-x-2">
            <span class="flex size-8 items-center justify-center rounded-full bg-[#333] text-brand ring-2 ring-[#16171b]"><UIcon name="i-lucide-bolt" class="size-4" /></span>
            <span class="flex size-8 items-center justify-center rounded-full bg-brand text-[#111] ring-2 ring-[#16171b]"><UIcon name="i-lucide-badge-check" class="size-4" /></span>
            <span class="flex size-8 items-center justify-center rounded-full bg-gold text-ink ring-2 ring-[#16171b]"><UIcon name="i-lucide-award" class="size-4" /></span>
          </div>
          <p><span class="font-semibold text-white">{{ stats.collected }}</span> piezas conseguidas por la comunidad</p>
        </div>
      </div>
    </section>

    <!-- MÉTRICAS -->
    <section class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile :value="stats.items" label="Figuras catalogadas" icon="i-lucide-shapes" color="volt" />
      <StatTile :value="stats.collections" label="Colecciones activas" icon="i-lucide-database" color="gold" />
      <StatTile :value="stats.legendary" label="Piezas legendarias" icon="i-lucide-gem" color="neon" />
      <StatTile :value="stats.collectors" label="Coleccionistas" icon="i-lucide-shield-user" color="success" />
    </section>

    <!-- COLECCIONES DESTACADAS -->
    <section>
      <div class="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Catálogo oficial"
          title="Colecciones destacadas"
          description="Explora las series activas y verifica tu estado de completitud."
        />
        <NuxtLink to="/collections" class="inline-flex shrink-0 items-center gap-1 font-display text-sm font-bold text-muted transition-colors hover:text-primary">
          Ver todas <UIcon name="i-lucide-chevron-right" class="size-4" />
        </NuxtLink>
      </div>

      <div class="mt-6">
        <CollectionGrid v-if="collections.length" :collections="collections" columns="three" />
        <UEmpty v-else title="Pronto" description="Estamos preparando nuevas colecciones." />
      </div>
    </section>

    <!-- SISTEMA DE RAREZAS -->
    <section class="rounded-2xl border border-default bg-muted p-5 sm:p-8">
      <SectionHeading
        eyebrow="Protocolo de rangos Volt"
        title="Sistema de rarezas"
        description="Cada pieza de tu bóveda pertenece a un tier de rareza. Los tiers más altos tienen tiradas más cortas, acabados especiales y valor de colección."
      />

      <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div
          v-for="tier in rarities"
          :key="tier.key"
          class="flex flex-col rounded-xl border border-default bg-elevated/50 p-4 transition-colors hover:border-accented hover:bg-elevated"
        >
          <div class="flex items-center justify-between">
            <span
              class="label-caps inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1"
              :style="{ color: tier.color, backgroundColor: `color-mix(in srgb, ${tier.color} 15%, transparent)` }"
            >
              <span class="size-1.5 rounded-full" :style="{ backgroundColor: tier.color }" />
              {{ tier.name }}
            </span>
            <span class="font-display text-sm font-extrabold tabular-nums" :style="{ color: tier.color }">+{{ tier.xp }} XP</span>
          </div>
          <p class="mt-3 text-sm text-muted">{{ tier.desc }}</p>
          <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-accented">
            <div class="h-full w-full rounded-full" :style="{ backgroundColor: tier.color }" />
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-default bg-elevated/50 p-4 sm:flex-row sm:items-center">
        <div class="flex items-center gap-3">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-inverted">
            <UIcon name="i-lucide-stars" class="size-6" />
          </div>
          <div>
            <p class="font-display font-bold">¿Completaste el 100% de una serie?</p>
            <p class="text-sm text-muted">Consulta el progreso de cada colección y descubre tu siguiente objetivo.</p>
          </div>
        </div>
        <UButton to="/collections" color="neutral" variant="subtle" icon="i-lucide-arrow-right" trailing>
          Explorar todas las series
        </UButton>
      </div>
    </section>

    <!-- CTA BÓVEDA PERSONAL -->
    <section class="relative overflow-hidden rounded-2xl border border-default bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#141414] p-8 text-center text-white lg:p-12">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(176,239,31,0.12),transparent_60%)]" />
      <div class="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <span class="label-caps inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-brand">
          <UIcon name="i-lucide-lock" class="size-4" />
          Tu bóveda personal está lista
        </span>
        <h2 class="font-display text-3xl font-black tracking-tight sm:text-4xl">Organiza, certifica y exhibe tu pasión coleccionista</h2>
        <p class="text-white/70">Inicia sesión para llevar el seguimiento de tus piezas y completar tus colecciones.</p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-1">
          <NuxtLink
            to="/collections"
            class="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-display font-extrabold text-[#111] transition hover:-translate-y-0.5 hover:bg-brand-300"
          >
            Explorar catálogo <UIcon name="i-lucide-rocket" class="size-5" />
          </NuxtLink>
          <NuxtLink
            to="/me"
            class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-display font-bold text-white transition hover:bg-white/10"
          >
            <UIcon name="i-lucide-package" class="size-5" /> Ver mi inventario
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
