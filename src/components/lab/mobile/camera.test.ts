import { describe, expect, it } from 'vitest'
import type { Rect } from '../../../simulations/types'
import { fitCamera, visibleArea, type Camera, type Size } from './camera'

const contains = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x - 1e-9 &&
  inner.y >= outer.y - 1e-9 &&
  inner.x + inner.w <= outer.x + outer.w + 1e-9 &&
  inner.y + inner.h <= outer.y + outer.h + 1e-9

describe('fitCamera', () => {
  const bench: Rect = { x: 480, y: 420, w: 720, h: 604 }

  it('fits the region by its width on an upright phone', () => {
    const camera = fitCamera(bench, { w: 360, h: 600 })
    expect(camera.scale).toBe(0.5)
    expect(camera.x).toBe(-240)
  })

  it('centres the stage when the view is taller than the whole stage', () => {
    // 600 px at scale 0.5 shows 1200 stage units, more than its 1024.
    expect(fitCamera(bench, { w: 360, h: 600 }).y).toBe(44)
  })

  it('fits the region by its height on a wide, low viewport', () => {
    const camera = fitCamera(bench, { w: 1000, h: 302 })
    expect(camera).toEqual({ scale: 0.5, x: 140, y: -210 })
  })

  it('slides the view back inside the stage near its edge', () => {
    const corner: Rect = { x: 1240, y: 900, w: 200, h: 124 }
    expect(fitCamera(corner, { w: 400, h: 400 })).toEqual({
      scale: 2,
      x: -2480,
      y: -1648,
    })
  })

  it('always keeps the whole region in view', () => {
    const regions: Rect[] = [
      bench,
      { x: 0, y: 200, w: 700, h: 600 },
      { x: 760, y: 420, w: 680, h: 604 },
      { x: 1240, y: 900, w: 200, h: 124 },
    ]
    const viewports: Size[] = [
      { w: 360, h: 520 },
      { w: 412, h: 700 },
      { w: 560, h: 260 },
      { w: 800, h: 300 },
    ]
    for (const region of regions) {
      for (const viewport of viewports) {
        const camera = fitCamera(region, viewport)
        expect(contains(visibleArea(camera, viewport), region)).toBe(true)
      }
    }
  })

  it('returns a zero camera until the viewport has a size', () => {
    expect(fitCamera(bench, { w: 0, h: 600 })).toEqual({
      scale: 0,
      x: 0,
      y: 0,
    })
  })
})

describe('visibleArea', () => {
  it('maps the viewport back onto the stage, cut to its edges', () => {
    const camera: Camera = { scale: 0.5, x: -240, y: 44 }
    expect(visibleArea(camera, { w: 360, h: 600 })).toEqual({
      x: 480,
      y: 0,
      w: 720,
      h: 1024,
    })
  })

  it('is empty without a camera', () => {
    expect(visibleArea({ scale: 0, x: 0, y: 0 }, { w: 360, h: 600 })).toEqual({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    })
  })
})
