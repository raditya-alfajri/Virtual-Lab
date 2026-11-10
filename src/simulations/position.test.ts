import { describe, expect, it } from 'vitest'
import { acidBaseTest } from '../data/kimia/acid-base-test'
import { solutionConcentration } from '../data/kimia/solution-concentration'
import type { World } from '../data/types'
import { createInitialState } from '../lib/engine'
import { acidBaseTestLayout } from './acid-base-test/layout'
import { getBackgroundUrl, getSceneLayout } from '.'
import { attachDepth, carriedBy, resolveItemRect } from './position'
import { solutionConcentrationLayout } from './solution-concentration/layout'
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
    rod: { x: 800, y: 800, w: 8, h: 120 },
  },
  zones: {
    shelf: { x: 0, y: 0, w: 200, h: 100 },
  },
  attach: {
    flask: { x: 5, y: -20 },
    thermometer: { x: 20, y: -50 },
    rod: { x: 10, y: -30, rotate: 90 },
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

  it('turns an attached item about its centre, keeping its home size', () => {
    const items = itemsAt({ bath: 'bench', rod: 'bath' })
    // The 8×120 box at (310, 370) lies down as a 120×8 box around (314, 430).
    expect(resolveItemRect(layout, items, 'rod')).toEqual({
      x: 254,
      y: 426,
      w: 120,
      h: 8,
      rotate: 90,
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

describe('carriedBy', () => {
  it('lists everything resting on an item, shallowest first', () => {
    const items = itemsAt({
      thermometer: 'flask',
      flask: 'bath',
      bath: 'bench',
      rod: 'bench',
    })
    expect(carriedBy(items, 'bath')).toEqual(['flask', 'thermometer'])
    expect(carriedBy(items, 'flask')).toEqual(['thermometer'])
    expect(carriedBy(items, 'thermometer')).toEqual([])
    expect(carriedBy(items, 'rod')).toEqual([])
    expect(carriedBy(items, 'missing')).toEqual([])
  })

  it('stops on a cycle', () => {
    const items = itemsAt({ a: 'b', b: 'a' })
    expect(carriedBy(items, 'a')).toEqual(['b'])
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

describe('solution-concentration layout', () => {
  const layout = solutionConcentrationLayout
  const { items } = createInitialState(solutionConcentration).world
  const moved = (places: Record<string, string>): World['items'] => {
    const next = { ...items }
    for (const [id, at] of Object.entries(places)) {
      next[id] = { ...next[id], at }
    }
    return next
  }

  it('is registered with a background named after the experiment id', () => {
    expect(getSceneLayout('konsentrasi-larutan')).toBe(layout)
    expect(getBackgroundUrl('konsentrasi-larutan')).toBe(
      '/img/lab/konsentrasi-larutan-bg.svg',
    )
  })

  it('has a home for every item and starts them all there', () => {
    for (const id of Object.keys(items)) {
      expect(resolveItemRect(layout, items, id)).toEqual(layout.home[id])
    }
  })

  it('sets the watch glass on the balance pan', () => {
    const onBalance = moved({ 'watch-glass': 'balance' })
    expect(resolveItemRect(layout, onBalance, 'watch-glass')).toEqual({
      x: 175,
      y: 392,
      w: 150,
      h: 80,
    })
  })

  it('stands the stirrer in the beaker, clear of its middle', () => {
    const beaker = layout.home.beaker
    const inBeaker = moved({ stirrer: 'beaker' })
    const rect = resolveItemRect(layout, inBeaker, 'stirrer')
    expect(rect?.rotate).toBe(96)
    expect(rect?.x).toBeGreaterThan(beaker.x + beaker.w / 2)
    expect(rect && rect.x + rect.w).toBeLessThan(beaker.x + beaker.w)
    expect(rect && rect.y + rect.h).toBeLessThan(beaker.y + beaker.h)
    expect(rect?.y).toBeLessThan(beaker.y)
    expect(carriedBy(inBeaker, 'beaker')).toEqual(['stirrer'])
  })

  it('shows the balance reading on the screen in the background', () => {
    expect(layout.screens?.balance).toEqual({
      x: 193,
      y: 516,
      w: 114,
      h: 36,
    })
  })
})
