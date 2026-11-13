import type { Rect } from '../../simulations/types'
import { shownPart } from '../lab/camera'

export type Corner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/** The corners in the order Labi prefers them when several are as free. */
const ORDER: Corner[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left']

/** The room on screen and what Labi keeps clear of along its edges, in pixels. */
export type Room = {
  width: number
  height: number
  top: number
  bottom: number
  side: number
}

/** Room kept around what is on the bench, so labels below it stay clear too. */
const CLEARANCE = 10

/** The box Labi takes in a corner of the room, in screen pixels. */
export function cornerBox(
  corner: Corner,
  room: Room,
  size: { w: number; h: number },
): Rect {
  return {
    x: corner.endsWith('left') ? room.side : room.width - room.side - size.w,
    y: corner.startsWith('top') ? room.top : room.height - room.bottom - size.h,
    ...size,
  }
}

/**
 * The corner where Labi covers the least of the items and zones on screen,
 * given as screen rects; on a tie, the first in `ORDER`.
 */
export function pickCorner(
  room: Room,
  size: { w: number; h: number },
  obstacles: Rect[],
): Corner {
  let best = ORDER[0]
  let least = Infinity
  for (const corner of ORDER) {
    const box = cornerBox(corner, room, size)
    const covered = obstacles.reduce(
      (sum, rect) =>
        sum +
        shownPart(box, {
          x: rect.x - CLEARANCE,
          y: rect.y - CLEARANCE,
          w: rect.w + CLEARANCE * 2,
          h: rect.h + CLEARANCE * 2,
        }),
      0,
    )
    if (covered < least) {
      least = covered
      best = corner
    }
  }
  return best
}

/** Where the balloon goes on a phone: beside Labi, or above or below it. */
export type BubblePlace = 'beside' | 'stacked'

const BUBBLE_GAP = 8

/** The balloon's box for a Labi in `corner` taking `labi`, in screen pixels. */
export function bubbleBox(
  corner: Corner,
  labi: Rect,
  bubble: { w: number; h: number },
  place: BubblePlace,
): Rect {
  const left = corner.endsWith('left')
  const top = corner.startsWith('top')
  if (place === 'beside') {
    return {
      x: left ? labi.x + labi.w + BUBBLE_GAP : labi.x - BUBBLE_GAP - bubble.w,
      y: top ? labi.y : labi.y + labi.h - bubble.h,
      ...bubble,
    }
  }
  return {
    x: left ? labi.x : labi.x + labi.w - bubble.w,
    y: top ? labi.y + labi.h + BUBBLE_GAP : labi.y - BUBBLE_GAP - bubble.h,
    ...bubble,
  }
}

/**
 * Where the balloon hides the least of the items and zones on screen, and
 * stays in the room; beside Labi on a tie.
 */
export function pickBubblePlace(
  corner: Corner,
  labi: Rect,
  bubble: { w: number; h: number },
  room: { width: number; height: number },
  obstacles: Rect[],
): BubblePlace {
  const cost = (place: BubblePlace) => {
    const box = bubbleBox(corner, labi, bubble, place)
    const outside =
      1 - shownPart(box, { x: 0, y: 0, w: room.width, h: room.height })
    const hidden = obstacles.reduce(
      (sum, rect) => sum + shownPart(rect, box),
      0,
    )
    return hidden + outside * (obstacles.length + 10)
  }
  return cost('stacked') < cost('beside') ? 'stacked' : 'beside'
}
