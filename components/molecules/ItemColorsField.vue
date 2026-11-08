<template>
  <div class="flex flex-col gap-3">
    <!-- Colores comunes -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="c in FILAMENT_COLORS"
        :key="c.name"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition"
        :class="isSelected(c.name) ? 'border-primary bg-primary/10 text-highlighted' : 'border-default text-muted hover:border-accented'"
        :aria-pressed="isSelected(c.name)"
        @click="toggle(c)"
      >
        <span class="size-3.5 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: c.hex }" />
        {{ c.name }}
        <UIcon v-if="isSelected(c.name)" name="i-lucide-check" class="size-3.5 text-primary" />
      </button>
    </div>

    <!-- Personalizados ya agregados -->
    <div v-if="customColors.length" class="flex flex-wrap gap-2">
      <span
        v-for="c in customColors"
        :key="c.name"
        class="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs text-highlighted"
      >
        <span class="size-3.5 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: c.hex }" />
        {{ c.name }}
        <button type="button" class="text-muted hover:text-error" :aria-label="`Quitar ${c.name}`" @click="remove(c.name)">
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
      </span>
    </div>

    <!-- Agregar personalizado -->
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="customHex"
        type="color"
        class="h-8 w-10 cursor-pointer rounded border border-default bg-transparent"
        aria-label="Elegir color personalizado"
      >
      <UInput v-model="customName" placeholder="Color personalizado (ej.: Verde menta)" class="min-w-0 flex-1" @keydown.enter.prevent="addCustom" />
      <UButton icon="i-lucide-plus" color="neutral" variant="outline" :disabled="!customName.trim()" @click="addCustom">
        Agregar
      </UButton>
    </div>

    <p class="text-xs text-muted">
      {{ model.length ? `${model.length} color(es) seleccionados.` : 'Ninguno seleccionado: no se mostrará en la ficha.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ItemColor } from '~/types'
import { FILAMENT_COLORS } from '~/utils/filamentColors'

const model = defineModel<ItemColor[]>({ default: () => [] })

const customName = ref('')
const customHex = ref('#7FD3C1')

const commonNames = new Set(FILAMENT_COLORS.map((c) => c.name.toLowerCase()))
const customColors = computed(() => model.value.filter((c) => !commonNames.has(c.name.toLowerCase())))

function isSelected(name: string) {
  return model.value.some((c) => c.name.toLowerCase() === name.toLowerCase())
}

function remove(name: string) {
  model.value = model.value.filter((c) => c.name.toLowerCase() !== name.toLowerCase())
}

function toggle(color: ItemColor) {
  if (isSelected(color.name)) remove(color.name)
  else model.value = [...model.value, { ...color }]
}

function addCustom() {
  const name = customName.value.trim().slice(0, 40)
  if (!name) return
  // Si ya existe con ese nombre, se actualiza el tono.
  model.value = [...model.value.filter((c) => c.name.toLowerCase() !== name.toLowerCase()), { name, hex: customHex.value.toUpperCase() }]
  customName.value = ''
}
</script>
