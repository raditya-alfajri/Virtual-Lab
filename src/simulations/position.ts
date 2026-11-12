import type { ItemView, World } from '../data/types'
import type { Placement, Rect, SceneLayout, Side } from './types'

const MAX_ATTACH_DEPTH = 10

/**
 * Where an item is drawn on the stage, or undefined when it cannot be placed.
 * Items keep their home size unless a motion changes it, so they are never
 * stretched.
 */
export function resolveItemRect(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  view: Record<string, ItemView> = {},
): Placement | undefined {
  const spot = locate(layout, items, itemId, view, new Set())
  if (!spot) return undefined
  const { box, rotate, size, ...rest } = spot
  if (!rotate) return { ...box, ...rest }
  return {
    ...turn(box, rotate),
    ...(size && { size: { w: box.w, h: box.h } }),
    ...rest,
  }
}

type Spot = Omit<Placement, keyof Rect | 'size'> & {
  /** The drawing's box before it is turned. */
  box: Rect
  /** True when a motion changed the drawing's size. */
  size?: boolean
}

function locate(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  view: Record<string, ItemView>,
  visiting: ReadonlySet<string>,
): Spot | undefined {
  const base = basePlace(layout, items, itemId, view, visiting)
  const motion = layout.motion?.[itemId]
  if (!base || !motion) return base
  const at = items[itemId].at
  const parent = Object.hasOwn(items, at)
    ? locate(layout, items, at, view, new Set(visiting).add(itemId))?.box
    : undefined
  const moved = motion(base.box, { at, view, items, parent })
  const box = moved.rect ?? base.box
  const home = layout.home[itemId]
  return {
    ...base,
    box,
    rotate: moved.rotate ?? base.rotate,
    size: box.w !== home.w || box.h !== home.h,
    ...(moved.labelSide && { labelSide: moved.labelSide }),
    ...(moved.actionSide && { actionSide: moved.actionSide }),
    ...(moved.action && { action: moved.action }),
  }
}

function basePlace(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  view: Record<string, ItemView>,
  visiting: ReadonlySet<string>,
): Spot | undefined {
  const home = layout.home[itemId]
  const item = items[itemId]
  if (!home || !item) return undefined
  const { w, h } = home

  const zone = layout.zones[item.at]
  if (zone) {
    return {
      box: { x: zone.x + (zone.w - w) / 2, y: zone.y + zone.h - h, w, h },
    }
  }

  if (Object.hasOwn(items, item.at)) {
    const attach = layout.attach[itemId]?.[item.at]
    if (visiting.has(itemId)) return undefined
    // Without an offset, only a motion can say where the item goes.
    if (!attach) return layout.motion?.[itemId] ? { box: home } : undefined
    const parent = locate(
      layout,
      items,
      item.at,
      view,
      new Set(visiting).add(itemId),
    )
    if (!parent) return undefined
    return {
      box: { x: parent.box.x + attach.x, y: parent.box.y + attach.y, w, h },
      rotate: attach.rotate,
    }
  }

  return { box: home }
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

/**
 * Where the item's label and action button go in its current spot; a motion's
 * sides, from `placement`, come first.
 */
export function itemSides(
  layout: SceneLayout,
  items: World['items'],
  itemId: string,
  placement?: Placement,
): { labelSide: Side; actionSide: Side } {
  const at = items[itemId]?.at
  const attach = at === undefined ? undefined : layout.attach[itemId]?.[at]
  return {
    labelSide:
      placement?.labelSide ??
      attach?.labelSide ??
      layout.labelSide?.[itemId] ??
      'below',
    actionSide:
      placement?.actionSide ??
      attach?.actionSide ??
      layout.actionSide?.[itemId] ??
      'below',
  }
}
