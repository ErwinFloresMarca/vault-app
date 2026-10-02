<script setup lang="ts">
import type { ApiKeyDto } from '~/types'
import { MCP_SCOPES, ADMIN_MCP_SCOPES } from '~/types'

useSeoMeta({ title: 'Configuración — Volt Vault' })

const { user } = useAuthUser()
const toast = useToast()

const { data, refresh } = await useFetch<{ success: boolean; data: ApiKeyDto[] }>('/api/me/api-keys', { key: 'me:api-keys' })
const keys = computed<ApiKeyDto[]>(() => data.value?.data ?? [])

const SCOPE_LABELS: Record<string, string> = {
  'catalog:read': 'Catálogo · leer',
  'catalog:write': 'Catálogo · escribir',
  'files:write': 'Archivos · escribir',
  'inventory:read': 'Inventario · leer',
  'inventory:write': 'Inventario · escribir',
  'personal:read': 'Mi colección · leer',
  'personal:write': 'Mi colección · escribir',
  'stats:read': 'Métricas admin',
  'users:read': 'Usuarios · leer',
  'users:write': 'Usuarios · escribir',
  'keys:read': 'Claves API · leer',
  'keys:write': 'Claves API · escribir',
}

const isAdmin = computed(() => user.value?.role === 'ADMIN')
const allowedScopes = computed(() => MCP_SCOPES.filter((s) => isAdmin.value || !ADMIN_MCP_SCOPES.includes(s)))

const form = reactive({
  name: '',
  scopes: ['catalog:read', 'personal:read'] as string[],
  expiresInDays: 0,
})
const creating = ref(false)
const formError = ref('')
const createdKey = ref<string | null>(null)

function toggleScope(scope: string, value: boolean) {
  if (value) {
    if (!form.scopes.includes(scope)) form.scopes.push(scope)
  } else {
    form.scopes = form.scopes.filter((s) => s !== scope)
  }
}

async function createKey() {
  formError.value = ''
  if (!form.name.trim()) {
    formError.value = 'Ponle un nombre a la clave'
    return
  }
  if (!form.scopes.length) {
    formError.value = 'Selecciona al menos un scope'
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ success: boolean; apiKey: ApiKeyDto; key: string }>('/api/me/api-keys', {
      method: 'POST',
      body: { name: form.name, scopes: form.scopes, expiresInDays: Number(form.expiresInDays) || undefined },
    })
    createdKey.value = res.key
    form.name = ''
    toast.add({ title: 'Clave creada', description: 'Cópiala ahora: no se volverá a mostrar.', icon: 'i-lucide-key', color: 'success' })
    await refresh()
  } catch (e) {
    formError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Error al crear la clave'
  } finally {
    creating.value = false
  }
}

async function copyKey() {
  if (!createdKey.value) return
  try {
    await navigator.clipboard.writeText(createdKey.value)
    toast.add({ title: 'Copiada', color: 'success', icon: 'i-lucide-check' })
  } catch {
    // si el navegador bloquea el portapapeles, el usuario puede seleccionarla
  }
}

async function revokeKey(key: ApiKeyDto) {
  await $fetch(`/api/me/api-keys/${key.id}`, { method: 'DELETE' })
  if (createdKey.value === key.name) createdKey.value = null
  await refresh()
  toast.add({ title: 'Clave revocada', color: 'neutral', icon: 'i-lucide-ban' })
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es', { timeZone: 'UTC' })
}

function keyState(key: ApiKeyDto) {
  if (key.revokedAt) return { label: 'Revocada', class: 'text-muted' }
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) return { label: 'Expirada', class: 'text-warning' }
  return { label: 'Activa', class: 'text-success' }
}
</script>

<template>
  <UContainer class="py-10 lg:py-14">
    <SectionHeading
      eyebrow="Ajustes de cuenta"
      title="Configuración"
      description="Gestiona las claves de API para conectar asistentes IA (MCP) a tu cuenta de Volt Vault."
    />

    <!-- Create key -->
    <div class="mt-8 rounded-2xl border border-default bg-muted p-5 lg:p-6">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-key-round" class="size-5 text-gold" />
        <h2 class="font-display text-lg font-bold">Nueva clave de API (MCP)</h2>
      </div>
      <p class="mt-1 text-sm text-muted">
        La clave se muestra <strong>una sola vez</strong>. Úsala como <code>Authorization: Bearer vvk_…</code> en
        <code>/mcp</code>.
      </p>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UFormField label="Nombre">
          <UInput v-model="form.name" placeholder="Ej.: Claude Desktop" class="w-full" />
        </UFormField>
        <UFormField label="Expiración">
          <USelect
            v-model="form.expiresInDays"
            :items="[
              { label: 'Sin expiración', value: 0 },
              { label: '30 días', value: 30 },
              { label: '90 días', value: 90 },
              { label: '365 días', value: 365 },
            ]"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="mt-4">
        <p class="label-caps text-muted">Permisos (scopes)</p>
        <div class="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          <UCheckbox
            v-for="scope in allowedScopes"
            :key="scope"
            :model-value="form.scopes.includes(scope)"
            :label="SCOPE_LABELS[scope] ?? scope"
            @update:model-value="(v) => toggleScope(scope, !!v)"
          />
        </div>
        <p v-if="!isAdmin" class="mt-2 text-xs text-muted">
          Los scopes de administración (métricas y usuarios) solo están disponibles para cuentas ADMIN.
        </p>
      </div>

      <div v-if="formError" class="mt-3 text-sm text-error">{{ formError }}</div>

      <div class="mt-5 flex items-center justify-between gap-3">
        <span class="text-xs text-muted">{{ form.scopes.length }} scope(s) seleccionado(s)</span>
        <UButton :loading="creating" icon="i-lucide-plus" @click="createKey">Crear clave</UButton>
      </div>

      <!-- Key shown once -->
      <div v-if="createdKey" class="mt-5 rounded-xl border border-gold/40 bg-gold/5 p-4">
        <div class="flex items-center gap-2 text-gold">
          <UIcon name="i-lucide-triangle-alert" class="size-5" />
          <span class="font-display font-semibold">Cópiala ahora: no se volverá a mostrar</span>
        </div>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code class="min-w-0 flex-1 truncate rounded-lg border border-default bg-default px-3 py-2 font-mono text-sm">{{ createdKey }}</code>
          <UButton icon="i-lucide-copy" color="neutral" variant="subtle" @click="copyKey">Copiar</UButton>
        </div>
      </div>
    </div>

    <!-- Existing keys -->
    <section class="mt-10">
      <h2 class="font-display text-headline font-bold">Mis claves</h2>

      <UEmpty
        v-if="!keys.length"
        class="mt-4"
        title="Aún no tienes claves"
        description="Crea una arriba para conectar un asistente IA."
      />

      <div v-else class="mt-4 flex flex-col gap-3">
        <div
          v-for="key in keys"
          :key="key.id"
          class="rounded-2xl border border-default bg-muted p-4"
          :class="key.revokedAt ? 'opacity-60' : ''"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-display font-semibold">{{ key.name }}</span>
                <span class="label-caps" :class="keyState(key).class">{{ keyState(key).label }}</span>
              </div>
              <span class="font-mono text-xs text-muted">{{ key.prefix }}…</span>
            </div>
            <UModal :title="`Revocar «${key.name}»?`" description="La clave dejará de funcionar de inmediato.">
              <UButton
                icon="i-lucide-ban"
                color="error"
                variant="subtle"
                size="sm"
                :disabled="!!key.revokedAt"
              >
                Revocar
              </UButton>
              <template #footer="{ close }">
                <UButton color="neutral" variant="outline" label="Cancelar" @click="close" />
                <UButton color="error" label="Revocar" @click="revokeKey(key); close()" />
              </template>
            </UModal>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="scope in key.scopes"
              :key="scope"
              class="label-caps rounded-full bg-elevated px-2 py-0.5 text-muted"
            >
              {{ SCOPE_LABELS[scope] ?? scope }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
            <span>Creada: {{ formatDate(key.createdAt) }}</span>
            <span>Último uso: {{ formatDate(key.lastUsedAt) }}</span>
            <span>Expira: {{ key.expiresAt ? formatDate(key.expiresAt) : 'nunca' }}</span>
          </div>
        </div>
      </div>
    </section>
  </UContainer>
</template>
