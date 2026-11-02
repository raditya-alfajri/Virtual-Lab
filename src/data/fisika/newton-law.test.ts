import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import {
  acceleration,
  accelerationFromTime,
  newtonLaw as exp,
  speedAfter,
  travelTime,
} from './newton-law'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (id: string, target: string): EngineAction => ({
  type: 'drop',
  id,
  target,
})
const tap = (id: string): EngineAction => ({ type: 'use', id })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const start = () => createInitialState(exp)
const ticks = (n: number, dt = 0.1) => Array.from({ length: n }, () => tick(dt))

// Troli di start, sensor di 1 m, satu kipas, beban opsional, lalu dilepas sampai berhenti.
const launch = (fan: string, ...weights: string[]) => [
  drop('cart', 'start'),
  drop('sensor', 'sensor-1m'),
  drop(fan, 'cart'),
  ...weights.map((w) => drop(w, 'cart')),
  tap('cart'),
  ...ticks(40),
]

describe('F1 Hukum Newton: formulas', () => {
  it('a = F ÷ m and back from the sensor time', () => {
    expect(acceleration(10, 0.5)).toBe(20)
    expect(acceleration(2, 2)).toBe(1)
    const t = travelTime(1, 4)
    expect(t).toBeCloseTo(0.7071, 4)
    expect(accelerationFromTime(1, t)).toBeCloseTo(4)
    expect(speedAfter(4, 2)).toBe(8)
  })
})

describe('F1 Hukum Newton: measurements', () => {
  it.each([
    ['fan-2', [], 2, 0.5, 0.71, 4, 8],
    ['fan-4', ['weight-500-1'], 4, 1, 0.71, 4, 8],
    ['fan-2', ['weight-1000-1', 'weight-500-1'], 2, 2, 1.41, 1, 2],
    [
      'fan-10',
      ['weight-1000-1', 'weight-1000-2', 'weight-500-1'],
      10,
      3,
      0.77,
      3.33,
      6.67,
    ],
  ])(
    '%s with %j → a = F ÷ m',
    (fan, weights, gaya, massa, waktu, percepatan, kecepatan) => {
      const s = run(start(), ...launch(fan, ...weights))
      expect(s.rows).toEqual([{ gaya, massa, waktu, percepatan, kecepatan }])
      expect(s.explanation?.result).toContain(`${gaya} N`)
      expect(s.explanation?.formula).toBe('a = F ÷ m · a = 2s ÷ t²')
      expect(exp.isActive(s.world)).toBe(false)
    },
  )

  it('records the exact crossing time whatever the tick size', () => {
    const small = run(start(), ...launch('fan-6', 'weight-500-1'))
    const big = run(
      start(),
      drop('cart', 'start'),
      drop('sensor', 'sensor-1m'),
      drop('fan-6', 'cart'),
      drop('weight-500-1', 'cart'),
      tap('cart'),
      tick(1),
    )
    expect(big.rows).toEqual(small.rows)
  })

  it('accelerates gradually and passes the sensor only after some time', () => {
    let s = run(
      start(),
      drop('cart', 'start'),
      drop('sensor', 'sensor-1m'),
      drop('fan-2', 'cart'),
      tap('cart'),
      tick(0.3),
    )
    const first = Number(exp.view(s.world).cart.position)
    expect(first).toBeCloseTo(0.5 * 4 * 0.09)
    expect(s.rows).toHaveLength(0)
    s = run(s, tick(0.3))
    expect(Number(exp.view(s.world).cart.position)).toBeGreaterThan(first * 3)
    s = run(s, ...ticks(10))
    expect(s.rows).toHaveLength(1)
    expect(exp.view(s.world).sensor.reading).toBe('0,71 s')
  })

  it('does not duplicate a repeated trial and can be repeated from the start', () => {
    let s = run(start(), ...launch('fan-2'))
    s = run(s, drop('cart', 'start'), tap('cart'), ...ticks(40))
    expect(s.rows).toHaveLength(1)
    s = run(
      s,
      drop('cart', 'start'),
      drop('weight-500-1', 'cart'),
      tap('cart'),
      ...ticks(40),
    )
    expect(s.rows.map((r) => r.massa)).toEqual([0.5, 1])
  })

  it('stacks a weight onto a weight on the cart', () => {
    const s = run(
      start(),
      drop('weight-500-1', 'cart'),
      drop('weight-1000-1', 'weight-500-1'),
    )
    expect(s.world.items['weight-1000-1'].at).toBe('cart')
    expect(exp.view(s.world).cart.label).toBe('Troli · 2,0 kg')
  })

  it('returns the cart with its fan and weights to the shelf', () => {
    const s = run(
      start(),
      ...launch('fan-2', 'weight-500-1'),
      drop('cart', 'shelf'),
    )
    const fresh = start().world.items
    for (const id of ['cart', 'fan-2', 'weight-500-1']) {
      expect(s.world.items[id]).toEqual(fresh[id])
    }
    expect(s.world.items.sensor.at).toBe('sensor-1m')
  })
})

describe('F1 Hukum Newton: educational rejections', () => {
  const hint = (s: EngineState) => s.hint?.text

  it('total mass at most 3 kg', () => {
    const s = run(
      start(),
      drop('weight-1000-1', 'cart'),
      drop('weight-1000-2', 'cart'),
      drop('weight-500-1', 'cart'),
      drop('weight-500-2', 'cart'),
    )
    expect(hint(s)).toBe(
      'Total massa troli dan beban paling besar 3 kg. Sekarang sudah 3,0 kg.',
    )
    expect(s.world.items['weight-500-2'].at).toBe('shelf')
  })

  it('only one fan at a time', () => {
    const s = run(start(), drop('fan-2', 'cart'), drop('fan-4', 'cart'))
    expect(hint(s)).toContain('hanya boleh memakai satu kipas')
    expect(s.world.items['fan-4'].at).toBe('shelf')
  })

  it('the cart does not move without a fan or outside the start', () => {
    let s = run(start(), drop('cart', 'start'), tap('cart'))
    expect(hint(s)).toBe(
      'Troli tidak bergerak tanpa gaya. Pasang kipas di belakang troli dulu.',
    )
    expect(exp.isActive(s.world)).toBe(false)
    s = run(start(), drop('fan-2', 'cart'), tap('cart'))
    expect(hint(s)).toBe('Taruh troli di titik start dulu.')
    s = run(start(), drop('cart', 'track'))
    expect(hint(s)).toContain('Taruh troli di titik start')
  })

  it('nothing can be changed while the cart is moving', () => {
    const s = run(
      start(),
      drop('cart', 'start'),
      drop('fan-2', 'cart'),
      tap('cart'),
      tick(0.1),
      drop('weight-500-1', 'cart'),
    )
    expect(hint(s)).toContain('Troli sedang melaju')
    expect(s.world.items['weight-500-1'].at).toBe('shelf')
  })

  it('warns when the sensor is missing and records nothing', () => {
    const s = run(
      start(),
      drop('cart', 'start'),
      drop('fan-2', 'cart'),
      tap('cart'),
      ...ticks(20),
    )
    expect(s.rows).toHaveLength(0)
    expect(hint(s)).toContain('Sensor belum dipasang')
  })

  it('asks to drag the cart back after a run', () => {
    const s = run(start(), ...launch('fan-2'), tap('cart'))
    expect(hint(s)).toBe('Seret troli kembali ke titik start untuk mengulang.')
  })
})
