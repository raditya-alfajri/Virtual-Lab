import { describe, expect, it } from 'vitest'
import { createInitialState, runEngine, type EngineAction } from '../lib/engine'
import { newtonLaw } from './fisika/newton-law'
import { ALL_EXPERIMENTS } from './index'

describe('the next-step guide', () => {
  it.each(ALL_EXPERIMENTS.map((exp) => [exp.title, exp] as const))(
    '%s opens with a step about an item on the bench',
    (_, exp) => {
      const state = createInitialState(exp)
      const step = exp.guide?.(state.world, state.rows)
      expect(step?.text).toBeTruthy()
      expect(step?.text.length).toBeLessThanOrEqual(90)
      expect(exp.items.map((item) => item.id)).toContain(step?.target)
    },
  )

  it('walks through a Newton run one step at a time', () => {
    const exp = newtonLaw
    let state = createInitialState(exp)
    const next = () => exp.guide?.(state.world, state.rows) ?? null
    const act = (...actions: EngineAction[]) => {
      for (const action of actions) state = runEngine(exp, state, action)
    }
    const drop = (sourceId: string, targetId: string): EngineAction => ({
      type: 'drop',
      sourceId,
      targetId,
    })

    expect(next()?.target).toBe('cart')
    act(drop('cart', 'start'))
    expect(next()?.text).toMatch(/kipas/)
    act(drop(next()!.target!, 'cart'))
    expect(next()?.target).toBe('sensor')
    act(drop('sensor', 'sensor-1m'))
    expect(next()).toEqual({
      text: 'Siap! Ketuk troli untuk melepasnya.',
      target: 'cart',
    })

    act({ type: 'use', itemId: 'cart' })
    expect(next()).toBeNull()
    act(
      ...Array.from({ length: 40 }, () => ({ type: 'tick', dt: 0.1 }) as const),
    )
    expect(state.rows).toHaveLength(1)
    expect(next()?.text).toMatch(/kembali ke titik start/)

    // The same set-up again would only repeat the row.
    act(drop('cart', 'start'))
    expect(next()?.text).toMatch(/sudah tercatat/)
  })
})
