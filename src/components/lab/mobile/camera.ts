import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  type Rect,
} from '../../../simulations/types'

export type Size = { w: number; h: number }

/** A stage point p shows on screen at p × scale + (x, y). */
export type Camera = { scale: number; x: number; y: number }

const STAGE: Size = { w: STAGE_WIDTH, h: STAGE_HEIGHT }
const NO_CAMERA: Camera = { scale: 0, x: 0, y: 0 }

/**
 * Fits the whole region in the viewport with one scale for both axes and
 * centres it, then slides the view back inside the stage where it can.
 */
export function fitCamera(
  region: Rect,
  viewport: Size,
  stage: Size = STAGE,
): Camera {
  if (viewport.w <= 0 || viewport.h <= 0 || region.w <= 0 || region.h <= 0) {
    return NO_CAMERA
  }
  const scale = Math.min(viewport.w / region.w, viewport.h / region.h)
  const left = viewStart(region.x + region.w / 2, viewport.w / scale, stage.w)
  const top = viewStart(region.y + region.h / 2, viewport.h / scale, stage.h)
  return { scale, x: 0 - left * scale, y: 0 - top * scale }
}

/** Where the view begins on one axis, centred on `centre` and kept on the stage. */
function viewStart(centre: number, span: number, stageSpan: number): number {
  if (span >= stageSpan) return (stageSpan - span) / 2
  return Math.min(Math.max(centre - span / 2, 0), stageSpan - span)
}

/** The part of the stage the viewport shows, in stage coordinates. */
export function visibleArea(
  camera: Camera,
  viewport: Size,
  stage: Size = STAGE,
): Rect {
  if (camera.scale <= 0) return { x: 0, y: 0, w: 0, h: 0 }
  const left = Math.max(0, -camera.x / camera.scale)
  const top = Math.max(0, -camera.y / camera.scale)
  const right = Math.min(stage.w, (viewport.w - camera.x) / camera.scale)
  const bottom = Math.min(stage.h, (viewport.h - camera.y) / camera.scale)
  return {
    x: left,
    y: top,
    w: Math.max(0, right - left),
    h: Math.max(0, bottom - top),
  }
}
