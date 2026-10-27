import { describe, it, expect } from 'vitest'
import { runEngine, initialState, type EngineState } from './machine'
import { experiment_k1 } from './experiment'
import type { Input } from '../data/types'

const act = (state: EngineState, action: string, input: Input = {}) =>
    runEngine(experiment_k1, state, {type: 'action', action, input})


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
        ...experiment_k1,
        steps: experiment_k1.steps.map((s) => (s.compute ? { ...s, repeatFrom: 'l1' } : s)),
    }
    let s = runEngine(exp, initialState, { type: 'action', action: 'tube->rack', input: {} })
    s = runEngine(exp, s, { type: 'action', action: 'solution->tube', input: { solution: 'naoh' } })
    s = runEngine(exp, s, { type: 'action', action: 'indicator->tube', input: {} })
    expect(s.activeStep).toBe(0)
    expect(s.rows[0].values.sifat).toBe('basa')
    })

    it('resets to the initial state', () => {
    const s = act(initialState, 'tube->rack')
    expect(runEngine(experiment_k1, s, { type: 'reset' })).toEqual(initialState)
  })

})

