import type { Experiment } from '../../data/types'

type Items = Record<string, { at: string }>

// Benda yang menempel (mis. termometer di labu) menutupi sebagian induknya,
// jadi pointer sering mengenai benda itu padahal siswa menuju induknya.
// Kalau benda yang dibawa tidak punya interaksi dengan benda yang menempel,
// tujuannya diteruskan ke induk (berulang sampai benda yang tidak menempel).
// Zona, rak, dan benda yang tidak menempel dikembalikan apa adanya.
export function dropTarget(
  exp: Experiment,
  items: Items,
  source: string,
  target: string,
): string {
  const kindOf = (id: string) => exp.items.find((i) => i.id === id)?.kind
  const sourceKind = kindOf(source)
  const fits = (id: string) =>
    exp.interactions.some(
      (i) =>
        i.source === sourceKind && (i.target === id || i.target === kindOf(id)),
    )

  let current = target
  const seen = new Set<string>()
  while (!seen.has(current)) {
    seen.add(current)
    const parent = items[current]?.at
    if (parent === undefined || !(parent in items) || fits(current)) break
    current = parent
  }
  return current
}
