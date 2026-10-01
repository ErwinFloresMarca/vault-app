<script setup lang="ts">
import type { CollectionWithItems, Rarity } from '~/types'
import { metaDescription, absoluteUrl } from '~/utils/seo'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, pending, error } = await useFetch<{ success: boolean; data: CollectionWithItems }>(`/api/collections/${slug.value}`)
const collection = computed<CollectionWithItems | null>(() => data.value?.data ?? null)

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/collections/${slug.value}`)
const metaDesc = computed(() =>
  metaDescription(collection.value?.description, 'Colección de coleccionables de Volt Vault.'),
)
const ogImage = computed(() => absoluteUrl(collection.value?.coverImage?.url, config.public.siteUrl))

useSeoMeta({
  title: () => (collection.value?.name || 'Colección') + ' — Volt Vault',
  description: metaDesc,
  ogTitle: () => collection.value?.name || 'Colección',
  ogDescription: metaDesc,
  ogType: 'website',
  ogUrl: canonical,
  ogImage,
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })

const mode = ref<'grid' | 'checklist'>('grid')

const RARITIES: { key: Rarity; label: string; color: string }[] = [
  { key: 'COMMON', label: 'Común', color: 'var(--color-rarity-common)' },
  { key: 'RARE', label: 'Rara', color: 'var(--color-rarity-rare)' },
  { key: 'EPIC', label: 'Épica', color: 'var(--color-rarity-epic)' },
  { key: 'LEGENDARY', label: 'Legendaria', color: 'var(--color-rarity-legendary)' },
]

const rarityCounts = computed(() => RARITIES.map((r) => ({
  ...r,
  count: collection.value?.items.filter((i) => i.rarity === r.key).length ?? 0,
})).filter((r) => r.count > 0))

const collected = computed(() => collection.value?.progress?.collected ?? 0)
const totalItems = computed(() => collection.value?.items.length ?? 0)
const percent = computed(() => collection.value?.progress?.percent ?? 0)
const remaining = computed(() => Math.max(0, totalItems.value - collected.value))
const completed = computed(() => !!collection.value?.progress && percent.value === 100 && totalItems.value > 0)
</script>

<template>
  <div>
    <!-- Vault header -->
    <section v-if="collection" class="relative overflow-hidden border-b border-default">
      <div class="absolute inset-0">
        <AppImage
          v-if="collection.coverImage?.url"
          :src="collection.coverImage.url"
          :alt="collection.name"
          class="h-full w-full opacity-30"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-default via-default/80 to-default/40" />
      </div>

      <UContainer class="relative py-10 lg:py-14">
        <NuxtLink to="/collections" class="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-default">
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Colecciones
        </NuxtLink>

        <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span class="h-4 w-1.5 rounded-full bg-primary" />
              <span class="label-caps text-primary">Bóveda de colección</span>
            </div>
            <h1 class="font-display text-display font-extrabold tracking-tight">{{ collection.name }}</h1>
            <TagList v-if="collection.tags?.length" :tags="collection.tags" />
          </div>

          <div class="flex items-center gap-4 rounded-2xl border border-default bg-muted/80 p-4 backdrop-blur">
            <ProgressRing :percent="percent" :size="88" :color="completed ? 'gold' : 'volt'" />
            <div class="text-sm">
              <p class="label-caps text-muted">Tu progreso</p>
              <p class="font-display text-lg font-bold tabular-nums">{{ collected }} / {{ totalItems }}</p>
              <p v-if="completed" class="label-caps mt-0.5 text-gold">Colección completada</p>
              <p v-else-if="collection.progress" class="text-muted">Faltan {{ remaining }} piezas</p>
              <NuxtLink v-else to="/login" class="text-volt hover:underline">Inicia sesión para seguir tu progreso</NuxtLink>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <UContainer v-if="collection" class="py-10">
      <!-- Vault stats -->
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile :value="totalItems" label="Piezas en la serie" icon="i-lucide-boxes" color="volt" />
        <StatTile :value="collected" label="En tu bóveda" icon="i-lucide-vault" color="success" />
        <StatTile :value="rarityCounts.length" label="Tiers de rareza" icon="i-lucide-gem" color="neon" />
        <StatTile :value="`${percent}%`" label="Completado" icon="i-lucide-gauge" color="gold" />
      </div>

      <!-- Rarity breakdown -->
      <div v-if="rarityCounts.length" class="mt-6 flex flex-wrap gap-2">
        <span
          v-for="r in rarityCounts"
          :key="r.key"
          class="label-caps inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
          :style="{ color: r.color, borderColor: r.color, backgroundColor: `color-mix(in srgb, ${r.color} 12%, transparent)` }"
        >
          <span class="size-1.5 rounded-full" :style="{ backgroundColor: r.color }" />
          {{ r.label }} · {{ r.count }}
        </span>
      </div>

      <MarkdownContent v-if="collection.description" :source="collection.description" class="mt-8" />

      <!-- Items header + view toggle -->
      <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="font-display text-headline font-bold">Piezas de la serie</h2>
        <div class="inline-flex w-fit rounded-full border border-default bg-muted p-1">
          <button
            type="button"
            class="label-caps inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
            :class="mode === 'grid' ? 'bg-elevated text-default' : 'text-muted hover:text-default'"
            @click="mode = 'grid'"
          >
            <UIcon name="i-lucide-layout-grid" class="size-4" /> Vitrina
          </button>
          <button
            type="button"
            class="label-caps inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors"
            :class="mode === 'checklist' ? 'bg-elevated text-default' : 'text-muted hover:text-default'"
            @click="mode = 'checklist'"
          >
            <UIcon name="i-lucide-list-checks" class="size-4" /> Checklist
          </button>
        </div>
      </div>

      <div class="mt-6">
        <template v-if="collection.items.length">
          <CollectionChecklist v-if="mode === 'checklist'" :items="collection.items" :collection-slug="collection.slug" />
          <ItemGrid v-else :items="collection.items" :collection-slug="collection.slug" />
        </template>
        <UEmpty v-else title="Sin piezas" description="Esta colección aún no tiene items publicados." />
      </div>

      <!-- Reward card -->
      <div
        class="relative mt-10 overflow-hidden rounded-2xl border p-6 lg:p-8"
        :class="completed ? 'border-gold/40 bg-gold/5' : 'border-default bg-muted'"
      >
        <div class="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full bg-gold/10 blur-2xl" />
        <div class="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex size-14 shrink-0 items-center justify-center rounded-full"
              :class="completed ? 'bg-gold text-ink' : 'bg-elevated text-gold'"
            >
              <UIcon :name="completed ? 'i-lucide-trophy' : 'i-lucide-lock-clock'" class="size-7" />
            </div>
            <div>
              <span class="label-caps text-gold">Recompensa de colección</span>
              <p class="font-display text-headline font-bold">
                {{ completed ? '¡Colección completada!' : 'Insignia de maestro' }}
              </p>
              <p class="text-sm text-muted">
                {{ completed
                  ? 'Has conseguido todas las piezas de esta serie.'
                  : `Completa las ${totalItems} piezas para dominar esta serie (faltan ${remaining}).` }}
              </p>
            </div>
          </div>

          <div class="flex w-full shrink-0 flex-col gap-2 sm:w-64">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Progreso global</span>
              <span class="font-display font-bold tabular-nums text-gold">{{ collected }} / {{ totalItems }}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-default">
              <div
                class="h-full rounded-full bg-gradient-to-r from-volt to-gold transition-[width] duration-700"
                :style="{ width: `${percent}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </UContainer>

    <div v-else class="py-10">
      <UContainer>
        <USkeleton v-if="pending" class="h-64 rounded-2xl" />
        <UAlert v-else-if="error" color="error" title="No se pudo cargar la colección" />
        <UEmpty v-else title="Colección no encontrada" description="Es posible que aún no se publique." />
      </UContainer>
    </div>
  </div>
</template>
