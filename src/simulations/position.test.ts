import { describe, expect, it } from 'vitest'
import { acidBaseTest } from '../data/kimia/acid-base-test'
import { reactionRate } from '../data/kimia/reaction-rate'
import { solutionConcentration } from '../data/kimia/solution-concentration'
import type { World } from '../data/types'
import { createInitialState } from '../lib/engine'
import { acidBaseTestLayout } from './acid-base-test/layout'
import { getBackgroundUrl, getSceneLayout } from '.'
import { attachDepth, carriedBy, itemSides, resolveItemRect } from './position'
import { reactionRateLayout } from './reaction-rate/layout'
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
    flask: {
      bath: { x: 5, y: -20 },
      stirrer: { x: 0, y: 0, labelSide: 'left', actionSide: 'right' },
    },
    thermometer: { flask: { x: 20, y: -50 } },
    rod: { bath: { x: 10, y: -30, rotate: 90 } },
  },
  labelSide: { thermometer: 'right' },
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

  it('uses the offset for the parent the item rests on', () => {
    const items = itemsAt({ bath: 'bench', stirrer: 'bench', flask: 'bath' })
    expect(resolveItemRect(layout, items, 'flask')).toEqual({
      x: 305,
      y: 380,
      w: 60,
      h: 80,
    })
    const onStirrer = { ...items, flask: { at: 'stirrer', state: {} } }
    expect(resolveItemRect(layout, onStirrer, 'flask')).toEqual({
      x: 700,
      y: 700,
      w: 60,
      h: 80,
    })
    const onRod = itemsAt({ rod: 'bench', flask: 'rod' })
    expect(resolveItemRect(layout, onRod, 'flask')).toBeUndefined()
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

describe('itemSides', () => {
  it('puts labels and buttons below unless the layout says otherwise', () => {
    const items = itemsAt({ flask: 'bench', thermometer: 'bench' })
    expect(itemSides(layout, items, 'flask')).toEqual({
      labelSide: 'below',
      actionSide: 'below',
    })
    expect(itemSides(layout, items, 'thermometer')).toEqual({
      labelSide: 'right',
      actionSide: 'below',
    })
  })

  it('lets the spot an item rests on move its label and button', () => {
    const onStirrer = itemsAt({ stirrer: 'bench', flask: 'stirrer' })
    expect(itemSides(layout, onStirrer, 'flask')).toEqual({
      labelSide: 'left',
      actionSide: 'right',
    })
    const onBath = itemsAt({ bath: 'bench', flask: 'bath' })
    expect(itemSides(layout, onBath, 'flask').actionSide).toBe('below')
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

describe('reaction-rate layout', () => {
  const layout = reactionRateLayout
  const { items } = createInitialState(reactionRate).world
  const moved = (places: Record<string, string>): World['items'] => {
    const next = { ...items }
    for (const [id, at] of Object.entries(places)) {
      next[id] = { ...next[id], at }
    }
    return next
  }

  it('is registered with a background named after the experiment id', () => {
    expect(getSceneLayout('laju-reaksi')).toBe(layout)
    expect(getBackgroundUrl('laju-reaksi')).toBe('/img/lab/laju-reaksi-bg.svg')
  })

  it('has a home for every item and starts them all there', () => {
    for (const id of Object.keys(items)) {
      expect(resolveItemRect(layout, items, id)).toEqual(layout.home[id])
    }
  })

  it('stands the flask on the cross paper with its label and button below', () => {
    const onPaper = moved({ flask: 'paper' })
    expect(resolveItemRect(layout, onPaper, 'flask')).toEqual({
      x: 369,
      y: 529,
      w: 132,
      h: 161,
    })
    expect(itemSides(layout, onPaper, 'flask')).toEqual({
      labelSide: 'below',
      actionSide: 'below',
    })
  })

  it('sets the flask in the bath with its label and button beside it', () => {
    const inBath = moved({ flask: 'bath' })
    expect(resolveItemRect(layout, inBath, 'flask')).toEqual({
      x: 1067,
      y: 479,
      w: 132,
      h: 161,
    })
    expect(itemSides(layout, inBath, 'flask')).toEqual({
      labelSide: 'left',
      actionSide: 'right',
    })
  })

  it('carries the thermometer with the flask, its bulb inside the glass', () => {
    const inBath = moved({ flask: 'bath', thermometer: 'flask' })
    const flask = resolveItemRect(layout, inBath, 'flask')
    const thermometer = resolveItemRect(layout, inBath, 'thermometer')
    expect(thermometer).toEqual({ x: 1113, y: 423, w: 40, h: 210 })
    expect(thermometer && flask && thermometer.y + thermometer.h).toBeLessThan(
      flask ? flask.y + flask.h : 0,
    )
    expect(carriedBy(inBath, 'bath')).toEqual(['flask', 'thermometer'])
    expect(carriedBy(inBath, 'flask')).toEqual(['thermometer'])
  })
})

describe('motion', () => {
  const moving: SceneLayout = {
    home: {
      cart: { x: 0, y: 500, w: 100, h: 50 },
      box: { x: 900, y: 900, w: 20, h: 20 },
      spring: { x: 300, y: 100, w: 40, h: 150 },
    },
    zones: { track: { x: 0, y: 500, w: 1000, h: 50 } },
    attach: {},
    motion: {
      cart: (base, { at, view }) =>
        at === 'track'
          ? { rect: { ...base, x: Number(view.cart?.position ?? 0) } }
          : {},
      // Sits on top of its parent's final box, without an attach offset.
      box: (base, { parent }) =>
        parent
          ? {
              rect: { ...base, x: parent.x, y: parent.y - base.h },
              labelSide: 'above',
            }
          : {},
      spring: (base, { view }) => ({
        rect: { ...base, h: Number(view.spring?.length ?? base.h) },
        rotate: Number(view.spring?.angle ?? 0),
        action: { x: 1, y: 2, w: 3, h: 4 },
      }),
    },
  }

  it('moves an item with its view', () => {
    const items = itemsAt({ cart: 'track' })
    expect(
      resolveItemRect(moving, items, 'cart', { cart: { position: 250 } }),
    ).toEqual({ x: 250, y: 500, w: 100, h: 50 })
  })

  it('places an attached item from its parent’s moved box', () => {
    const items = itemsAt({ cart: 'track', box: 'cart' })
    const view = { cart: { position: 250 } }
    const rect = resolveItemRect(moving, items, 'box', view)
    expect(rect).toEqual({ x: 250, y: 480, w: 20, h: 20, labelSide: 'above' })
    expect(itemSides(moving, items, 'box', rect).labelSide).toBe('above')
  })

  it('keeps the drawing size of a resized, turned item', () => {
    const items = itemsAt({ spring: 'shelf' })
    const rect = resolveItemRect(moving, items, 'spring', {
      spring: { length: 200, angle: 90 },
    })
    expect(rect).toMatchObject({
      x: 220,
      y: 180,
      w: 200,
      h: 40,
      rotate: 90,
      size: { w: 40, h: 200 },
      action: { x: 1, y: 2, w: 3, h: 4 },
    })
  })

  it('still skips an attached item with neither offset nor motion', () => {
    const items = itemsAt({ cart: 'track', spring: 'cart' })
    const still = { ...moving, motion: { cart: moving.motion!.cart } }
    expect(resolveItemRect(still, items, 'spring')).toBeUndefined()
  })
})
