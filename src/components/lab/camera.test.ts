import { describe, expect, it } from 'vitest'
import { layouts } from '../../simulations'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'
import { fitCamera, holds, isInView } from './camera'

const STAGE = { width: STAGE_WIDTH, height: STAGE_HEIGHT }
const PHONE = { width: 390, height: 540 }

describe('fitCamera', () => {
  it('shows the whole region as large as the frame allows', () => {
    const region = { x: 480, y: 440, w: 520, h: 320 }
    const camera = fitCamera(region, PHONE, STAGE)
    expect(camera.scale).toBeCloseTo(0.75)
    // The region's edges stay inside the frame.
    expect(camera.left + region.x * camera.scale).toBeGreaterThanOrEqual(-0.01)
    expect(
      camera.left + (region.x + region.w) * camera.scale,
    ).toBeLessThanOrEqual(PHONE.width + 0.01)
    expect(camera.top + region.y * camera.scale).toBeGreaterThanOrEqual(-0.01)
    expect(
      camera.top + (region.y + region.h) * camera.scale,
    ).toBeLessThanOrEqual(PHONE.height + 0.01)
  })

  it('fills the frame with stage rather than empty room', () => {
    // A region on the stage's top edge: centring it would leave a gap above.
    const camera = fitCamera({ x: 0, y: 0, w: 400, h: 200 }, PHONE, STAGE)
    expect(camera.top).toBe(0)
    expect(camera.left).toBe(0)
  })

  it('has no scale without a frame', () => {
    const camera = fitCamera(
      { x: 0, y: 0, w: 10, h: 10 },
      { width: 0, height: 0 },
      STAGE,
    )
    expect(camera.scale).toBe(0)
  })
})

describe('isInView', () => {
  const region = { x: 100, y: 100, w: 200, h: 200 }

  it('counts an item mostly inside the region', () => {
    expect(isInView({ x: 250, y: 150, w: 80, h: 50 }, region)).toBe(true)
  })

  it('leaves out an item mostly outside it', () => {
    expect(isInView({ x: 280, y: 150, w: 80, h: 50 }, region)).toBe(false)
    expect(isInView({ x: 500, y: 150, w: 80, h: 50 }, region)).toBe(false)
  })
})

describe('holds', () => {
  it('tells whether a point is in the region', () => {
    const region = { x: 100, y: 100, w: 200, h: 200 }
    expect(holds(region, { x: 150, y: 300 })).toBe(true)
    expect(holds(region, { x: 99, y: 150 })).toBe(false)
  })
})

describe('phone views', () => {
  it.each(Object.entries(layouts))(
    '%s has views inside the stage, enlarged on a phone',
    (_, layout) => {
      const views = layout.views ?? []
      expect(views.length).toBeGreaterThan(1)
      expect(new Set(views.map((view) => view.id)).size).toBe(views.length)
      const whole = PHONE.width / STAGE_WIDTH
      for (const { region } of views) {
        expect(region.x).toBeGreaterThanOrEqual(0)
        expect(region.y).toBeGreaterThanOrEqual(0)
        expect(region.x + region.w).toBeLessThanOrEqual(STAGE_WIDTH)
        expect(region.y + region.h).toBeLessThanOrEqual(STAGE_HEIGHT)
        expect(fitCamera(region, PHONE, STAGE).scale).toBeGreaterThan(whole)
      }
      // The view the lab opens on is where the work is: clearly enlarged.
      expect(fitCamera(views[0].region, PHONE, STAGE).scale).toBeGreaterThan(
        whole * 1.5,
      )
    },
  )

  it.each(Object.entries(layouts))(
    '%s shows every zone in some view',
    (_, layout) => {
      for (const zone of Object.values(layout.zones)) {
        expect(
          (layout.views ?? []).some((view) => isInView(zone, view.region)),
        ).toBe(true)
      }
    },
  )
})
