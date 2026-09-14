<script setup lang="ts">
import type { CollectionSummary } from '~/types'
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'
import { absoluteUrl } from '~/utils/seo'

useSeoMeta({
  title: 'Volt Vault — Coleccionables impresos en 3D',
  description: 'Descubre y colecciona figuras impresas en 3D por Volt-3D: animalitos flexibles, criaturas fantásticas, macetas y más.',
})

const { data } = await useFetch<{ success: boolean; data: CollectionSummary[] }>('/api/collections')
const collections = computed<CollectionSummary[]>(() => data.value?.data?.slice(0, 3) ?? [])

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/`)
const ogImage = computed(() => absoluteUrl(collections.value?.[0]?.coverImage?.url, config.public.siteUrl))

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
  <UPage>
    <UPageHero
      title="Colecciona. Descubre. Completa."
      description="Una plataforma de coleccionables impresos en 3D de Volt-3D. Explora colecciones, sigue tu progreso y completa tu colección."
      :links="[
        { label: 'Ver colecciones', to: '/collections', icon: 'i-lucide-library' },
      ]"
    />

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
</template>
