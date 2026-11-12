import type { Rect, Side } from '../../../simulations/types'

/** The smallest box a finger can reliably hit, in screen pixels. */
export const MIN_TOUCH_PX = 44

type Anchor = Side | 'centre'

/**
 * The box that takes taps for an item too small to hit on screen, in stage
 * coordinates, or undefined when its own drawing is big enough. `minSize`
 * is in stage units.
 */
export function touchTarget(rect: Rect, minSize: number): Rect | undefined {
  const box = grow(rect, minSize, 'centre')
  return box.w === rect.w && box.h === rect.h ? undefined : box
}

/**
 * The only box that takes taps for an item resting on a parent: the part
 * that sticks out of the parent, grown away from it to `minSize`, so taps
 * inside the parent always reach the parent. Undefined when nothing sticks out.
 */
export function attachedTouchTarget(
  rect: Rect,
  minSize: number,
  parent: Rect,
): Rect | undefined {
  const part = protrudingPart(rect, parent)
  return part && grow(part.rect, minSize, part.side)
}

function protrudingPart(
  rect: Rect,
  parent: Rect,
): { rect: Rect; side: Side } | undefined {
  const right = rect.x + rect.w
  const bottom = rect.y + rect.h
  const parentRight = parent.x + parent.w
  const parentBottom = parent.y + parent.h
  const parts: { side: Side; size: number; rect: Rect }[] = [
    {
      side: 'above',
      size: parent.y - rect.y,
      rect: { ...rect, h: Math.min(parent.y - rect.y, rect.h) },
    },
    {
      side: 'below',
      size: bottom - parentBottom,
      rect: {
        ...rect,
        y: Math.max(rect.y, parentBottom),
        h: Math.min(bottom - parentBottom, rect.h),
      },
    },
    {
      side: 'left',
      size: parent.x - rect.x,
      rect: { ...rect, w: Math.min(parent.x - rect.x, rect.w) },
    },
    {
      side: 'right',
      size: right - parentRight,
      rect: {
        ...rect,
        x: Math.max(rect.x, parentRight),
        w: Math.min(right - parentRight, rect.w),
      },
    },
  ]
  const biggest = parts.reduce((a, b) => (b.size > a.size ? b : a))
  return biggest.size > 0 ? biggest : undefined
}

/** Grows the box to `min` on each short axis, keeping the edge at `anchor`'s far side. */
function grow(box: Rect, min: number, anchor: Anchor): Rect {
  const w = Math.max(box.w, min)
  const h = Math.max(box.h, min)
  const x =
    anchor === 'left'
      ? box.x + box.w - w
      : anchor === 'right'
        ? box.x
        : box.x - (w - box.w) / 2
  const y =
    anchor === 'above'
      ? box.y + box.h - h
      : anchor === 'below'
        ? box.y
        : box.y - (h - box.h) / 2
  return { x, y, w, h }
}
