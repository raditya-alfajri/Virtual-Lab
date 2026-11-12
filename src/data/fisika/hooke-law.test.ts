import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import {
  extension,
  hookeLaw as exp,
  springConstant,
  weightForce,
} from './hooke-law'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const settle = () => Array.from({ length: 4 }, () => tick(0.5))
const start = () => createInitialState(exp)

const setup = (spring: string) => [
  drop(spring, 'clamp'),
  drop('ruler', 'spring-side'),
  drop('hanger', spring),
]
const add = (n: number) =>
  Array.from({ length: n }, (_, i) => drop(`mass-${i + 1}`, 'hanger'))

describe('F3 Hukum Hooke: formulas', () => {
  it('F = m × g and Δx = F ÷ k', () => {
    expect(weightForce(50)).toBeCloseTo(0.49)
    expect(extension(0.49, 20)).toBeCloseTo(0.0245)
    expect(springConstant(0.98, 0.049)).toBeCloseTo(20)
  })
})

describe('F3 Hukum Hooke: measurements', () => {
  it.each([
    ['spring-a', 1, 50, 0.49, 0.0245, 20],
    ['spring-a', 3, 150, 1.47, 0.0735, 20],
    ['spring-a', 5, 250, 2.45, 0.1225, 20],
    ['spring-b', 2, 100, 0.98, 0.0245, 40],
    ['spring-b', 5, 250, 2.45, 0.0613, 40],
  ])('%s with %i × 50 g', (spring, n, massa, gaya, pertambahan, konstanta) => {
    const s = run(start(), ...setup(spring), ...add(n), ...settle())
    expect(s.rows.at(-1)).toEqual({ massa, gaya, pertambahan, konstanta })
    expect(s.explanation?.formula).toBe('F = k × Δx')
  })

  it('records one row per load while adding weights one by one', () => {
    const actions = Array.from({ length: 5 }, (_, i) => [
      drop(`mass-${i + 1}`, 'hanger'),
      ...settle(),
    ]).flat()
    const s = run(start(), ...setup('spring-a'), ...actions)
    expect(s.rows.map((r) => r.massa)).toEqual([50, 100, 150, 200, 250])
    expect(s.rows.every((r) => r.konstanta === 20)).toBe(true)
  })

  it('oscillates before coming to rest and only records when still', () => {
    let s = run(start(), ...setup('spring-a'), ...add(2), tick(0.1))
    expect(s.world.items['spring-a'].state.moving).toBe(true)
    expect(s.rows).toHaveLength(0)
    const moving = Number(exp.view(s.world)['spring-a'].extension)
    expect(moving).not.toBeCloseTo(0.049, 3)
    s = run(s, ...settle())
    expect(s.world.items['spring-a'].state.moving).toBe(false)
    expect(exp.view(s.world)['spring-a'].extension).toBe(0.049)
    expect(exp.view(s.world).ruler.label).toBe('Panjang 14,90 cm · Δx 4,90 cm')
    expect(s.rows).toHaveLength(1)
  })

  it('records when the ruler is attached after the spring is still', () => {
    let s = run(
      start(),
      drop('spring-b', 'clamp'),
      drop('hanger', 'spring-b'),
      ...add(4),
      ...settle(),
    )
    expect(s.rows).toHaveLength(0)
    expect(s.hint).toContain('Pasang mistar')
    s = run(s, drop('ruler', 'spring-side'))
    expect(s.rows).toEqual([
      { massa: 200, gaya: 1.96, pertambahan: 0.049, konstanta: 40 },
    ])
  })

  it('stacks masses on masses and through the spring, and unloads to the shelf', () => {
    let s = run(
      start(),
      ...setup('spring-a'),
      drop('mass-1', 'spring-a'),
      drop('mass-2', 'mass-1'),
      ...settle(),
    )
    expect(s.rows.at(-1)?.massa).toBe(100)
    s = run(s, drop('mass-2', 'shelf'), ...settle())
    expect(s.rows.at(-1)?.massa).toBe(50)
    expect(exp.view(s.world)['spring-a'].extension).toBe(0.0245)
    s = run(s, drop('hanger', 'shelf'), ...settle())
    expect(s.world.items['mass-1'].at).toBe('shelf')
    expect(exp.view(s.world)['spring-a'].extension).toBe(0)
    s = run(s, drop('spring-a', 'shelf'), drop('spring-b', 'clamp'))
    expect(s.world.items['spring-b'].at).toBe('clamp')
  })
})

describe('F3 Hukum Hooke: educational rejections', () => {
  const hint = (s: EngineState) => s.hint

  it('rejects a load above 250 g', () => {
    const s = run(start(), ...setup('spring-a'), ...add(6))
    expect(hint(s)).toBe(
      'Beban paling besar 250 g agar pegas tetap dalam batas elastis.',
    )
    expect(s.world.items['mass-6'].at).toBe('shelf')
  })

  it('cannot change a spring that still carries a load', () => {
    const s = run(
      start(),
      ...setup('spring-a'),
      ...add(1),
      drop('spring-a', 'shelf'),
    )
    expect(hint(s)).toBe('Lepas semua beban dulu sebelum mengganti pegas.')
    expect(s.world.items['spring-a'].at).toBe('clamp')
  })

  it('needs the spring on the clamp and the hanger on the spring', () => {
    let s = run(start(), drop('hanger', 'spring-a'))
    expect(hint(s)).toBe('Gantung pegas di statif dulu.')
    s = run(start(), drop('spring-a', 'clamp'), drop('mass-1', 'spring-a'))
    expect(hint(s)).toBe('Pasang gantungan beban di ujung pegas dulu.')
    s = run(start(), drop('spring-a', 'clamp'), drop('spring-b', 'clamp'))
    expect(hint(s)).toBe('Penjepit statif sudah penuh.')
  })
})
