import type { MakerworldCreator } from '~/types'

/**
 * Cliente de la API interna de MakerWorld.
 *
 * MakerWorld no publica API oficial; estas rutas son las que usa su web
 * (`design-service`). Cloudflare puede devolver 403 en ráfagas, así que todas
 * las peticiones pasan por una cola serializada con throttling y backoff.
 */

const API_BASE = 'https://api.bambulab.com/v1/design-service'
const REQUEST_TIMEOUT_MS = 15_000
const REQUEST_DELAY_MS = 350
const RETRY_DELAYS_MS = [2_000, 6_000, 12_000]
const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_PAGES = 20 // 20 páginas × 50 = 1000 modelos como guarda dura
const PAGE_SIZE = 50
const MAX_IMAGES = 10

const HEADERS: Record<string, string> = {
  accept: 'application/json',
  origin: 'https://makerworld.com',
  referer: 'https://makerworld.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'X-BBL-Client-Type': 'web',
  'X-BBL-Client-Version': '00.00.00.01',
  'X-BBL-App-Source': 'makerworld',
  'X-BBL-Client-Name': 'MakerWorld',
}

const ALLOWED_IMAGE_HOSTS = new Set(['makerworld.bblmw.com'])

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const designCache = new Map<number, CacheEntry<MakerworldDesign>>()
const collectionCache = new Map<number, CacheEntry<MakerworldCollection>>()

let gate: Promise<unknown> = Promise.resolve()
let lastRequestAt = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Serializa las llamadas para no disparar el rate-limit de Cloudflare. */
function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = gate.then(fn, fn)
  gate = run.then(() => undefined, () => undefined)
  return run
}

async function throttle() {
  const wait = Math.max(0, lastRequestAt + REQUEST_DELAY_MS - Date.now())
  if (wait > 0) await sleep(wait)
}

async function fetchJson<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  return schedule(async () => {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      await throttle()

      let response: Response
      try {
        response = await fetch(url, {
          headers: HEADERS,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        lastRequestAt = Date.now()
      } catch {
        lastRequestAt = Date.now()
        if (attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt]!)
          continue
        }
        throw createError({
          statusCode: 504,
          statusMessage: 'MakerWorld no respondió a tiempo. Reintenta en unos minutos.',
        })
      }

      if (response.ok) {
        return (await response.json()) as T
      }

      if (response.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'MakerWorld no encontró el recurso (¿colección/modelo privado o eliminado?).',
        })
      }

      // Cloudflare devuelve 403 con HTML cuando detecta ráfagas.
      if (response.status === 403 || response.status === 429 || response.status >= 500) {
        if (attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt]!)
          continue
        }
        throw createError({
          statusCode: 502,
          statusMessage: 'MakerWorld bloqueó la petición (Cloudflare). Espera unos minutos y reintenta.',
        })
      }

      throw createError({
        statusCode: 502,
        statusMessage: `MakerWorld respondió con estado ${response.status}.`,
      })
    }

    throw createError({ statusCode: 502, statusMessage: 'No se pudo consultar MakerWorld.' })
  })
}

// ===== Parseo de URLs =====

export function parseCollectionId(input: string): number | null {
  const value = input.trim()
  const match = value.match(/\/collections\/(\d+)/) ?? value.match(/[?&]collectionId=(\d+)/)
  return match ? Number(match[1]) : null
}

export function parseModelId(input: string): number | null {
  const value = input.trim()
  if (/^\d+$/.test(value)) return Number(value)
  const match = value.match(/\/models\/(\d+)/) ?? value.match(/[?&]designId=(\d+)/)
  return match ? Number(match[1]) : null
}

export function canonicalModelUrl(id: number): string {
  return `https://makerworld.com/en/models/${id}`
}

/**
 * Normaliza una URL de imagen del CDN de MakerWorld y la sirve optimizada
 * (1200 px, WebP) para no hotlinkear originales de 4 MB.
 */
export function normalizeImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.has(url.hostname)) return null
    url.search = '?x-oss-process=image/resize,w_1200/format,webp'
    return url.toString()
  } catch {
    return null
  }
}

// ===== Normalización de textos =====

const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  mdash: '—',
  ndash: '–',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  deg: '°',
}

export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/figure)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, entity: string) => ENTITIES[entity.toLowerCase()] ?? match)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function buildImportedDescription(design: MakerworldDesign): string {
  const parts: string[] = []
  const body = htmlToText(design.summaryHtml)
  if (body) parts.push(body.slice(0, 3_000))

  const author = design.creator
    ? `${design.creator.name} (@${design.creator.handle})`
    : 'Autor desconocido'

  parts.push([
    '---',
    `- **Fuente:** [MakerWorld](${canonicalModelUrl(design.id)})`,
    `- **Autor:** ${author}`,
    `- **Licencia:** ${design.license ?? 'No especificada'} — verifica los términos antes de vender impresiones.`,
  ].join('\n'))

  return parts.join('\n\n')
}

// ===== Respuestas de la API =====

interface MakerworldCollectionResponse {
  id: number
  title?: string
  slug?: string
  description?: string
  cover?: string
  designCnt?: number
  creator?: { name?: string; handle?: string }
}

interface MakerworldDesignSummary {
  id: number
  title: string
  slug?: string
  cover?: string
  designCreator?: { name?: string; handle?: string }
}

interface MakerworldDesignResponse {
  id: number
  title: string
  slug?: string
  summary?: string
  coverUrl?: string
  license?: string
  designCreator?: { name?: string; handle?: string }
  instances?: Array<{ pictures?: Array<{ url?: string }> }>
}

export interface MakerworldCollection {
  id: number
  title: string
  description: string
  coverUrl: string | null
  total: number
  creator: MakerworldCreator | null
}

export interface MakerworldDesign {
  id: number
  title: string
  slug: string
  summaryHtml: string
  coverUrl: string | null
  imageUrls: string[]
  creator: MakerworldCreator | null
  license: string | null
}

export interface MakerworldCollectionPage {
  total: number
  hits: MakerworldDesignSummary[]
}

function toCreator(raw?: { name?: string; handle?: string } | null): MakerworldCreator | null {
  if (!raw?.name) return null
  return { name: raw.name, handle: raw.handle ?? raw.name }
}

// ===== API pública del servicio =====

export const makerworldService = {
  async getCollection(id: number): Promise<MakerworldCollection> {
    const cached = collectionCache.get(id)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const raw = await fetchJson<MakerworldCollectionResponse>(`/favorites/${id}`)
    const value: MakerworldCollection = {
      id: raw.id ?? id,
      title: (raw.title ?? '').trim() || `MakerWorld ${id}`,
      description: htmlToText(raw.description),
      coverUrl: normalizeImageUrl(raw.cover),
      total: raw.designCnt ?? 0,
      creator: toCreator(raw.creator),
    }

    collectionCache.set(id, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  },

  async listCollectionDesigns(id: number): Promise<MakerworldCollectionPage> {
    const hits: MakerworldDesignSummary[] = []
    let total = 0
    let offset = 0

    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await fetchJson<{ hits?: MakerworldDesignSummary[]; total?: number }>(
        `/favorites/${id}/designs`,
        { offset, limit: PAGE_SIZE },
      )
      total = response.total ?? total
      const pageHits = response.hits ?? []
      hits.push(...pageHits)
      offset += pageHits.length
      if (pageHits.length === 0 || offset >= total) break
    }

    return { total: total || hits.length, hits }
  },

  async getDesign(id: number): Promise<MakerworldDesign> {
    const cached = designCache.get(id)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const raw = await fetchJson<MakerworldDesignResponse>(`/design/${id}`)

    const imageUrls: string[] = []
    const candidates = [
      raw.coverUrl,
      ...(raw.instances ?? []).flatMap((instance) => (instance.pictures ?? []).map((picture) => picture.url)),
    ]
    for (const candidate of candidates) {
      const normalized = normalizeImageUrl(candidate)
      if (normalized && !imageUrls.includes(normalized)) imageUrls.push(normalized)
      if (imageUrls.length >= MAX_IMAGES) break
    }

    const value: MakerworldDesign = {
      id: raw.id ?? id,
      title: (raw.title ?? '').trim() || `MakerWorld ${id}`,
      slug: raw.slug?.trim() || '',
      summaryHtml: raw.summary ?? '',
      coverUrl: imageUrls[0] ?? null,
      imageUrls,
      creator: toCreator(raw.designCreator),
      license: raw.license?.trim() || null,
    }

    designCache.set(id, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  },
}
