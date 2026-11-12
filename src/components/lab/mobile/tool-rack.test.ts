import { describe, expect, it } from 'vitest'
import { acidBaseTest } from '../../../data/kimia/acid-base-test'
import { reactionRate } from '../../../data/kimia/reaction-rate'
import type { ItemDef, World } from '../../../data/types'
import { createInitialState } from '../../../lib/engine'
import { acidBaseTestLayout } from '../../../simulations/acid-base-test/layout'
import { reactionRateLayout } from '../../../simulations/reaction-rate/layout'
import type { Rect, SceneLayout } from '../../../simulations/types'
import { isVisibleIn, shareInside, toolRackItems } from './tool-rack'

const area: Rect = { x: 0, y: 0, w: 100, h: 100 }
const NOWHERE: Rect = { x: 0, y: 0, w: 0, h: 0 }
const ids = (items: ItemDef[]) => items.map((item) => item.id)

describe('shareInside and isVisibleIn', () => {
  it('measures the share of the rect inside the area', () => {
    expect(shareInside({ x: 10, y: 10, w: 20, h: 20 }, area)).toBe(1)
    expect(shareInside({ x: 90, y: 0, w: 20, h: 10 }, area)).toBe(0.5)
    expect(shareInside({ x: 200, y: 0, w: 20, h: 10 }, area)).toBe(0)
    expect(shareInside({ x: 10, y: 10, w: 0, h: 20 }, area)).toBe(0)
  })

  it('counts an item as visible only when almost all of it shows', () => {
    expect(isVisibleIn({ x: 82, y: 0, w: 20, h: 10 }, area)).toBe(true)
    expect(isVisibleIn({ x: 90, y: 0, w: 20, h: 10 }, area)).toBe(false)
  })
})

describe('toolRackItems', () => {
  const { items } = createInitialState(acidBaseTest).world
  const views = acidBaseTestLayout.mobile?.views ?? []
  const regionOf = (id: string) =>
    views.find((view) => view.id === id)?.region ?? NOWHERE

  it('holds the bottles while the bench is in view', () => {
    expect(
      ids(
        toolRackItems(
          acidBaseTest.items,
          acidBaseTestLayout,
          items,
          regionOf('meja'),
        ),
      ),
    ).toEqual([
      'bottle-cuka',
      'bottle-jeruk',
      'bottle-suling',
      'bottle-sabun',
      'bottle-naoh',
    ])
  })

  it('offers an item cut off at the edge of the screen', () => {
    // An upright phone shows the bench up to x = 1140, through the third bottle.
    const upright: Rect = { x: 470, y: 0, w: 670, h: 1024 }
    const rack = ids(
      toolRackItems(acidBaseTest.items, acidBaseTestLayout, items, upright),
    )
    expect(rack).toEqual(['bottle-suling', 'bottle-sabun', 'bottle-naoh'])
  })

  it('adds an item once it is moved out of the area, in data order', () => {
    const moved: World['items'] = {
      ...items,
      'tube-1': { ...items['tube-1'], at: 'sink' },
    }
    const rack = ids(
      toolRackItems(
        acidBaseTest.items,
        acidBaseTestLayout,
        moved,
        regionOf('meja'),
      ),
    )
    expect(rack[0]).toBe('tube-1')
    expect(rack).not.toContain('tube-2')
  })

  it('leaves out fixed items', () => {
    const { items } = createInitialState(reactionRate).world
    const rack = toolRackItems(
      reactionRate.items,
      reactionRateLayout,
      items,
      NOWHERE,
    )
    expect(ids(rack)).toContain('flask')
    expect(ids(rack)).not.toContain('bath')
    expect(ids(rack)).not.toContain('paper')
  })

  it('leaves out items that cannot be placed', () => {
    const layout: SceneLayout = {
      home: { a: { x: 500, y: 500, w: 10, h: 10 } },
      zones: {},
      attach: {},
    }
    const defs: ItemDef[] = [
      { id: 'a', kind: 'a', name: 'A' },
      { id: 'b', kind: 'b', name: 'B' },
    ]
    const world: World['items'] = {
      a: { at: 'shelf', state: {} },
      b: { at: 'shelf', state: {} },
    }
    expect(ids(toolRackItems(defs, layout, world, area))).toEqual(['a'])
  })
})
