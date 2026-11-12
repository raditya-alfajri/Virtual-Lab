import type { ItemDef, World } from '../../../data/types'
import { resolveItemRect } from '../../../simulations/position'
import type { Rect, SceneLayout } from '../../../simulations/types'

/**
 * Share of an item's area that must be on screen to count as visible. An item
 * cut off at the edge is hard to tap, so it is offered on the tool rack too.
 */
const VISIBLE_SHARE = 0.9

/** How much of the rect's area lies inside `area`, from 0 to 1. */
export function shareInside(rect: Rect, area: Rect): number {
  const size = rect.w * rect.h
  if (size <= 0) return 0
  const w =
    Math.min(rect.x + rect.w, area.x + area.w) - Math.max(rect.x, area.x)
  const h =
    Math.min(rect.y + rect.h, area.y + area.h) - Math.max(rect.y, area.y)
  return w > 0 && h > 0 ? (w * h) / size : 0
}

export function isVisibleIn(rect: Rect, area: Rect): boolean {
  return shareInside(rect, area) >= VISIBLE_SHARE
}

/** The movable items the active area does not show, in the experiment's order. */
export function toolRackItems(
  items: ItemDef[],
  layout: SceneLayout,
  world: World['items'],
  area: Rect,
): ItemDef[] {
  return items.filter((item) => {
    if (item.fixed) return false
    const rect = resolveItemRect(layout, world, item.id)
    return rect !== undefined && !isVisibleIn(rect, area)
  })
}
