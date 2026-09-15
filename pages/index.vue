<script setup lang="ts">
import type { CollectionSummary } from '~/types'
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'
import { absoluteUrl } from '~/utils/seo'

useSeoMeta({
  title: 'Volt Vault — Coleccionables impresos en 3D',
  description: 'Descubre y colecciona figuras impresas en 3D por Volt-3D: animalitos flexibles, criaturas fantásticas, macetas y más.',
})

const { data } = await useFetch<{ success: boolean; data: CollectionSummary[] }>('/api/collections')
const allCollections = computed<CollectionSummary[]>(() => data.value?.data ?? [])
const collections = computed<CollectionSummary[]>(() => allCollections.value.slice(0, 4))
const heroImages = computed(() =>
  allCollections.value
    .map((c) => c.coverImage?.url)
    .filter((url): url is string => !!url)
    .slice(0, 4),
)

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/`)
const ogImage = computed(() => absoluteUrl(heroImages.value?.[0], config.public.siteUrl))

useSeoMeta({
  ogTitle: 'Volt Vault — Coleccionables impresos en 3D',
  ogType: 'website',
  ogUrl: canonical,
  ogImage,
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-default bg-gradient-to-br from-navy-900 to-navy-800">
      <UContainer class="relative py-14 lg:py-20">
        <div class="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-volt-yellow">Volt-3D</p>
            <h1 class="mt-3 text-4xl uppercase leading-[0.97] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Colecciona. Descubre. Completa.
            </h1>
            <p class="mt-4 max-w-md text-white/70">
              Una plataforma de coleccionables impresos en 3D de Volt-3D. Explora colecciones,
              sigue tu progreso y completa tu colección.
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <UButton to="/collections" icon="i-lucide-library">Ver colecciones</UButton>
              <UButton to="/me" variant="outline" color="neutral" icon="i-lucide-heart">Mi colección</UButton>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="aspect-square overflow-hidden rounded-xl">
              <AppImage
                v-if="heroImages[i - 1]"
                :src="heroImages[i - 1]"
                alt=""
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center bg-white/5">
                <Icon name="i-lucide-box" class="size-8 text-white/20" />
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <UPage>
      <UPageSection
        id="colecciones"
        headline="Volt-3D"
        title="Colecciones destacadas"
        description="Figuras flexibles y criaturas fantásticas impresas en 3D, listas para coleccionar."
      >
        <CollectionGrid v-if="collections.length" :collections="collections" />
        <UEmpty v-else title="Pronto" description="Estamos preparando nuevas colecciones." />
      </UPageSection>
    </UPage>
  </div>
</template>
