import type { World } from '../data/types'
import type { Rect, SceneLayout } from './types'

/**
 * Where an item is drawn on the stage, or undefined when it cannot be placed.
 * Items keep their home size everywhere, so they are never stretched.
 */
export function resolveItemRect(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  visiting: ReadonlySet<string> = new Set(),
): Rect | undefined {
  const home = layout.home[itemId]
  const item = items[itemId]
  if (!home || !item) return undefined
  const { w, h } = home

  const zone = layout.zones[item.at]
  if (zone) {
    return { x: zone.x + (zone.w - w) / 2, y: zone.y + zone.h - h, w, h }
  }

  if (Object.hasOwn(items, item.at)) {
    const offset = layout.attach[itemId]
    if (!offset || visiting.has(itemId)) return undefined
    const parent = resolveItemRect(
      layout,
      items,
      item.at,
      new Set(visiting).add(itemId),
    )
    if (!parent) return undefined
    return { x: parent.x + offset.x, y: parent.y + offset.y, w, h }
  }

  return home
}

/** How many items deep an item is attached; 0 when it is not on another item. */
export function attachDepth(items: World['items'], itemId: string): number {
  let depth = 0
  let at = items[itemId]?.at
  while (at !== undefined && Object.hasOwn(items, at) && depth < 10) {
    depth++
    at = items[at].at
  }
  return depth
}
