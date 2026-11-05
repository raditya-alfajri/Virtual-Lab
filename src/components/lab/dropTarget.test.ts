import { describe, it, expect } from 'vitest'
import { reactionRate } from '../../data/kimia/reaction-rate'
import { solutionConcentration } from '../../data/kimia/solution-concentration'
import { dropTarget } from './dropTarget'

// Labu di kertas silang, termometer terpasang di labu.
const items = {
  flask: { at: 'paper' },
  paper: { at: 'bench' },
  thermometer: { at: 'flask' },
  hcl: { at: 'shelf' },
  'thio-010': { at: 'shelf' },
  stopwatch: { at: 'shelf' },
}

describe('dropTarget', () => {
  it('passes a drop on an attached item through to its holder', () => {
    expect(dropTarget(reactionRate, items, 'hcl', 'thermometer')).toBe('flask')
    expect(dropTarget(reactionRate, items, 'thio-010', 'thermometer')).toBe(
      'flask',
    )
  })

  it('keeps items that are not attached, zones and the shelf', () => {
    expect(dropTarget(reactionRate, items, 'hcl', 'flask')).toBe('flask')
    expect(dropTarget(reactionRate, items, 'thermometer', 'bench')).toBe(
      'bench',
    )
    expect(dropTarget(reactionRate, items, 'hcl', 'shelf')).toBe('shelf')
    expect(dropTarget(reactionRate, items, 'stopwatch', 'paper')).toBe('paper')
  })

  it('passes through several levels until something fits', () => {
    // Labu sendiri menempel di kertas; stopwatch tidak cocok dengan apa pun.
    expect(dropTarget(reactionRate, items, 'stopwatch', 'thermometer')).toBe(
      'paper',
    )
  })

  it('works for the stirrer in the beaker (K2)', () => {
    const k2 = { stirrer: { at: 'beaker' }, beaker: { at: 'bench' } }
    expect(dropTarget(solutionConcentration, k2, 'cylinder', 'stirrer')).toBe(
      'beaker',
    )
  })

  it('stops on cycles', () => {
    const cycle = { a: { at: 'b' }, b: { at: 'a' } }
    expect(['a', 'b']).toContain(dropTarget(reactionRate, cycle, 'hcl', 'a'))
  })
})
