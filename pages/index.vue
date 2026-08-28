<script setup lang="ts">
useSeoMeta({
  title: 'Volt Vault — Coleccionables impresos en 3D',
  description: 'Descubre y colecciona figuras impresas en 3D por Volt-3D: animalitos flexibles, criaturas fantásticas, macetas y más.',
})
</script>

<template>
  <UPage>
    <UPageHero
      title="Colecciona. Descubre. Completa."
      description="Una plataforma de coleccionables impresos en 3D de Volt-3D. Explora colecciones, sigue tu progreso y completa tu colección."
      :links="[
        { label: 'Ver colecciones', to: '/collections', icon: 'i-lucide-collection' },
        { label: 'Iniciar sesión', to: '/login', color: 'neutral', variant: 'subtle' },
      ]"
    >
      <div class="rounded-lg bg-elevated p-6 ring ring-default text-center">
        <p class="text-sm text-muted">Próximamente: colecciones destacadas</p>
      </div>
    </UPageHero>

    <UPageSection
      id="colecciones"
      headline="Volt-3D"
      title="Colecciones destacadas"
      description="Figuras flexibles y criaturas fantásticas impresas en 3D, listas para coleccionar."
    />
  </UPage>
</template>
