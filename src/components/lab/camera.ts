import type { Rect } from '../../simulations/types'

export type Size = { width: number; height: number }

/**
 * How the stage is drawn in its frame: scaled from its top-left corner, then
 * moved by `left`/`top` screen pixels.
 */
export type Camera = { scale: number; left: number; top: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Where the stage starts on one axis so the region is centred, then moved so
 * the frame shows stage instead of empty room wherever it can, with the
 * region still whole.
 */
function shift(
  frame: number,
  start: number,
  length: number,
  scale: number,
  stage: number,
): number {
  const centred = (frame - length * scale) / 2 - start * scale
  const shown = stage * scale
  const covered =
    shown <= frame ? (frame - shown) / 2 : clamp(centred, frame - shown, 0)
  return clamp(covered, -start * scale, frame - (start + length) * scale)
}

/** The largest view of the stage that still shows the whole region. */
export function fitCamera(region: Rect, frame: Size, stage: Size): Camera {
  if (frame.width <= 0 || frame.height <= 0 || region.w <= 0 || region.h <= 0) {
    return { scale: 0, left: 0, top: 0 }
  }
  const scale = Math.min(frame.width / region.w, frame.height / region.h)
  return {
    scale,
    left: shift(frame.width, region.x, region.w, scale, stage.width),
    top: shift(frame.height, region.y, region.h, scale, stage.height),
  }
}

/** The part of the stage a camera shows in its frame, in stage coordinates. */
export function visibleArea(camera: Camera, frame: Size): Rect {
  if (camera.scale <= 0) return { x: 0, y: 0, w: 0, h: 0 }
  return {
    x: -camera.left / camera.scale,
    y: -camera.top / camera.scale,
    w: frame.width / camera.scale,
    h: frame.height / camera.scale,
  }
}

/** How much of the rect lies inside the area, from 0 to 1. */
export function shownPart(rect: Rect, area: Rect): number {
  const size = rect.w * rect.h
  if (size <= 0) return 0
  const w =
    Math.min(rect.x + rect.w, area.x + area.w) - Math.max(rect.x, area.x)
  const h =
    Math.min(rect.y + rect.h, area.y + area.h) - Math.max(rect.y, area.y)
  return w > 0 && h > 0 ? (w * h) / size : 0
}

/** True when at least half of the rect lies inside the region. */
export function isInView(rect: Rect, region: Rect): boolean {
  return shownPart(rect, region) >= 0.5
}

/** True when the point lies inside the region. */
export function holds(region: Rect, point: { x: number; y: number }): boolean {
  return (
    point.x >= region.x &&
    point.x <= region.x + region.w &&
    point.y >= region.y &&
    point.y <= region.y + region.h
  )
}
