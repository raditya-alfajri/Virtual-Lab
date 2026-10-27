import { describe, it, expect } from 'vitest'
import { runEngine, initialState, type EngineState } from './engine'
import { sampleK1 } from './sample-experiment'
import type { Input } from '../data/types'

const act = (state: EngineState, action: string, input: Input = {}) =>
  runEngine(sampleK1, state, { type: 'action', action, input })

describe('experiment engine', () => {
  it('shows a hint when the action is wrong', () => {
    const s = act(initialState, 'indicator->tube')
    expect(s.activeStep).toBe(0)
    expect(s.hint).not.toBeNull()
  })

  it('moves to the next step when the action is correct', () => {
    expect(act(initialState, 'tube->rack').activeStep).toBe(1)
  })

  it('adds an observation row on a compute step', () => {
    let s = act(initialState, 'tube->rack')
    s = act(s, 'solution->tube', { solution: 'cuka' })
    s = act(s, 'indicator->tube')
    expect(s.rows).toHaveLength(1)
    expect(s.rows[0].values.pH).toBe(3)
    expect(s.completed).toBe(true)
    expect(s.activeStep).toBe(1)
  })

  it('returns to the repeatFrom step after a compute step', () => {
    const exp = {
      ...sampleK1,
      steps: sampleK1.steps.map((s) =>
        s.compute ? { ...s, repeatFrom: 'l1' } : s,
      ),
    }
    let s = runEngine(exp, initialState, {
      type: 'action',
      action: 'tube->rack',
      input: {},
    })
    s = runEngine(exp, s, {
      type: 'action',
      action: 'solution->tube',
      input: { solution: 'naoh' },
    })
    s = runEngine(exp, s, {
      type: 'action',
      action: 'indicator->tube',
      input: {},
    })
    expect(s.activeStep).toBe(0)
    expect(s.rows[0].values.sifat).toBe('basa')
  })

  it('wraps to the first step when the last step is not a compute step', () => {
    const exp = {
      ...sampleK1,
      steps: [
        ...sampleK1.steps,
        {
          id: 'l4',
          instruction: 'Cuci tabung reaksi.',
          correctAction: 'tube->sink',
          explanation: 'Tabung bersih siap dipakai lagi.',
        },
      ].map((s) => (s.compute ? { ...s, repeatFrom: 'l4' } : s)),
    }
    let s = runEngine(exp, initialState, {
      type: 'action',
      action: 'tube->rack',
      input: {},
    })
    s = runEngine(exp, s, {
      type: 'action',
      action: 'solution->tube',
      input: { solution: 'cuka' },
    })
    s = runEngine(exp, s, {
      type: 'action',
      action: 'indicator->tube',
      input: {},
    })
    expect(s.activeStep).toBe(3)
    s = runEngine(exp, s, { type: 'action', action: 'tube->sink', input: {} })
    expect(s.activeStep).toBe(0)
    expect(s.completed).toBe(true)
    s = runEngine(exp, s, { type: 'action', action: 'tube->rack', input: {} })
    expect(s.activeStep).toBe(1)
  })

  it('resets to the initial state', () => {
    const s = act(initialState, 'tube->rack')
    expect(runEngine(sampleK1, s, { type: 'reset' })).toEqual(initialState)
  })
})
