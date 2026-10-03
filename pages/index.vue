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
const showcase = computed<CollectionSummary[]>(() =>
  allCollections.value.filter((c) => c.coverImage?.url).slice(0, 3),
)

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
  <div>
    <!-- HERO -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-volt/10 blur-[140px]" />
      <div class="pointer-events-none absolute right-0 top-72 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[150px]" />

      <UContainer class="relative py-12 lg:py-20">
        <div class="grid items-center gap-12 lg:grid-cols-12">
          <div class="flex flex-col items-start gap-5 lg:col-span-7">
            <div class="inline-flex items-center gap-2 rounded-full bg-elevated px-3 py-1">
              <span class="relative flex size-2">
                <span class="absolute inline-flex size-full animate-ping rounded-full bg-volt opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-volt" />
              </span>
              <span class="label-caps text-volt">Volt Vault · Plataforma de coleccionables</span>
            </div>

            <h1 class="font-display text-display font-extrabold tracking-tight">
              Colecciona.<br>
              <span class="bg-gradient-to-r from-gold-300 via-gold-400 to-volt bg-clip-text text-transparent">Descubre.</span><br>
              Completa.
            </h1>

            <p class="max-w-xl text-lg text-muted">
              La bóveda interactiva para explorar colecciones de edición limitada, certificar tus
              piezas conseguidas y llevar el seguimiento de tu progreso al 100%.
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <UButton to="/collections" size="lg" icon="i-lucide-arrow-right" trailing>Ver colecciones</UButton>
              <UButton to="/me" size="lg" color="neutral" variant="subtle" icon="i-lucide-lock-open">Mi colección</UButton>
            </div>

            <div class="flex items-center gap-3 pt-2 text-sm text-muted">
              <div class="flex -space-x-2">
                <span class="flex size-8 items-center justify-center rounded-full bg-elevated text-gold ring-2 ring-default"><UIcon name="i-lucide-bolt" class="size-4" /></span>
                <span class="flex size-8 items-center justify-center rounded-full bg-volt text-white ring-2 ring-default"><UIcon name="i-lucide-badge-check" class="size-4" /></span>
                <span class="flex size-8 items-center justify-center rounded-full bg-gold text-ink ring-2 ring-default"><UIcon name="i-lucide-award" class="size-4" /></span>
              </div>
              <p><span class="font-semibold text-default">{{ stats.collected }}</span> piezas conseguidas por la comunidad</p>
            </div>
          </div>

          <!-- Showcase collage (real covers) -->
          <div class="lg:col-span-5">
            <div v-if="showcase.length" class="grid grid-cols-2 gap-3">
              <VaultCard
                v-for="(c, i) in showcase"
                :key="c.id"
                :to="`/collections/${c.slug}`"
                class="overflow-hidden"
                :class="i === 0 ? 'col-span-2' : ''"
              >
                <div class="relative w-full overflow-hidden" :class="i === 0 ? 'aspect-[16/9]' : 'aspect-square'">
                  <AppImage
                    :src="c.coverImage!.url"
                    :alt="c.name"
                    class="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-muted to-transparent p-3">
                    <span class="label-caps text-volt">{{ c.itemCount }} {{ c.itemCount === 1 ? 'item' : 'items' }}</span>
                    <p class="truncate font-display font-bold">{{ c.name }}</p>
                  </div>
                </div>
              </VaultCard>
            </div>
            <div v-else class="grid grid-cols-2 gap-3">
              <div v-for="i in 3" :key="i" class="flex aspect-square items-center justify-center rounded-2xl border border-default bg-muted" :class="i === 1 ? 'col-span-2 aspect-[16/9]' : ''">
                <UIcon name="i-lucide-box" class="size-8 text-muted" />
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- TELEMETRY METRICS -->
    <section class="border-y border-default bg-elevated/40">
      <UContainer class="py-8">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile :value="stats.items" label="Figuras catalogadas" icon="i-lucide-shapes" color="volt" />
          <StatTile :value="stats.collections" label="Colecciones activas" icon="i-lucide-database" color="gold" />
          <StatTile :value="stats.legendary" label="Piezas legendarias" icon="i-lucide-gem" color="neon" />
          <StatTile :value="stats.collectors" label="Coleccionistas" icon="i-lucide-shield-user" color="success" />
        </div>
      </UContainer>
    </section>

    <!-- FEATURED COLLECTIONS -->
    <UContainer class="py-12 lg:py-16">
      <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Catálogo oficial"
          title="Colecciones destacadas"
          description="Explora las series activas y verifica tu estado de completitud."
        />
        <UButton to="/collections" color="neutral" variant="subtle" icon="i-lucide-arrow-right" trailing>
          Todas las colecciones
        </UButton>
      </div>

      <div class="mt-8">
        <CollectionGrid v-if="collections.length" :collections="collections" />
        <UEmpty v-else title="Pronto" description="Estamos preparando nuevas colecciones." />
      </div>
    </UContainer>

    <!-- RARITY SYSTEM -->
    <section class="border-y border-default bg-elevated/40">
      <UContainer class="py-12 lg:py-16">
        <div class="rounded-2xl border border-default bg-muted p-6 lg:p-10">
          <SectionHeading
            eyebrow="Protocolo de rangos Volt"
            title="Sistema de rarezas"
            description="Cada pieza de tu bóveda pertenece a un tier de rareza. Los tiers más altos tienen tiradas más cortas, acabados especiales y valor de colección."
          />

          <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="tier in rarities"
              :key="tier.key"
              class="flex flex-col rounded-2xl border border-default bg-muted p-4 transition-colors hover:bg-elevated"
              :style="{ boxShadow: `inset 0 0 0 0 ${tier.color}` }"
            >
              <span
                class="label-caps inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1"
                :style="{ color: tier.color, backgroundColor: `color-mix(in srgb, ${tier.color} 15%, transparent)` }"
              >
                <span class="size-1.5 rounded-full" :style="{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}` }" />
                {{ tier.name }}
              </span>
              <p class="mt-3 text-sm text-muted">{{ tier.desc }}</p>
              <span class="mt-3 font-display text-sm font-bold tabular-nums" :style="{ color: tier.color }">+{{ tier.xp }} XP</span>
              <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-elevated">
                <div class="h-full w-full rounded-full" :style="{ backgroundColor: tier.color }" />
              </div>
            </div>
          </div>

          <div class="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-default bg-muted p-4 sm:flex-row">
            <div class="flex items-center gap-3">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
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
        </div>
      </UContainer>
    </section>

    <!-- PERSONAL VAULT CTA -->
    <UContainer class="py-12 lg:py-16">
      <div class="relative overflow-hidden rounded-2xl border border-default bg-gradient-to-r from-elevated via-muted to-default p-8 text-center lg:p-12">
        <div class="pointer-events-none absolute -top-24 right-1/4 size-64 rounded-full bg-volt/20 blur-3xl" />
        <div class="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
          <span class="label-caps inline-flex items-center gap-2 rounded-full bg-elevated px-3 py-1 text-volt">
            <UIcon name="i-lucide-lock" class="size-4" />
            Tu bóveda personal está lista
          </span>
          <h2 class="font-display text-headline font-extrabold">Organiza, certifica y exhibe tu pasión coleccionista</h2>
          <p class="text-muted">Inicia sesión para llevar el seguimiento de tus piezas y completar tus colecciones.</p>
          <div class="flex flex-wrap items-center justify-center gap-3 pt-1">
            <UButton to="/collections" size="lg" icon="i-lucide-rocket" trailing>Explorar catálogo</UButton>
            <UButton to="/me" size="lg" color="neutral" variant="subtle" icon="i-lucide-package">Ver mi inventario</UButton>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
