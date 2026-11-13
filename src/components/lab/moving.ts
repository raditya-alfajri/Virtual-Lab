import { useState } from 'react'
import type { Rect } from '../../simulations/types'

/** How long, in lab seconds, an item still counts as moving after its last step. */
export const SETTLE_S = 0.4

/** Where each item was last seen, and when it last moved, in lab time. */
export type MotionTrack = {
  at: Record<string, string>
  movedAt: Record<string, number>
}

export const NO_TRACK: MotionTrack = { at: {}, movedAt: {} }

const keyOf = (rect: Rect | undefined) =>
  rect ? `${rect.x},${rect.y},${rect.w},${rect.h}` : ''

/** Notes which items moved since the last look; the same track when none did. */
export function follow(
  track: MotionTrack,
  rects: Record<string, Rect | undefined>,
  time: number,
): MotionTrack {
  let at: MotionTrack['at'] | null = null
  let movedAt = track.movedAt
  for (const [id, rect] of Object.entries(rects)) {
    const key = keyOf(rect)
    const last = track.at[id]
    if (last === key) continue
    at ??= { ...track.at }
    at[id] = key
    if (last !== undefined) movedAt = { ...movedAt, [id]: time }
  }
  return at ? { at, movedAt } : track
}

/** The items that moved within the last `SETTLE_S` of lab time. */
export function movingItems(
  track: MotionTrack,
  time: number,
): ReadonlySet<string> {
  return new Set(
    Object.entries(track.movedAt)
      .filter(([, at]) => time >= at && time - at < SETTLE_S)
      .map(([id]) => id),
  )
}

/**
 * The items that are moving, e.g. a cart rolling or a bob swinging, judged
 * by where they are drawn as lab time goes on.
 */
export function useMovingItems(
  rects: Record<string, Rect | undefined>,
  time: number,
): ReadonlySet<string> {
  const [track, setTrack] = useState(NO_TRACK)
  const next = follow(track, rects, time)
  if (next !== track) setTrack(next)
  return movingItems(next, time)
}
