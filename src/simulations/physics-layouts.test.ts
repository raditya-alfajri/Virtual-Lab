import { describe, expect, it } from 'vitest'
import { hookeLaw } from '../data/fisika/hooke-law'
import { newtonLaw } from '../data/fisika/newton-law'
import { simplePendulum } from '../data/fisika/simple-pendulum'
import type { Experiment } from '../data/types'
import {
  createInitialState,
  getView,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../lib/engine'
import { getBackgroundUrl, getSceneLayout } from '.'
import { hookeLawLayout } from './hooke-law/layout'
import { newtonLawLayout } from './newton-law/layout'
import { itemSides, resolveItemRect } from './position'
import { PIVOT, simplePendulumLayout } from './simple-pendulum/layout'
import type { SceneLayout } from './types'

const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})

function setup(exp: Experiment, layout: SceneLayout, actions: EngineAction[]) {
  const state: EngineState = actions.reduce(
    (s, a) => runEngine(exp, s, a),
    createInitialState(exp),
  )
  const view = getView(exp, state)
  const items = state.world.items
  return {
    state,
    place: (id: string) => resolveItemRect(layout, items, id, view)!,
  }
}

describe.each([
  ['hukum-newton', newtonLaw, newtonLawLayout],
  ['ayunan-sederhana', simplePendulum, simplePendulumLayout],
  ['hukum-hooke', hookeLaw, hookeLawLayout],
] as const)('%s layout', (id, exp, layout) => {
  it('is registered with a background named after the experiment id', () => {
    expect(getSceneLayout(id)).toBe(layout)
    expect(getBackgroundUrl(id)).toBe(`/img/lab/${id}-bg.svg`)
  })

  it('places every item at the start', () => {
    const { items } = createInitialState(exp).world
    for (const itemId of Object.keys(items)) {
      expect(resolveItemRect(layout, items, itemId)).toBeDefined()
    }
  })
})

describe('newton layout', () => {
  it('rolls the cart along the track with its fan', () => {
    const { place } = setup(newtonLaw, newtonLawLayout, [
      drop('cart', 'start'),
      drop('fan-2', 'cart'),
      { type: 'use', itemId: 'cart' },
      { type: 'tick', dt: 0.5 },
    ])
    // a = 4 m/s², so after 0.5 s the cart is 0.5 m along: 300 px.
    expect(place('cart')).toEqual({ x: 540, y: 648, w: 150, h: 72 })
    expect(place('fan-2')).toMatchObject({ x: 466, y: 622 })
  })

  it('stacks weights in two columns on the cart, in list order', () => {
    const { place } = setup(newtonLaw, newtonLawLayout, [
      drop('cart', 'start'),
      drop('weight-500-1', 'cart'),
      drop('weight-1000-1', 'cart'),
      drop('weight-500-2', 'cart'),
    ])
    expect(place('weight-500-1')).toMatchObject({ x: 256, y: 634 })
    expect(place('weight-500-2')).toMatchObject({ x: 318, y: 634 })
    expect(place('weight-1000-1')).toMatchObject({ x: 256, y: 598 })
  })
})

describe('pendulum layout', () => {
  const hang = [drop('string-40', 'clamp'), drop('bob-50', 'string-40')]

  it('hangs a bob below a string on the board', () => {
    const { place } = setup(simplePendulum, simplePendulumLayout, [
      drop('bob-50', 'string-40'),
    ])
    const string = place('string-40')
    expect(place('bob-50')).toMatchObject({
      x: string.x + string.w / 2 - 14,
      y: string.y + string.h,
    })
  })

  it('swings the string and bob about the pivot', () => {
    const { place, state } = setup(simplePendulum, simplePendulumLayout, [
      ...hang,
      { type: 'pull', itemId: 'bob-50', value: 10 },
    ])
    const string = place('string-40')
    expect(string.rotate).toBe(-10)
    expect(string.size).toEqual({ w: 20, h: 200 })
    const bob = place('bob-50')
    expect(bob.rotate).toBe(-10)
    // The bob's centre lies on the swung string, right of the pivot.
    const cx = bob.x + bob.w / 2
    expect(cx).toBeGreaterThan(PIVOT.x)
    expect(bob.action).toMatchObject({ x: PIVOT.x - 14, y: PIVOT.y + 200 })
    expect(
      itemSides(simplePendulumLayout, state.world.items, 'bob-50', bob)
        .labelSide,
    ).toBe('right')
  })

  it('turns a pointer into an angle only for a hanging bob', () => {
    const pull = simplePendulumLayout.pull!['bob-50']
    const { state } = setup(simplePendulum, simplePendulumLayout, hang)
    expect(pull.active(state.world.items)).toBe(true)
    expect(pull.active(createInitialState(simplePendulum).world.items)).toBe(
      false,
    )
    expect(pull.value({ x: PIVOT.x + 100, y: PIVOT.y + 100 }, {})).toBe(45)
    expect(pull.value({ x: PIVOT.x - 100, y: PIVOT.y + 100 }, {})).toBe(-45)
  })

  it('puts the protractor on the pivot and the stopwatch by the stand', () => {
    const { place } = setup(simplePendulum, simplePendulumLayout, [
      drop('protractor', 'stand'),
      drop('stopwatch', 'stand'),
    ])
    expect(place('protractor')).toMatchObject({ x: PIVOT.x - 110 })
    expect(place('stopwatch')).toMatchObject({ x: 150, y: 556 })
  })
})

describe('hooke layout', () => {
  it('stretches the spring and hangs the loaded hanger from its end', () => {
    const { place } = setup(hookeLaw, hookeLawLayout, [
      drop('spring-a', 'clamp'),
      drop('hanger', 'spring-a'),
      drop('mass-1', 'hanger'),
      drop('mass-2', 'hanger'),
      ...Array.from({ length: 30 }, () => ({ type: 'tick', dt: 0.1 }) as const),
    ])
    // 100 g on k = 20 N/m: Δx = 0,049 m, so the spring is 0,149 m long.
    const spring = place('spring-a')
    expect(spring).toMatchObject({ x: 725, y: 190, w: 40 })
    expect(spring.h).toBeCloseTo(223.5)
    const hanger = place('hanger')
    expect(hanger.y).toBeCloseTo(190 + 223.5 - 3)
    expect(place('mass-1').y).toBeCloseTo(hanger.y + 96 - 18)
    expect(place('mass-2').y).toBeCloseTo(hanger.y + 96 - 36)
  })
})
