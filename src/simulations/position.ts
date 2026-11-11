import type { World } from '../data/types'
import type { Placement, Rect, SceneLayout, Side } from './types'

const MAX_ATTACH_DEPTH = 10

/**
 * Where an item is drawn on the stage, or undefined when it cannot be placed.
 * Items keep their home size everywhere, so they are never stretched.
 */
export function resolveItemRect(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  visiting: ReadonlySet<string> = new Set(),
): Placement | undefined {
  const home = layout.home[itemId]
  const item = items[itemId]
  if (!home || !item) return undefined
  const { w, h } = home

  const zone = layout.zones[item.at]
  if (zone) {
    return { x: zone.x + (zone.w - w) / 2, y: zone.y + zone.h - h, w, h }
  }

  if (Object.hasOwn(items, item.at)) {
    const attach = layout.attach[itemId]?.[item.at]
    if (!attach || visiting.has(itemId)) return undefined
    const parent = resolveItemRect(
      layout,
      items,
      item.at,
      new Set(visiting).add(itemId),
    )
    if (!parent) return undefined
    const box = { x: parent.x + attach.x, y: parent.y + attach.y, w, h }
    return attach.rotate ? turn(box, attach.rotate) : box
  }

  return home
}

const round = (n: number) => Math.round(n * 1000) / 1000

function turn(box: Rect, degrees: number): Placement {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const w = round(box.w * cos + box.h * sin)
  const h = round(box.w * sin + box.h * cos)
  return {
    x: round(box.x + (box.w - w) / 2),
    y: round(box.y + (box.h - h) / 2),
    w,
    h,
    rotate: degrees,
  }
}

/** The items an item rests on, nearest first; stops after a few on a cycle. */
function attachChain(items: World['items'], itemId: string): string[] {
  const chain: string[] = []
  let at = items[itemId]?.at
  while (
    at !== undefined &&
    Object.hasOwn(items, at) &&
    chain.length < MAX_ATTACH_DEPTH
  ) {
    chain.push(at)
    at = items[at].at
  }
  return chain
}

/** How many items deep an item is attached; 0 when it is not on another item. */
export function attachDepth(items: World['items'], itemId: string): number {
  return attachChain(items, itemId).length
}

/** The items that move along with `itemId`, shallowest first. */
export function carriedBy(items: World['items'], itemId: string): string[] {
  return Object.keys(items)
    .filter((id) => id !== itemId && attachChain(items, id).includes(itemId))
    .sort((a, b) => attachDepth(items, a) - attachDepth(items, b))
}

/** Where the item's label and action button go in its current spot. */
export function itemSides(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
): { labelSide: Side; actionSide: Side } {
  const at = items[itemId]?.at
  const attach = at === undefined ? undefined : layout.attach[itemId]?.[at]
  return {
    labelSide: attach?.labelSide ?? layout.labelSide?.[itemId] ?? 'below',
    actionSide: attach?.actionSide ?? 'below',
  }
}
