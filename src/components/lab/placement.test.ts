import { describe, it, expect } from 'vitest'
import { acidBaseLayout } from '../../simulations/acid-base-test/layout'
import type { SceneLayout } from '../../simulations/types'
import { boundsOf, placeItem } from './placement'

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h })

const layout: SceneLayout = {
  background: '',
  stage: { width: 1440, height: 1024 },
  home: {
    flask: box(100, 500, 120, 160),
    thermometer: box(600, 500, 40, 210),
    rod: box(800, 700, 180, 24),
    beaker: box(700, 500, 140, 160),
  },
  zones: { bench: box(0, 400, 1440, 300), scale: box(10, 10, 150, 80) },
  spread: { bench: { beaker: box(300, 300, 140, 160) } },
  attach: {
    thermometer: { flask: { x: 40, y: -100 } },
    rod: { beaker: { x: -30, y: 40, rotate: 90 } },
  },
}

describe('placeItem', () => {
  it('keeps K1: zone box in a zone, home on the shelf', () => {
    const items = { 'tube-1': { at: 'rack-2' }, 'tube-2': { at: 'shelf' } }
    expect(placeItem(acidBaseLayout, items, 'tube-1')?.rect).toEqual(
      acidBaseLayout.zones['rack-2'],
    )
    expect(placeItem(acidBaseLayout, items, 'tube-2')?.rect).toEqual(
      acidBaseLayout.home['tube-2'],
    )
  })

  it('uses the zone box for a normal zone', () => {
    const p = placeItem(layout, { flask: { at: 'scale' } }, 'flask')
    expect(p).toEqual({ rect: box(10, 10, 150, 80), rotate: 0, parents: [] })
  })

  it('keeps items apart in a spread zone, falling back to home', () => {
    const items = { flask: { at: 'bench' }, beaker: { at: 'bench' } }
    expect(placeItem(layout, items, 'flask')?.rect).toEqual(layout.home.flask)
    expect(placeItem(layout, items, 'beaker')?.rect).toEqual(
      box(300, 300, 140, 160),
    )
  })

  it('places an attached item relative to its parent, recursively', () => {
    const items = {
      flask: { at: 'thermometer-free' },
      thermometer: { at: 'flask' },
    }
    expect(placeItem(layout, items, 'thermometer')).toEqual({
      rect: box(140, 400, 40, 210),
      rotate: 0,
      parents: ['flask'],
    })
    // Induk pindah, anak ikut.
    const moved = { flask: { at: 'scale' }, thermometer: { at: 'flask' } }
    expect(placeItem(layout, moved, 'thermometer')?.rect).toEqual(
      box(50, -90, 40, 210),
    )
  })

  it('centres an attached item without an offset', () => {
    const items = { flask: { at: 'beaker' }, beaker: { at: 'shelf' } }
    expect(placeItem(layout, items, 'flask')?.rect).toEqual(
      box(710, 500, 120, 160),
    )
  })

  it('carries the label side of an offset', () => {
    const own: SceneLayout = {
      ...layout,
      attach: { thermometer: { flask: { x: 0, y: 0, labelSide: 'left' } } },
    }
    const items = { flask: { at: 'shelf' }, thermometer: { at: 'flask' } }
    expect(placeItem(own, items, 'thermometer')?.labelSide).toBe('left')
    expect(placeItem(own, items, 'flask')?.labelSide).toBeUndefined()
  })

  it('carries rotation and stops on cycles', () => {
    const items = { rod: { at: 'beaker' }, beaker: { at: 'bench' } }
    expect(placeItem(layout, items, 'rod')?.rotate).toBe(90)
    const cycle = { flask: { at: 'beaker' }, beaker: { at: 'flask' } }
    expect(placeItem(layout, cycle, 'flask')).not.toBeNull()
  })
})

describe('boundsOf', () => {
  it('swaps width and height for a quarter turn', () => {
    const b = boundsOf({ rect: box(0, 0, 180, 24), rotate: 90, parents: [] })
    expect(b.w).toBeCloseTo(24)
    expect(b.h).toBeCloseTo(180)
    expect(b.x).toBeCloseTo(78)
    expect(b.y).toBeCloseTo(-78)
  })
})
