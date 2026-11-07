<script setup lang="ts">
import type { ItemDetail, CollectionWithItems } from '~/types'
import { metaDescription } from '~/utils/seo'
import { xpForRarity } from '~/utils/gamification'
import { CART_MAX_QTY, formatBs } from '~/composables/useCart'
import { isSellable, saleState } from '~/utils/itemAvailability'

const route = useRoute()
const itemSlug = computed(() => String(route.params.itemSlug))
const collectionSlug = computed(() => String(route.params.collectionSlug))

const { data, pending, error } = await useFetch<{ success: boolean; data: ItemDetail }>(`/api/items/${itemSlug.value}`)
const item = computed<ItemDetail | null>(() => data.value?.data ?? null)

const { data: collectionData } = await useFetch<{ success: boolean; data: CollectionWithItems }>(
  `/api/collections/${collectionSlug.value}`,
)
const collection = computed<CollectionWithItems | null>(() => collectionData.value?.data ?? null)

const seriesTotal = computed(() => collection.value?.items.length ?? 0)
const seriesIndex = computed(() => (collection.value?.items.findIndex((i) => i.slug === itemSlug.value) ?? -1) + 1)
const related = computed(() =>
  (collection.value?.items ?? []).filter((i) => i.slug !== itemSlug.value).slice(0, 3),
)
const seriesProgress = computed(() => collection.value?.progress ?? null)

const RARITY_LABEL: Record<string, string> = {
  COMMON: 'Común',
  RARE: 'Rara',
  EPIC: 'Épica',
  LEGENDARY: 'Legendaria',
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  AVAILABLE: 'Disponible',
  ON_DEMAND: 'A pedido',
  SOLD_OUT: 'Agotado',
  ARCHIVED: 'Archivado',
}

const specFields = computed<Array<{ label: string; value: string }>>(() => {
  const s = item.value?.spec
  if (!s) return []
  const fields = [
    { label: 'Escala / Altura', value: s.scale },
    { label: 'Material / Acabado', value: s.material },
    { label: 'Iluminación', value: s.lighting },
    { label: 'Base / Soporte', value: s.base },
  ]
  return fields.filter((f): f is { label: string; value: string } => !!f.value)
})

const itemColors = computed(() => item.value?.spec?.colors ?? [])

// Carrito (m21)
const cart = useCart()
const appConfig = useAppConfig()
const buyQty = ref(1)
const itemPrice = computed(() => item.value?.price ?? null)
const sale = computed(() => (item.value ? saleState(item.value.status, item.value.stock) : 'unavailable'))
const sellable = computed(() => (item.value ? isSellable(item.value.status, item.value.stock) : false))
const canBuy = computed(() => sellable.value && itemPrice.value != null)
const inCart = computed(() => (item.value ? cart.has(item.value.id) : false))
const whatsappLink = computed(() => {
  const number = String(appConfig.volt.whatsapp || '').replace(/\D/g, '')
  if (!number || !item.value) return ''
  const text = `Hola, quiero consultar por: ${item.value.name} (${item.value.collection.name}) ${canonical.value}`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
})

function changeQty(delta: number) {
  buyQty.value = Math.min(CART_MAX_QTY, Math.max(1, buyQty.value + delta))
}

// Color al comprar: con 2+ colores el cliente elige uno para todas las
// unidades o reparte cantidades por color (cada color = una línea del carrito).
const needsColor = computed(() => itemColors.value.length > 1)
const colorMode = ref<'single' | 'split'>('single')
const pickedColor = ref<string | null>(null)
const splitQty = ref<Record<string, number>>({})
const splitTotal = computed(() => Object.values(splitQty.value).reduce((acc, n) => acc + n, 0))
const canAdd = computed(() => {
  if (!needsColor.value) return true
  return colorMode.value === 'single' ? !!pickedColor.value : splitTotal.value > 0
})

function changeSplit(name: string, delta: number) {
  const next = Math.min(CART_MAX_QTY, Math.max(0, (splitQty.value[name] ?? 0) + delta))
  splitQty.value = { ...splitQty.value, [name]: next }
}

function addToCart() {
  const it = item.value
  if (!it || itemPrice.value == null || !canAdd.value) return
  const base = {
    itemId: it.id,
    slug: it.slug,
    collectionSlug: collectionSlug.value,
    name: it.name,
    collectionName: it.collection.name,
    price: itemPrice.value,
    imageUrl: it.mainImage?.url ?? it.files[0]?.url ?? null,
  }
  const added: string[] = []
  if (needsColor.value && colorMode.value === 'split') {
    for (const c of itemColors.value) {
      const qty = splitQty.value[c.name] ?? 0
      if (qty > 0) {
        cart.add({ ...base, color: { ...c } }, qty)
        added.push(`${qty} ${c.name}`)
      }
    }
    splitQty.value = {}
  } else {
    const color = needsColor.value
      ? itemColors.value.find((c) => c.name === pickedColor.value) ?? null
      : itemColors.value[0] ?? null
    cart.add({ ...base, color: color ? { ...color } : null }, buyQty.value)
    added.push(color ? `${buyQty.value} ${color.name}` : `${buyQty.value}`)
  }
  toast.add({
    title: 'Agregado al carrito',
    description: `${it.name}: ${added.join(', ')}`,
    icon: 'i-lucide-shopping-cart',
    color: 'primary',
    actions: [{ label: 'Ver carrito', to: '/cart', color: 'neutral', variant: 'subtle' }],
  })
  buyQty.value = 1
}

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/collections/${collectionSlug.value}/${itemSlug.value}`)
const metaDesc = computed(() => metaDescription(item.value?.description, 'Pieza de colección de Volt Vault.'))

useSeoMeta({
  title: () => (item.value?.name || 'Item') + ' — Volt Vault',
  description: metaDesc,
  ogTitle: () => item.value?.name || 'Item',
  ogDescription: metaDesc,
  ogType: 'article',
  ogUrl: canonical,
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: canonical }] })

defineOgImage('VoltVaultCollection', {
  name: computed(() => item.value?.name ?? 'Item'),
  itemCount: computed(() => item.value?.collection ? seriesTotal.value : 0),
})

const { isAuthenticated } = useAuthUser()
const { busy, toggle } = useCollectItem()
const { busy: wishlistBusy, toggle: toggleWishlist } = useWishlistItem()
const toast = useToast()

const collected = ref(item.value?.collected ?? false)
const celebrate = ref(false)
const wishlisted = ref(item.value?.wishlisted ?? false)
const wishlistCount = ref(item.value?.wishlistCount ?? 0)

const stockMeter = computed(() => {
  if (sale.value !== 'in_stock') return 0
  const stock = item.value?.stock ?? 0
  if (stock <= 0) return 0
  if (stock >= 10) return 100
  return Math.round((stock / 10) * 100)
})

async function onWishlist() {
  if (!item.value) return
  const was = wishlisted.value
  const ok = await toggleWishlist(item.value.id, was)
  if (!ok) return
  wishlisted.value = !was
  wishlistCount.value += was ? -1 : 1
}

async function checkCollectionCompleted() {
  try {
    const res = await $fetch<{ data: { progress?: { percent: number } | null } }>(
      `/api/collections/${collectionSlug.value}`,
    )
    if (res.data.progress?.percent === 100) {
      toast.add({
        title: '¡Colección completada!',
        description: 'Has conseguido todos los items de esta colección.',
        icon: 'i-lucide-trophy',
        color: 'primary',
        duration: 6000,
      })
    }
  } catch {
    // El logro es opcional: si falla la comprobación no rompemos la acción.
  }
}

async function onToggle() {
  if (!item.value) return
  const wasCollected = collected.value
  const game = await toggle(item.value.id, wasCollected)
  if (!game) return
  collected.value = !wasCollected
  if (!wasCollected) {
    celebrate.value = true
    setTimeout(() => { celebrate.value = false }, 800)
    toast.add({
      title: '¡Conseguido!',
      description: `${item.value.name} · +${xpForRarity(item.value.rarity)} XP`,
      icon: 'i-lucide-check-check',
      color: 'success',
    })
    if (game.unlockedKeys.length) {
      toast.add({
        title: '¡Insignia desbloqueada!',
        description: 'Revisa tu bóveda personal para verla.',
        icon: 'i-lucide-award',
        color: 'primary',
        duration: 6000,
      })
    }
    await checkCollectionCompleted()
  }
}
</script>

<template>
  <div v-if="item">
    <UContainer class="py-8 pb-28 lg:pb-10">
      <!-- Breadcrumb -->
      <NuxtLink
        :to="`/collections/${collectionSlug}`"
        class="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-default"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4 transition-transform group-hover:-translate-x-0.5" />
        {{ item.collection.name }}
      </NuxtLink>

      <div class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <!-- Gallery -->
        <div class="lg:col-span-7">
          <ItemGallery :files="item.files" />
        </div>

        <!-- Details -->
        <div class="flex flex-col gap-5 lg:col-span-5">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="item.status" />
            <RarityBadge :rarity="item.rarity" />
            <span v-if="seriesIndex > 0" class="label-caps rounded-full bg-muted px-3 py-1 text-muted">
              Item {{ String(seriesIndex).padStart(2, '0') }} de {{ seriesTotal }}
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <h1 class="font-display text-headline font-bold tracking-tight">{{ item.name }}</h1>
            <NuxtLink :to="`/collections/${collectionSlug}`" class="text-sm text-volt hover:underline">
              {{ item.collection.name }}
            </NuxtLink>
          </div>

          <!-- Compra (m21) -->
          <div class="flex flex-col gap-4 rounded-2xl border border-default bg-muted p-4">
            <div class="flex items-end justify-between gap-3">
              <div class="flex flex-col">
                <span class="label-caps text-muted">Precio</span>
                <template v-if="sellable">
                  <span v-if="itemPrice != null" class="font-display text-3xl font-black tabular-nums">{{ formatBs(itemPrice) }}</span>
                  <span v-else class="font-display text-xl font-bold">Indefinido</span>
                </template>
                <span v-else class="font-display text-xl font-bold">{{ sale === 'sold_out' ? 'Agotado' : 'No disponible' }}</span>
              </div>
              <span class="text-right text-xs text-muted">Pago por QR · Envíos a todo el país<br>(costo adicional)</span>
            </div>

            <p v-if="sale === 'on_demand'" class="-mt-1 flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-clock" class="size-4 shrink-0 text-volt-blue" />
              Pieza a pedido: se crea al confirmar el pago.
            </p>
            <!-- Color al comprar -->
            <p v-if="canBuy && itemColors.length === 1" class="flex items-center gap-2 text-sm">
              <span class="size-4 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: itemColors[0]!.hex }" />
              Color: <strong>{{ itemColors[0]!.name }}</strong>
            </p>
            <div v-if="canBuy && needsColor" class="flex flex-col gap-3 rounded-xl border border-default bg-elevated p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-semibold">Elige el color</span>
                <div class="inline-flex rounded-full border border-default bg-muted p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    class="rounded-full px-3 py-1 transition"
                    :class="colorMode === 'single' ? 'bg-primary text-inverted' : 'text-muted hover:text-highlighted'"
                    @click="colorMode = 'single'"
                  >
                    Un color para todos
                  </button>
                  <button
                    type="button"
                    class="rounded-full px-3 py-1 transition"
                    :class="colorMode === 'split' ? 'bg-primary text-inverted' : 'text-muted hover:text-highlighted'"
                    @click="colorMode = 'split'"
                  >
                    Repartir por color
                  </button>
                </div>
              </div>
              <div v-if="colorMode === 'single'" class="flex flex-wrap gap-2">
                <button
                  v-for="c in itemColors"
                  :key="c.name"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
                  :class="pickedColor === c.name ? 'border-primary bg-primary/10 text-highlighted' : 'border-default text-muted hover:border-accented'"
                  :aria-pressed="pickedColor === c.name"
                  @click="pickedColor = c.name"
                >
                  <span class="size-3.5 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: c.hex }" />
                  {{ c.name }}
                  <UIcon v-if="pickedColor === c.name" name="i-lucide-check" class="size-3.5 text-primary" />
                </button>
              </div>
              <ul v-else class="flex flex-col gap-1.5">
                <li v-for="c in itemColors" :key="c.name" class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-2 text-sm">
                    <span class="size-3.5 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: c.hex }" />
                    {{ c.name }}
                  </span>
                  <div class="flex items-center rounded-full border border-default bg-muted">
                    <UButton icon="i-lucide-minus" color="neutral" variant="ghost" size="xs" :aria-label="`Menos ${c.name}`" :disabled="!splitQty[c.name]" @click="changeSplit(c.name, -1)" />
                    <span class="w-6 text-center font-display text-sm font-bold tabular-nums">{{ splitQty[c.name] ?? 0 }}</span>
                    <UButton icon="i-lucide-plus" color="neutral" variant="ghost" size="xs" :aria-label="`Más ${c.name}`" @click="changeSplit(c.name, 1)" />
                  </div>
                </li>
                <li class="text-right text-xs text-muted">Total: {{ splitTotal }} unidad(es)</li>
              </ul>
            </div>
            <div v-if="canBuy" class="flex gap-3">
              <div v-if="!(needsColor && colorMode === 'split')" class="flex items-center rounded-full border border-default bg-elevated">
                <UButton icon="i-lucide-minus" color="neutral" variant="ghost" aria-label="Menos" :disabled="buyQty <= 1" @click="changeQty(-1)" />
                <span class="w-8 text-center font-display font-bold tabular-nums">{{ buyQty }}</span>
                <UButton icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="Más" :disabled="buyQty >= CART_MAX_QTY" @click="changeQty(1)" />
              </div>
              <UButton block size="lg" icon="i-lucide-shopping-cart" class="flex-1" :disabled="!canAdd" @click="addToCart">
                {{ canAdd ? 'Agregar al carrito' : (colorMode === 'single' ? 'Elige un color' : 'Indica cuántos de cada color') }}
              </UButton>
            </div>
            <UButton v-if="inCart" to="/cart" block color="neutral" variant="subtle" icon="i-lucide-arrow-right" trailing>
              Ver carrito ({{ cart.count.value }})
            </UButton>
            <UButton
              v-if="!canBuy && whatsappLink"
              :to="whatsappLink"
              target="_blank"
              block
              size="lg"
              color="neutral"
              variant="subtle"
              icon="i-lucide-message-circle"
            >
              Consultar por WhatsApp
            </UButton>
            <p v-else-if="!canBuy" class="text-sm text-muted">
              {{ sellable
                ? 'Esta pieza aún no tiene precio definido. Escríbenos por nuestras redes para cotizarla.'
                : 'Esta pieza no está disponible por ahora. Escríbenos por nuestras redes si te interesa.' }}
            </p>
          </div>

          <!-- Availability -->
          <div class="flex flex-col gap-2 rounded-2xl border border-default bg-muted p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-bolt" class="size-4 text-volt" />
                <span class="font-display text-sm font-semibold">Disponibilidad en almacén</span>
              </div>
              <StockIndicator :stock="item.stock" :status="item.status" />
            </div>
            <p v-if="sale === 'on_demand'" class="text-xs text-muted">Se crea a pedido: no depende del stock.</p>
            <div v-else class="h-2 w-full overflow-hidden rounded-full bg-default p-0.5">
              <div
                class="h-full rounded-full bg-gradient-to-r from-volt to-gold transition-[width] duration-700"
                :style="{ width: `${stockMeter}%` }"
              />
            </div>
          </div>

          <!-- Social proof -->
          <div class="grid grid-cols-2 gap-3 rounded-2xl border border-default bg-muted p-4">
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center rounded-full bg-volt/15 text-volt">
                <UIcon name="i-lucide-users" class="size-5" />
              </div>
              <div class="flex flex-col">
                <span class="font-display text-lg font-bold tabular-nums">{{ item.collectedCount ?? 0 }}</span>
                <span class="text-xs text-muted">lo tienen</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                <UIcon name="i-lucide-heart" class="size-5" />
              </div>
              <div class="flex flex-col">
                <span class="font-display text-lg font-bold tabular-nums">{{ wishlistCount }}</span>
                <span class="text-xs text-muted">lo quieren</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="isAuthenticated" class="flex flex-col gap-3">
            <div class="relative flex flex-col gap-3 sm:flex-row">
              <div class="relative flex-1">
                <CollectedBurst v-if="celebrate" />
                <UButton
                  v-if="!collected"
                  block
                  size="lg"
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-package"
                  :loading="busy"
                  :disabled="busy"
                  @click="onToggle"
                >
                  Conseguir
                </UButton>
                <UButton
                  v-else
                  block
                  size="lg"
                  color="success"
                  icon="i-lucide-check-check"
                  :class="{ 'animate-pop': celebrate }"
                  :loading="busy"
                  :disabled="busy"
                  @click="onToggle"
                >
                  Conseguido
                </UButton>
              </div>
              <UButton
                size="lg"
                :color="wishlisted ? 'error' : 'neutral'"
                :variant="wishlisted ? 'solid' : 'subtle'"
                :icon="wishlisted ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
                :loading="wishlistBusy"
                :disabled="wishlistBusy"
                @click="onWishlist"
              >
                {{ wishlisted ? 'En mi lista' : 'Lo quiero' }}
              </UButton>
            </div>

            <!-- Series progress -->
            <div v-if="seriesProgress" class="flex flex-col gap-1.5 rounded-2xl border border-default bg-muted p-4">
              <div class="flex items-center justify-between">
                <span class="label-caps text-muted">Progreso de la colección</span>
                <span class="font-display text-sm font-bold tabular-nums text-gold">
                  {{ seriesProgress.collected }} / {{ seriesProgress.total }} ({{ seriesProgress.percent }}%)
                </span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-default">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-volt via-gold to-volt transition-[width] duration-700"
                  :style="{ width: `${seriesProgress.percent}%` }"
                />
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col gap-3">
            <UButton to="/login" block size="lg" color="neutral" variant="subtle" icon="i-lucide-log-in">
              Inicia sesión para conseguir esta pieza
            </UButton>
            <UButton to="/login" block size="lg" color="neutral" variant="subtle" icon="i-lucide-bookmark">
              Lo quiero
            </UButton>
          </div>

          <!-- Ficha técnica -->
          <div class="flex flex-col gap-4 rounded-2xl border border-default bg-muted p-5">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-list" class="size-5 text-gold" />
              <span class="font-display font-bold">Ficha técnica</span>
            </div>
            <div v-if="itemColors.length" class="flex flex-col gap-2">
              <span class="label-caps text-muted">Colores disponibles</span>
              <ul class="flex flex-wrap gap-2">
                <li
                  v-for="c in itemColors"
                  :key="c.name"
                  class="inline-flex items-center gap-1.5 rounded-full border border-default bg-elevated px-2.5 py-1 text-xs font-semibold"
                >
                  <span class="size-3.5 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: c.hex }" />
                  {{ c.name }}
                </li>
              </ul>
            </div>
            <dl v-if="specFields.length" class="grid grid-cols-2 gap-3">
              <div v-for="field in specFields" :key="field.label" class="flex flex-col rounded-xl border border-default bg-elevated p-3">
                <dt class="label-caps text-muted">{{ field.label }}</dt>
                <dd class="mt-1 font-display text-sm font-semibold">{{ field.value }}</dd>
              </div>
            </dl>
            <dl v-else class="grid grid-cols-2 gap-3">
              <div class="flex flex-col rounded-xl border border-default bg-elevated p-3">
                <dt class="label-caps text-muted">Colección</dt>
                <dd class="mt-1 font-display text-sm font-semibold">{{ item.collection.name }}</dd>
              </div>
              <div class="flex flex-col rounded-xl border border-default bg-elevated p-3">
                <dt class="label-caps text-muted">Rareza</dt>
                <dd class="mt-1 font-display text-sm font-semibold">{{ RARITY_LABEL[item.rarity] ?? item.rarity }}</dd>
              </div>
              <div class="flex flex-col rounded-xl border border-default bg-elevated p-3">
                <dt class="label-caps text-muted">Estado</dt>
                <dd class="mt-1 font-display text-sm font-semibold">{{ STATUS_LABEL[item.status] ?? item.status }}</dd>
              </div>
              <div class="flex flex-col rounded-xl border border-default bg-elevated p-3">
                <dt class="label-caps text-muted">Unidades</dt>
                <dd class="mt-1 font-display text-sm font-semibold tabular-nums">{{ item.stock }}</dd>
              </div>
            </dl>
            <div v-if="item.description">
              <span class="label-caps text-muted">Manifiesto</span>
              <MarkdownContent :source="item.description" class="mt-1" />
            </div>
          </div>
        </div>
      </div>

      <!-- Related items -->
      <section v-if="related.length" class="mt-14">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Ecosistema completo"
            title="Otros coleccionables de esta serie"
          />
          <NuxtLink
            :to="`/collections/${collectionSlug}`"
            class="group inline-flex items-center gap-1.5 text-sm text-volt transition-colors hover:text-gold"
          >
            Explorar la colección
            <UIcon name="i-lucide-arrow-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </NuxtLink>
        </div>
        <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ItemCard
            v-for="rel in related"
            :key="rel.id"
            :item="rel"
            :collection-slug="collectionSlug"
          />
        </div>
      </section>
    </UContainer>

    <!-- Sticky mobile CTA -->
    <div class="fixed inset-x-0 bottom-0 z-20 border-t border-default bg-default/95 p-3 backdrop-blur lg:hidden">
      <div class="flex items-center gap-2">
        <template v-if="isAuthenticated">
          <UButton
            class="flex-1"
            :color="collected ? 'success' : 'secondary'"
            :icon="collected ? 'i-lucide-check-check' : 'i-lucide-package'"
            :loading="busy"
            :disabled="busy"
            @click="onToggle"
          >
            {{ collected ? 'Conseguido' : 'Conseguir' }}
          </UButton>
          <UButton
            :color="wishlisted ? 'error' : 'neutral'"
            :variant="wishlisted ? 'solid' : 'subtle'"
            icon="i-lucide-bookmark"
            :loading="wishlistBusy"
            :disabled="wishlistBusy"
            @click="onWishlist"
          >
            {{ wishlisted ? 'En mi lista' : 'Lo quiero' }}
          </UButton>
        </template>
        <UButton v-else to="/login" variant="subtle" icon="i-lucide-log-in" class="flex-1">
          Inicia sesión
        </UButton>
      </div>
    </div>
  </div>

  <div v-else class="py-10">
    <UContainer>
      <USkeleton v-if="pending" class="h-64 rounded-2xl" />
      <UAlert v-else-if="error" color="error" title="No se pudo cargar el item" />
      <UEmpty v-else title="Item no encontrado" />
    </UContainer>
  </div>
</template>
