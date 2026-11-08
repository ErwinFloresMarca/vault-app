/**
 * Nombre de una línea de pedido con su color (si eligió uno).
 * Se usa en correos, Excel y el panel admin: "Conejo básico — color Azul".
 */
export function orderItemLabel(i: { name: string; colorName?: string | null }): string {
  return i.colorName ? `${i.name} — color ${i.colorName}` : i.name
}
