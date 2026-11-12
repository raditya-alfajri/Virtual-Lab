import { describe, expect, it } from 'vitest'
import { acidBaseTest } from '../../../data/kimia/acid-base-test'
import { reactionRate } from '../../../data/kimia/reaction-rate'
import { solutionConcentration } from '../../../data/kimia/solution-concentration'
import type { ItemDef, World } from '../../../data/types'
import { createInitialState } from '../../../lib/engine'
import { acidBaseTestLayout } from '../../../simulations/acid-base-test/layout'
import { reactionRateLayout } from '../../../simulations/reaction-rate/layout'
import { solutionConcentrationLayout } from '../../../simulations/solution-concentration/layout'
import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  type Rect,
  type SceneLayout,
} from '../../../simulations/types'
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

describe('mobile work areas', () => {
  const scenes = [
    { experiment: acidBaseTest, layout: acidBaseTestLayout },
    { experiment: solutionConcentration, layout: solutionConcentrationLayout },
    { experiment: reactionRate, layout: reactionRateLayout },
  ]
  const rackAt = (scene: (typeof scenes)[number], viewId: string) => {
    const view = scene.layout.mobile?.views.find((it) => it.id === viewId)
    const { items } = createInitialState(scene.experiment).world
    return ids(
      toolRackItems(
        scene.experiment.items,
        scene.layout,
        items,
        view?.region ?? NOWHERE,
      ),
    )
  }

  it('gives every experiment at least two areas on the stage', () => {
    for (const { layout } of scenes) {
      const views = layout.mobile?.views ?? []
      expect(views.length).toBeGreaterThanOrEqual(2)
      for (const { region } of views) {
        expect(region.x).toBeGreaterThanOrEqual(0)
        expect(region.y).toBeGreaterThanOrEqual(0)
        expect(region.x + region.w).toBeLessThanOrEqual(STAGE_WIDTH)
        expect(region.y + region.h).toBeLessThanOrEqual(STAGE_HEIGHT)
      }
    }
  })

  it('cuts no tool in half at the edge of an area', () => {
    for (const { experiment, layout } of scenes) {
      const { items } = createInitialState(experiment).world
      for (const { id, region } of layout.mobile?.views ?? []) {
        for (const item of experiment.items) {
          const rect = layout.home[item.id]
          if (item.fixed || !rect || !items[item.id]) continue
          const share = shareInside(rect, region)
          expect(
            share === 0 || isVisibleIn(rect, region),
            `${item.id} at the edge of ${experiment.id}/${id}`,
          ).toBe(true)
        }
      }
    }
  })

  it('keeps the bottles on the rack while the reaction-rate bench is shown', () => {
    expect(rackAt(scenes[2], 'meja')).toEqual([
      'thio-005',
      'thio-010',
      'thio-015',
      'thio-020',
      'hcl',
    ])
    expect(rackAt(scenes[2], 'penangas')).toEqual([
      'flask',
      'thio-005',
      'thio-010',
      'thio-015',
      'thio-020',
      'hcl',
      'thermometer',
      'stopwatch',
    ])
  })

  it('shows the whole work bench of the concentration lab in one area', () => {
    expect(rackAt(scenes[1], 'meja-kerja')).toEqual(['cuso4', 'water'])
  })
})
