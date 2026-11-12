import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import { angleAt, period, simplePendulum as exp } from './simple-pendulum'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const pull = (itemId: string, value: number): EngineAction => ({
  type: 'pull',
  itemId,
  value,
})
const release = (itemId: string): EngineAction => ({
  type: 'release',
  itemId,
})
const tap = (itemId: string): EngineAction => ({ type: 'use', itemId })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const ticks = (seconds: number, dt = 0.5) =>
  Array.from({ length: Math.ceil(seconds / dt) }, () => tick(dt))
const start = () => createInitialState(exp)

const hang = (string: string, bob: string) => [
  drop(string, 'clamp'),
  drop(bob, string),
]
const swing = (string: string, bob: string, angle = 10) => [
  ...hang(string, bob),
  pull(bob, angle),
  release(bob),
]
// Swing, put the stopwatch on the stand, then wait for 10 swings.
const measure = (string: string, bob: string) => [
  ...swing(string, bob),
  drop('stopwatch', 'stand'),
  ...ticks(25),
]

describe('F2 Ayunan Sederhana: formulas', () => {
  it('T = 2π √(L ÷ g)', () => {
    expect(period(1)).toBeCloseTo(2.007, 3)
    expect(period(0.2)).toBeCloseTo(0.8976, 4)
    expect(period(0.8) / period(0.2)).toBeCloseTo(2)
  })

  it('swings back and forth between ±amplitude', () => {
    const T = period(0.4)
    expect(angleAt(10, 0.4, 0)).toBeCloseTo(10)
    expect(angleAt(10, 0.4, T / 2)).toBeCloseTo(-10)
    expect(angleAt(10, 0.4, T)).toBeCloseTo(10)
  })
})

describe('F2 Ayunan Sederhana: measurements', () => {
  it.each([
    ['string-20', 0.2, 8.98, 0.9, 0.81],
    ['string-40', 0.4, 12.69, 1.27, 1.61],
    ['string-60', 0.6, 15.55, 1.55, 2.42],
    ['string-80', 0.8, 17.95, 1.8, 3.22],
    ['string-100', 1, 20.07, 2.01, 4.03],
  ])(
    '%s → T = 2π √(L ÷ g)',
    (string, panjang, waktu, periode, periodeKuadrat) => {
      const s = run(start(), ...measure(string, 'bob-100'))
      expect(s.rows).toEqual([
        { panjang, massa: 100, waktu, periode, periodeKuadrat },
      ])
      expect(s.explanation?.formula).toBe('T = 2π × √(L ÷ g)')
      expect(exp.view(s.world).stopwatch.label).toBe('10/10 ayunan')
    },
  )

  it('the period does not depend on the bob mass', () => {
    const light = run(start(), ...measure('string-60', 'bob-50'))
    const heavy = run(start(), ...measure('string-60', 'bob-200'))
    expect(light.rows[0].periode).toBe(heavy.rows[0].periode)
    expect(light.rows[0].massa).not.toBe(heavy.rows[0].massa)
  })

  it('counts swings gradually and keeps swinging after the count', () => {
    let s = run(
      start(),
      ...swing('string-100', 'bob-100'),
      drop('stopwatch', 'stand'),
    )
    s = run(s, ...ticks(5))
    expect(exp.view(s.world).stopwatch.label).toBe('2/10 ayunan')
    expect(s.rows).toHaveLength(0)
    s = run(s, ...ticks(20))
    expect(s.rows).toHaveLength(1)
    expect(exp.view(s.world).stopwatch.reading).toBe('20,07 s')
    expect(s.world.items['bob-100'].state.swinging).toBe(true)
  })

  it('tapping the stopwatch counts again without duplicating rows', () => {
    let s = run(start(), ...measure('string-40', 'bob-50'))
    s = run(s, tap('stopwatch'), tap('stopwatch'), ...ticks(15))
    expect(s.rows).toHaveLength(1)
  })

  it('shows the protractor angle and lets the bob be stopped', () => {
    let s = run(start(), ...hang('string-40', 'bob-50'), pull('bob-50', -12))
    expect(exp.view(s.world).protractor.label).toBe('12°')
    s = run(s, release('bob-50'), tick(period(0.4) / 2))
    // Pulled left (−12°), it is on the right half a period later.
    expect(exp.view(s.world)['bob-50'].angle).toBeCloseTo(12)
    s = run(s, tap('bob-50'))
    expect(s.world.items['bob-50'].state.swinging).toBe(false)
    expect(exp.view(s.world)['bob-50'].angle).toBe(0)
  })

  it('hints how to start when the stopwatch is placed first', () => {
    let s = run(start(), drop('stopwatch', 'stand'))
    expect(s.hint).toContain('Stopwatch siap')
    s = run(s, ...swing('string-20', 'bob-50'), tap('stopwatch'), ...ticks(10))
    expect(s.rows).toHaveLength(1)
  })
})

describe('F2 Ayunan Sederhana: educational rejections', () => {
  const hint = (s: EngineState) => s.hint

  it('rejects an angle above 15°', () => {
    const s = run(start(), ...hang('string-40', 'bob-50'), pull('bob-50', 20))
    expect(hint(s)).toContain('Simpangan paling besar 15°')
    expect(s.world.items['bob-50'].state.angle).toBe(0)
  })

  it('cannot change the string or bob while swinging', () => {
    let s = run(
      start(),
      ...swing('string-40', 'bob-50'),
      drop('string-40', 'shelf'),
    )
    expect(hint(s)).toBe(
      'Hentikan bandul dulu sebelum mengganti tali atau bandul.',
    )
    expect(s.world.items['string-40'].at).toBe('clamp')
    s = run(s, drop('bob-100', 'string-40'))
    expect(hint(s)).toBe(
      'Hentikan bandul dulu sebelum mengganti tali atau bandul.',
    )
    s = run(s, tap('bob-50'), drop('string-40', 'shelf'))
    expect(s.world.items['string-40'].at).toBe('shelf')
    expect(s.world.items['bob-50'].at).toBe('shelf')
  })

  it('needs a hanging bob, a pulled bob, and a swinging bob for counting', () => {
    let s = run(start(), pull('bob-50', 10))
    expect(hint(s)).toContain('Gantung tali di statif')
    s = run(start(), ...hang('string-40', 'bob-50'), release('bob-50'))
    expect(hint(s)).toBe('Tarik bandul ke samping dulu agar bisa berayun.')
    s = run(start(), drop('stopwatch', 'stand'), tap('stopwatch'))
    expect(hint(s)).toBe('Lepas bandul dulu agar ada ayunan yang dihitung.')
    s = run(start(), tap('stopwatch'))
    expect(hint(s)).toBe('Seret stopwatch ke statif dulu.')
  })

  it('one bob per string', () => {
    const s = run(
      start(),
      ...hang('string-40', 'bob-50'),
      drop('bob-100', 'string-40'),
    )
    expect(hint(s)).toBe('Ujung tali ini sudah ada bandulnya.')
  })

  it('pulling again stops the count so no wrong row is recorded', () => {
    const s = run(
      start(),
      ...swing('string-40', 'bob-50'),
      drop('stopwatch', 'stand'),
      ...ticks(5),
      pull('bob-50', 5),
      ...ticks(15),
    )
    expect(s.rows).toHaveLength(0)
    expect(s.world.items.stopwatch.state.counting).toBe(false)
  })
})
