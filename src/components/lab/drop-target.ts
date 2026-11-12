import type { Interaction, ItemDef } from '../../data/types'

export type DropLayer = 'item' | 'zone' | 'shelf'

export type DropData = {
  layer: DropLayer
  /** Stacking order among items; the higher one is on top. */
  order?: number
  /** The item this target stands for, when its id is not the item's own. */
  itemId?: string
}

export type DropCandidate = DropData & { id: string }

const RANK: Record<DropLayer, number> = { item: 2, zone: 1, shelf: 0 }

/**
 * Picks the drop target among everything under the pointer: item > zone >
 * shelf. `activeId` is the dragged item's id; its own targets are skipped.
 */
export function pickDropTarget(
  candidates: DropCandidate[],
  activeId: string,
): string | undefined {
  let best: DropCandidate | undefined
  for (const candidate of candidates) {
    if ((candidate.itemId ?? candidate.id) === activeId) continue
    if (!best || isAbove(candidate, best)) best = candidate
  }
  return best?.id
}

function isAbove(a: DropCandidate, b: DropCandidate): boolean {
  if (RANK[a.layer] !== RANK[b.layer]) return RANK[a.layer] > RANK[b.layer]
  return (a.order ?? 0) > (b.order ?? 0)
}

/**
 * The engine rejects every drop on an item that no interaction targets, so
 * such items should let drops through to whatever lies beneath them.
 */
export function isInteractionTarget(
  interactions: Interaction[],
  item: ItemDef,
): boolean {
  return interactions.some(
    (it) => it.target === item.id || it.target === item.kind,
  )
}
