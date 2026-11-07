import type { ItemColor } from '~/types'

/**
 * Colores de filamento más comunes en impresión 3D (PLA/PETG).
 * Se ofrecen como opciones rápidas en el admin; además se puede agregar un
 * color personalizado (nombre + hex). Ver docs/specs/m06-items.md.
 */
export const FILAMENT_COLORS: ItemColor[] = [
  { name: 'Blanco', hex: '#F5F5F5' },
  { name: 'Negro', hex: '#1A1A1A' },
  { name: 'Gris', hex: '#8A8A8A' },
  { name: 'Plata', hex: '#C0C0C0' },
  { name: 'Rojo', hex: '#D32F2F' },
  { name: 'Naranja', hex: '#F57C00' },
  { name: 'Amarillo', hex: '#FBC02D' },
  { name: 'Verde', hex: '#2E7D32' },
  { name: 'Verde lima', hex: '#9ACD32' },
  { name: 'Azul', hex: '#1565C0' },
  { name: 'Celeste', hex: '#4FC3F7' },
  { name: 'Morado', hex: '#7B1FA2' },
  { name: 'Rosado', hex: '#F48FB1' },
  { name: 'Fucsia', hex: '#D81B60' },
  { name: 'Marrón', hex: '#6D4C41' },
  { name: 'Beige', hex: '#D7C4A3' },
  { name: 'Dorado', hex: '#D4AF37' },
  { name: 'Cobre', hex: '#B87333' },
  { name: 'Transparente', hex: '#E3F2F7' },
  { name: 'Brilla en la oscuridad', hex: '#C6F68D' },
]

export const MAX_ITEM_COLORS = 40
const HEX_RE = /^#[0-9a-f]{6}$/i

/**
 * Limpia la lista de colores de un item: nombre recortado (máx. 40), hex
 * válido (#RRGGBB, en mayúsculas), sin repetidos por nombre y como máximo
 * MAX_ITEM_COLORS. Lo inválido se descarta en silencio.
 */
export function normalizeColors(input: unknown): ItemColor[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: ItemColor[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const name = String((raw as ItemColor).name ?? '').trim().slice(0, 40)
    const hex = String((raw as ItemColor).hex ?? '').trim()
    if (!name || !HEX_RE.test(hex)) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ name, hex: hex.toUpperCase() })
    if (out.length >= MAX_ITEM_COLORS) break
  }
  return out
}
