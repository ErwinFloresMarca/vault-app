<script setup lang="ts">
import type { DeliveryMethod } from '~/types'
import { CART_MAX_QTY, cartLineKey, formatBs } from '~/composables/useCart'

useSeoMeta({
  title: 'Carrito — Volt Vault',
  robots: 'noindex',
})

const cart = useCart()
const { user } = useAuthUser()
const appConfig = useAppConfig()

// Se muestra el carrito solo en el cliente (vive en el navegador)
const ready = ref(false)
onMounted(() => { ready.value = true })

const form = reactive({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerCity: '',
  deliveryMethod: 'PICKUP' as DeliveryMethod,
  address: '',
  notes: '',
  website: '', // trampa anti-bots (oculto)
})
watch(user, (u) => {
  if (u && !form.customerName) form.customerName = u.name
  if (u && !form.customerEmail) form.customerEmail = u.email
}, { immediate: true })

const deliveryOptions = [
  { label: 'Entrega en la ciudad / retiro', value: 'PICKUP', description: 'Coordinamos el punto de entrega contigo.' },
  { label: 'Envío departamental', value: 'SHIPPING', description: 'Costo adicional según destino. Te enviamos fotos del empaque y el comprobante.' },
]

const sending = ref(false)
const errorMsg = ref('')
const placed = ref<{ code: string; customerEmail: string; subtotal: number; deliveryMethod: DeliveryMethod } | null>(null)

const whatsappLink = computed(() => {
  const number = String(appConfig.volt.whatsapp || '').replace(/\D/g, '')
  if (!number || !placed.value) return ''
  const text = `Hola, hice el pedido ${placed.value.code} en Volt Vault a nombre de ${form.customerName}.`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
})

async function submit() {
  errorMsg.value = ''
  if (!cart.lines.value.length) return
  sending.value = true
  try {
    const res = await $fetch<{ success: boolean; data: { code: string; customerEmail: string; subtotal: number; deliveryMethod: DeliveryMethod } }>('/api/orders', {
      method: 'POST',
      body: {
        ...form,
        items: cart.lines.value.map((l) => ({ itemId: l.itemId, quantity: l.quantity, color: l.color?.name ?? null })),
      },
    })
    placed.value = res.data
    cart.clear()
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    errorMsg.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'No se pudo enviar el pedido. Intenta de nuevo.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
    <!-- Pedido enviado -->
    <section v-if="placed" class="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl border border-default bg-muted p-8 text-center">
      <div class="flex size-16 items-center justify-center rounded-full bg-primary text-inverted">
        <UIcon name="i-lucide-check" class="size-9" />
      </div>
      <div>
        <p class="label-caps text-primary">Pedido realizado</p>
        <h1 class="mt-1 font-display text-3xl font-black tracking-tight">¡Tu pedido fue recibido!</h1>
      </div>
      <p class="text-muted">
        Te enviamos un correo a <strong class="text-default">{{ placed.customerEmail }}</strong> con el detalle y el
        <strong class="text-default">código único</strong> de tu pedido. Si no lo ves, revisa la carpeta de spam o promociones.
      </p>
      <ol class="flex w-full flex-col gap-3 text-left text-sm">
        <li class="flex gap-3 rounded-xl bg-elevated p-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted">1</span>
          <span><strong>Pedido realizado:</strong> realiza el pago por <strong>QR</strong> según las indicaciones del correo e indica tu código.</span>
        </li>
        <li class="flex gap-3 rounded-xl bg-elevated p-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted">2</span>
          <span><strong>Pedido confirmado:</strong> al verificar tu pago te enviamos un correo de confirmación y comenzamos la producción.</span>
        </li>
        <li v-if="placed.deliveryMethod === 'SHIPPING'" class="flex gap-3 rounded-xl bg-elevated p-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-inverted">3</span>
          <span>Para el envío departamental te mandamos fotos del empaque y el comprobante de envío.</span>
        </li>
      </ol>
      <div class="flex flex-wrap justify-center gap-3">
        <UButton v-if="whatsappLink" :to="whatsappLink" target="_blank" size="lg" icon="i-lucide-message-circle">
          Escribir por WhatsApp
        </UButton>
        <UButton to="/collections" size="lg" color="neutral" variant="subtle" icon="i-lucide-layers">
          Seguir viendo colecciones
        </UButton>
      </div>
    </section>

    <template v-else>
      <header class="mb-6 flex items-end justify-between gap-4">
        <div>
          <p class="label-caps text-primary">Tu pedido</p>
          <h1 class="font-display text-3xl font-extrabold tracking-tight">Carrito</h1>
        </div>
        <UButton v-if="ready && cart.lines.value.length" color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="cart.clear()">
          Vaciar
        </UButton>
      </header>

      <div v-if="!ready" class="grid gap-6 lg:grid-cols-12">
        <USkeleton class="h-64 rounded-xl lg:col-span-7" />
        <USkeleton class="h-96 rounded-xl lg:col-span-5" />
      </div>

      <UEmpty
        v-else-if="!cart.lines.value.length"
        icon="i-lucide-shopping-cart"
        title="Tu carrito está vacío"
        description="Explora las colecciones y agrega las figuras que quieras."
        :actions="[{ label: 'Ver colecciones', to: '/collections', icon: 'i-lucide-layers' }]"
      />

      <div v-else class="grid items-start gap-6 lg:grid-cols-12">
        <!-- Productos -->
        <section class="flex flex-col gap-3 lg:col-span-7">
          <article
            v-for="line in cart.lines.value"
            :key="cartLineKey(line)"
            class="flex gap-4 rounded-xl border border-default bg-muted p-3"
          >
            <NuxtLink :to="`/collections/${line.collectionSlug}/${line.slug}`" class="size-24 shrink-0 overflow-hidden rounded-lg bg-elevated">
              <AppImage v-if="line.imageUrl" :src="line.imageUrl" :alt="line.name" class="h-full w-full" />
            </NuxtLink>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <NuxtLink :to="`/collections/${line.collectionSlug}/${line.slug}`" class="line-clamp-1 font-display font-bold hover:text-primary">{{ line.name }}</NuxtLink>
                  <p class="line-clamp-1 text-xs text-muted">{{ line.collectionName }}</p>
                  <p v-if="line.color" class="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span class="size-3 shrink-0 rounded-full border border-accented" :style="{ backgroundColor: line.color.hex }" />
                    Color: <strong>{{ line.color.name }}</strong>
                  </p>
                </div>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" :aria-label="`Quitar ${line.name}`" @click="cart.remove(cartLineKey(line))" />
              </div>
              <div class="mt-auto flex items-center justify-between gap-2">
                <div class="flex items-center rounded-full border border-default bg-elevated">
                  <UButton icon="i-lucide-minus" color="neutral" variant="ghost" size="sm" aria-label="Menos" @click="cart.setQuantity(cartLineKey(line), line.quantity - 1)" />
                  <span class="w-7 text-center font-display text-sm font-bold tabular-nums">{{ line.quantity }}</span>
                  <UButton icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" aria-label="Más" :disabled="line.quantity >= CART_MAX_QTY" @click="cart.setQuantity(cartLineKey(line), line.quantity + 1)" />
                </div>
                <div class="text-right">
                  <p class="font-display font-extrabold tabular-nums">{{ formatBs(line.price * line.quantity) }}</p>
                  <p v-if="line.quantity > 1" class="text-xs text-muted">{{ formatBs(line.price) }} c/u</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <!-- Resumen y datos -->
        <section class="flex flex-col gap-4 rounded-xl border border-default bg-muted p-5 lg:sticky lg:top-20 lg:col-span-5">
          <div class="flex items-center justify-between">
            <span class="text-muted">Productos ({{ cart.count.value }})</span>
            <span class="font-display text-2xl font-black tabular-nums">{{ formatBs(cart.subtotal.value) }}</span>
          </div>
          <p class="-mt-2 text-xs text-muted">Pago por QR. El envío departamental tiene costo adicional y te lo confirmamos por correo o WhatsApp.</p>

          <USeparator />

          <form class="flex flex-col gap-3" @submit.prevent="submit">
            <UFormField label="Nombre completo" required>
              <UInput v-model="form.customerName" autocomplete="name" class="w-full" />
            </UFormField>
            <UFormField label="Correo electrónico" required help="Aquí te enviaremos el código de tu pedido y su confirmación.">
              <UInput v-model="form.customerEmail" type="email" autocomplete="email" placeholder="tucorreo@gmail.com" class="w-full" />
            </UFormField>
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField label="WhatsApp (opcional)">
                <UInput v-model="form.customerPhone" type="tel" autocomplete="tel" placeholder="7XXXXXXX" class="w-full" />
              </UFormField>
              <UFormField label="Ciudad" required>
                <UInput v-model="form.customerCity" autocomplete="address-level2" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Entrega">
              <URadioGroup v-model="form.deliveryMethod" :items="deliveryOptions" variant="card" />
            </UFormField>
            <UFormField v-if="form.deliveryMethod === 'SHIPPING'" label="Dirección o agencia de destino" required>
              <UInput v-model="form.address" class="w-full" placeholder="Ciudad, agencia o dirección" />
            </UFormField>
            <UFormField label="Notas (opcional)">
              <UTextarea v-model="form.notes" :rows="2" class="w-full" placeholder="Colores, fecha que lo necesitas, etc." />
            </UFormField>
            <!-- Campo trampa anti-bots -->
            <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

            <UAlert v-if="errorMsg" color="error" variant="subtle" :description="errorMsg" icon="i-lucide-circle-alert" />

            <UButton type="submit" size="xl" block :loading="sending" icon="i-lucide-send" class="mt-1">
              Enviar pedido
            </UButton>
            <p class="text-center text-xs text-muted">
              Al enviar aceptas los <NuxtLink to="/terms" class="underline hover:text-default">Términos</NuxtLink> y la
              <NuxtLink to="/privacy" class="underline hover:text-default">Política de privacidad</NuxtLink>.
              Para comprar debes ser mayor de 18 años o contar con autorización de tu padre, madre o tutor.
            </p>
          </form>
        </section>
      </div>
    </template>
  </div>
</template>
