import { describe, expect, it } from 'vitest'
import { acidBaseTest } from '../data/kimia/acid-base-test'
import type { World } from '../data/types'
import { createInitialState } from '../lib/engine'
import { acidBaseTestLayout } from './acid-base-test/layout'
import { getBackgroundUrl, getSceneLayout } from '.'
import { attachDepth, resolveItemRect } from './position'
import type { SceneLayout } from './types'

const itemsAt = (places: Record<string, string>): World['items'] =>
  Object.fromEntries(
    Object.entries(places).map(([id, at]) => [id, { at, state: {} }]),
  )

const layout: SceneLayout = {
  home: {
    flask: { x: 100, y: 100, w: 60, h: 80 },
    thermometer: { x: 500, y: 500, w: 10, h: 100 },
    bath: { x: 300, y: 400, w: 200, h: 100 },
    stirrer: { x: 700, y: 700, w: 8, h: 120 },
  },
  zones: {
    shelf: { x: 0, y: 0, w: 200, h: 100 },
  },
  attach: {
    flask: { x: 5, y: -20 },
    thermometer: { x: 20, y: -50 },
  },
}

describe('resolveItemRect', () => {
  it('uses the home rect when the item is not in a placed zone', () => {
    const items = itemsAt({ flask: 'bench', bath: 'cupboard' })
    expect(resolveItemRect(layout, items, 'flask')).toEqual(layout.home.flask)
    expect(resolveItemRect(layout, items, 'bath')).toEqual(layout.home.bath)
  })

  it('puts an item bottom-centre in a placed zone, keeping its own size', () => {
    const items = itemsAt({ flask: 'shelf' })
    expect(resolveItemRect(layout, items, 'flask')).toEqual({
      x: 70,
      y: 20,
      w: 60,
      h: 80,
    })
  })

  it('places an attached item relative to its parent, down a chain', () => {
    const items = itemsAt({
      bath: 'bench',
      flask: 'bath',
      thermometer: 'flask',
    })
    expect(resolveItemRect(layout, items, 'flask')).toEqual({
      x: 305,
      y: 380,
      w: 60,
      h: 80,
    })
    expect(resolveItemRect(layout, items, 'thermometer')).toEqual({
      x: 325,
      y: 330,
      w: 10,
      h: 100,
    })
  })

  it('follows the parent into a zone', () => {
    const items = itemsAt({ flask: 'shelf', thermometer: 'flask' })
    expect(resolveItemRect(layout, items, 'thermometer')).toEqual({
      x: 90,
      y: -30,
      w: 10,
      h: 100,
    })
  })

  it('returns undefined when the item cannot be placed', () => {
    const items = itemsAt({
      flask: 'thermometer',
      thermometer: 'flask',
      stirrer: 'bath',
      bath: 'bench',
      ghost: 'bench',
    })
    expect(resolveItemRect(layout, items, 'flask')).toBeUndefined()
    expect(resolveItemRect(layout, items, 'stirrer')).toBeUndefined()
    expect(resolveItemRect(layout, items, 'ghost')).toBeUndefined()
    expect(resolveItemRect(layout, items, 'missing')).toBeUndefined()
  })
})

describe('attachDepth', () => {
  it('counts the attach chain and stops on a cycle', () => {
    const items = itemsAt({
      bath: 'bench',
      flask: 'bath',
      thermometer: 'flask',
      a: 'b',
      b: 'a',
    })
    expect(attachDepth(items, 'bath')).toBe(0)
    expect(attachDepth(items, 'flask')).toBe(1)
    expect(attachDepth(items, 'thermometer')).toBe(2)
    expect(attachDepth(items, 'missing')).toBe(0)
    expect(attachDepth(items, 'a')).toBe(10)
  })
})

describe('acid-base layout', () => {
  const { items } = createInitialState(acidBaseTest).world

  it('is registered with a background named after the experiment id', () => {
    expect(getSceneLayout('uji-asam-basa')).toBe(acidBaseTestLayout)
    expect(getSceneLayout('toString')).toBeUndefined()
    expect(getBackgroundUrl('uji-asam-basa')).toBe(
      '/img/lab/uji-asam-basa-bg.svg',
    )
  })

  it('has a home for every movable item', () => {
    for (const id of Object.keys(items)) {
      expect(resolveItemRect(acidBaseTestLayout, items, id)).toBeDefined()
    }
  })

  it('starts tubes and bottles at home', () => {
    expect(resolveItemRect(acidBaseTestLayout, items, 'tube-2')).toEqual(
      acidBaseTestLayout.home['tube-2'],
    )
    expect(resolveItemRect(acidBaseTestLayout, items, 'bottle-naoh')).toEqual(
      acidBaseTestLayout.home['bottle-naoh'],
    )
  })

  it('draws a tube in the rack it was put in', () => {
    const moved = { ...items, 'tube-2': { ...items['tube-2'], at: 'rack-2' } }
    expect(resolveItemRect(acidBaseTestLayout, moved, 'tube-2')).toEqual({
      x: 1162,
      y: 520,
      w: 80,
      h: 170,
    })
  })

  it('centres a tube at the bottom of the large sink zone', () => {
    const moved = { ...items, 'tube-1': { ...items['tube-1'], at: 'sink' } }
    expect(resolveItemRect(acidBaseTestLayout, moved, 'tube-1')).toEqual({
      x: 173.5,
      y: 416,
      w: 80,
      h: 170,
    })
  })
})
