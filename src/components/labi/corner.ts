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

/** How much of Labi's box the items and zones on screen cover, with room for their labels. */
function coverage(box: Rect, obstacles: Rect[]): number {
  return obstacles.reduce(
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
    const covered = coverage(cornerBox(corner, room, size), obstacles)
    if (covered < least) {
      least = covered
      best = corner
    }
  }
  return best
}

/**
 * Where the student put Labi: its box's place between the room's edges, from
 * 0 to 1 on each axis, so it stays put as the room changes size.
 */
export type Spot = { fx: number; fy: number }

function reach(room: Room, size: { w: number; h: number }) {
  const x0 = room.side
  const y0 = room.top
  return {
    x0,
    y0,
    x1: Math.max(room.width - room.side - size.w, x0),
    y1: Math.max(room.height - room.bottom - size.h, y0),
  }
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** Labi's box at a spot, in screen pixels. */
export function spotBox(
  spot: Spot,
  room: Room,
  size: { w: number; h: number },
): Rect {
  const { x0, y0, x1, y1 } = reach(room, size)
  return { x: x0 + spot.fx * (x1 - x0), y: y0 + spot.fy * (y1 - y0), ...size }
}

/** The spot of a box whose top-left corner is at `at`. */
export function spotOf(
  at: { x: number; y: number },
  room: Room,
  size: { w: number; h: number },
): Spot {
  const { x0, y0, x1, y1 } = reach(room, size)
  return {
    fx: x1 > x0 ? clamp01((at.x - x0) / (x1 - x0)) : 0,
    fy: y1 > y0 ? clamp01((at.y - y0) / (y1 - y0)) : 0,
  }
}

const SNAP_STEP = 4
/** Let go this close to a corner, Labi settles in the corner itself. */
const CORNER_PULL = 24

/**
 * Where Labi lands when let go with its box's top-left corner at `at`: the
 * nearest place along the room's edges and corners that covers nothing on
 * the bench, or, when every place does, the nearest one covering the least.
 * Near a corner it settles in the corner.
 */
export function snapToEdge(
  at: { x: number; y: number },
  room: Room,
  size: { w: number; h: number },
  obstacles: Rect[],
): Spot {
  const { x0, y0, x1, y1 } = reach(room, size)
  const corners = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x0, y: y1 },
    { x: x1, y: y1 },
  ]
  const places = [...corners]
  for (let y = y0 + SNAP_STEP; y < y1; y += SNAP_STEP) {
    places.push({ x: x0, y }, { x: x1, y })
  }
  for (let x = x0 + SNAP_STEP; x < x1; x += SNAP_STEP) {
    places.push({ x, y: y0 }, { x, y: y1 })
  }
  const covering = Math.hypot(room.width, room.height)
  let best = places[0]
  let least = Infinity
  for (const place of places) {
    const cost =
      Math.hypot(place.x - at.x, place.y - at.y) +
      covering * coverage({ ...place, ...size }, obstacles) -
      (corners.includes(place) ? CORNER_PULL : 0)
    if (cost < least) {
      least = cost
      best = place
    }
  }
  return spotOf(best, room, size)
}

const BUBBLE_GAP = 8
/** Room kept between the balloon and the room's lower edge. */
const BUBBLE_FLOOR = 8

/**
 * Where the balloon goes around Labi's box on a phone: beside it, above or
 * below it, moved back inside the room where it would stick out, wherever it
 * hides the least of the bench and stays clear of Labi.
 */
export function placeBubble(
  labi: Rect,
  bubble: { w: number; h: number },
  room: Room,
  obstacles: Rect[],
): Rect {
  const left = labi.x + labi.w / 2 < room.width / 2
  const top = labi.y + labi.h / 2 < room.height / 2
  const alignX = left ? labi.x : labi.x + labi.w - bubble.w
  const alignY = top ? labi.y : labi.y + labi.h - bubble.h
  const toward = {
    x: left ? labi.x + labi.w + BUBBLE_GAP : labi.x - BUBBLE_GAP - bubble.w,
    y: alignY,
  }
  const away = {
    x: left ? labi.x - BUBBLE_GAP - bubble.w : labi.x + labi.w + BUBBLE_GAP,
    y: alignY,
  }
  const stacked = {
    x: alignX,
    y: top ? labi.y + labi.h + BUBBLE_GAP : labi.y - BUBBLE_GAP - bubble.h,
  }
  const flipped = {
    x: alignX,
    y: top ? labi.y - BUBBLE_GAP - bubble.h : labi.y + labi.h + BUBBLE_GAP,
  }
  const inside = ({ x, y }: { x: number; y: number }): Rect => ({
    x: Math.min(
      Math.max(x, room.side),
      Math.max(room.width - room.side - bubble.w, room.side),
    ),
    y: Math.min(
      Math.max(y, room.top),
      Math.max(room.height - BUBBLE_FLOOR - bubble.h, room.top),
    ),
    ...bubble,
  })
  let best = inside(toward)
  let least = Infinity
  for (const place of [toward, stacked, away, flipped]) {
    const box = inside(place)
    const hidden = obstacles.reduce(
      (sum, rect) => sum + shownPart(rect, box),
      0,
    )
    const cost = hidden + shownPart(labi, box) * (obstacles.length + 10)
    if (cost < least) {
      least = cost
      best = box
    }
  }
  return best
}
