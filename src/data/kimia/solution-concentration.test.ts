import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import {
  molarity,
  moles,
  shadeOf,
  solutionConcentration as exp,
} from './solution-concentration'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (id: string, target: string): EngineAction => ({
  type: 'drop',
  id,
  target,
})
const tap = (id: string): EngineAction => ({ type: 'use', id })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const times = (n: number, ...actions: EngineAction[]) =>
  Array.from({ length: n }, () => actions).flat()
const start = () => createInitialState(exp)
const hint = (s: EngineState) => s.hint?.text
const beaker = (s: EngineState) => s.world.items.beaker.state

const setup = [
  drop('watch-glass', 'balance'),
  drop('beaker', 'bench'),
  drop('cylinder', 'bench'),
]
// Satu sendok: ambil CuSO₄ lalu tuang ke kaca arloji di neraca.
const scoop = (spoon: 'spoon-small' | 'spoon-large', n = 1) =>
  times(n, drop(spoon, 'cuso4'), drop(spoon, 'watch-glass'))
const weigh = (grams: number) => [
  ...scoop('spoon-large', Math.floor(grams / 4)),
  ...scoop('spoon-small', grams % 4),
  drop('watch-glass', 'beaker'),
]
const measureWater = (ml: number) => [
  ...times(ml / 50, drop('water', 'cylinder')),
  drop('cylinder', 'beaker'),
]
const stirUntilDissolved = [
  drop('stirrer', 'beaker'),
  ...times(4, tap('stirrer')),
  ...times(5, tick(1)),
]
const solution = (grams: number, ml: number) => [
  ...setup,
  ...weigh(grams),
  ...measureWater(ml),
  ...stirUntilDissolved,
]

describe('K2 Konsentrasi Larutan: formula', () => {
  it.each([
    [16, 100, 1],
    [16, 50, 2],
    [8, 100, 0.5],
    [4, 250, 0.1],
    [1, 250, 0.025],
  ])('%s g in %s mL → %s M', (mass, ml, m) => {
    expect(molarity(mass, ml)).toBeCloseTo(m, 10)
  })

  it('uses Mr = 160 for moles', () => {
    expect(moles(16)).toBeCloseTo(0.1, 10)
    expect(moles(1)).toBeCloseTo(0.00625, 10)
  })

  it('gets darker as the concentration rises', () => {
    expect(shadeOf(0.025).name).toBe('biru sangat muda')
    expect(shadeOf(1).name).toBe('biru tua')
  })
})

describe('K2 Konsentrasi Larutan: process', () => {
  it('records a row when CuSO₄ is fully dissolved', () => {
    const s = run(start(), ...solution(16, 100))
    expect(s.rows).toEqual([
      {
        massa: 16,
        volume: 100,
        mol: 0.1,
        konsentrasi: 1,
        warna: 'biru tua',
      },
    ])
    expect(s.explanation?.result).toContain('= 1 M')
    expect(s.explanation?.reason).toContain('Molaritas')
    expect(s.explanation?.formula).toBe('M = (m ÷ Mr) ÷ V')
    expect(exp.view(s.world).beaker.label).toBe('Larut sempurna · biru tua')
  })

  it('reads mass on the balance and volume on the measuring cylinder', () => {
    let s = run(start(), ...setup, ...scoop('spoon-large', 2))
    expect(exp.view(s.world)['watch-glass'].reading).toBe('8,00 g')
    s = run(s, ...times(3, drop('water', 'cylinder')))
    expect(exp.view(s.world).cylinder.reading).toBe('150 mL')
  })

  it('gives the same result in any order', () => {
    const waterFirst = run(
      start(),
      drop('cylinder', 'bench'),
      drop('beaker', 'bench'),
      ...measureWater(200),
      drop('watch-glass', 'balance'),
      ...weigh(5),
      ...stirUntilDissolved,
    )
    const soluteFirst = run(start(), ...solution(5, 200))
    expect(waterFirst.rows).toEqual(soluteFirst.rows)
    expect(waterFirst.rows[0]).toMatchObject({
      massa: 5,
      volume: 200,
      mol: 0.03125,
      konsentrasi: 0.156,
    })
  })

  it('dissolves gradually while being stirred, without a row before it is done', () => {
    let s = run(
      start(),
      ...setup,
      ...weigh(8),
      ...measureWater(100),
      drop('stirrer', 'beaker'),
    )
    const before = exp.view(s.world).beaker.color
    expect(exp.isActive(s.world)).toBe(true)

    s = run(s, tick(0.5))
    expect(exp.view(s.world).beaker.label).toBe('Melarut… 10%')
    s = run(s, tick(0.5))
    expect(exp.isActive(s.world)).toBe(false)
    expect(exp.view(s.world).beaker.label).toBe('Aduk lagi · 20%')
    expect(exp.view(s.world).beaker.color).not.toBe(before)
    expect(s.rows).toHaveLength(0)

    s = run(s, ...times(3, tap('stirrer')), ...times(3, tick(1)))
    expect(s.rows).toHaveLength(0)
    s = run(s, tap('stirrer'), ...times(10, tick(0.1)))
    expect(s.rows).toHaveLength(1)
    expect(exp.isActive(s.world)).toBe(false)
  })

  it('finishes exactly even with many small ticks', () => {
    const s = run(
      start(),
      ...setup,
      ...weigh(16),
      ...measureWater(100),
      drop('stirrer', 'beaker'),
      ...times(4, tap('stirrer')),
      ...times(50, tick(0.1)),
    )
    expect(s.rows).toHaveLength(1)
    expect(beaker(s).progress).toBe(1)
  })

  it('dilution needs stirring again and adds a new row', () => {
    let s = run(start(), ...solution(16, 100), ...measureWater(100))
    expect(s.rows).toHaveLength(1)
    expect(exp.view(s.world).beaker.label).toBe('Belum larut, aduk')

    s = run(s, ...times(5, tap('stirrer')), ...times(5, tick(1)))
    expect(s.rows).toEqual([
      expect.objectContaining({ volume: 100, konsentrasi: 1 }),
      {
        massa: 16,
        volume: 200,
        mol: 0.1,
        konsentrasi: 0.5,
        warna: 'biru pekat',
      },
    ])
    expect(s.explanation?.reason).toContain('diencerkan')
  })

  it('does not record the same solution twice', () => {
    const s = run(
      start(),
      ...solution(4, 100),
      drop('beaker', 'shelf'),
      drop('beaker', 'bench'),
      ...weigh(4),
      ...measureWater(100),
      ...stirUntilDissolved,
    )
    expect(s.rows).toHaveLength(1)
  })

  it('cleans the beaker and the stirrer inside it on the shelf', () => {
    const s = run(start(), ...solution(4, 100), drop('beaker', 'shelf'))
    expect(s.world.items.beaker).toEqual(start().world.items.beaker)
    expect(s.world.items.stirrer.at).toBe('shelf')
  })
})

describe('K2 Konsentrasi Larutan: educational rejections', () => {
  it('limits mass to 16 g on the watch glass and in the beaker', () => {
    let s = run(
      start(),
      ...setup,
      ...scoop('spoon-large', 4),
      ...scoop('spoon-small'),
    )
    expect(hint(s)).toBe(
      'Massa CuSO₄ paling banyak 16 g. Di kaca arloji sudah ada 16 g.',
    )
    expect(s.world.items['watch-glass'].state.mass).toBe(16)

    s = run(start(), ...setup, ...weigh(16), ...scoop('spoon-small'))
    s = run(s, drop('watch-glass', 'beaker'))
    expect(hint(s)).toBe(
      'Gelas kimia paling banyak berisi 16 g CuSO₄. Sekarang sudah ada 16 g.',
    )
    expect(beaker(s).solute).toBe(16)
  })

  it('limits volume to 250 mL in the cylinder and in the beaker', () => {
    let s = run(start(), ...setup, ...times(6, drop('water', 'cylinder')))
    expect(hint(s)).toBe('Gelas ukur sudah berisi 250 mL, batas skalanya.')
    expect(s.world.items.cylinder.state.volume).toBe(250)

    s = run(start(), ...setup, ...measureWater(250), ...measureWater(50))
    expect(hint(s)).toBe(
      'Volume larutan paling banyak 250 mL. Di gelas kimia sudah ada 250 mL air.',
    )
    expect(beaker(s).water).toBe(250)
  })

  it('only takes mass from the balance and volume from the cylinder', () => {
    let s = run(
      start(),
      drop('spoon-small', 'cuso4'),
      drop('spoon-small', 'watch-glass'),
    )
    expect(hint(s)).toBe(
      'Taruh kaca arloji di neraca dulu agar massa CuSO₄ terbaca.',
    )
    s = run(
      start(),
      ...setup,
      drop('spoon-small', 'cuso4'),
      drop('spoon-small', 'beaker'),
    )
    expect(hint(s)).toContain('Timbang CuSO₄ di kaca arloji')
    s = run(start(), ...setup, drop('cuso4', 'beaker'))
    expect(hint(s)).toBe('Ambil CuSO₄ dengan sendok.')
    s = run(start(), ...setup, drop('water', 'beaker'))
    expect(hint(s)).toBe(
      'Ukur air dengan gelas ukur dulu agar volumenya diketahui.',
    )
    expect(beaker(s)).toEqual(start().world.items.beaker.state)
  })

  it('rejects impossible pours', () => {
    let s = run(start(), ...setup, drop('spoon-large', 'watch-glass'))
    expect(hint(s)).toBe('Sendok masih kosong. Ambil CuSO₄ dari wadahnya dulu.')
    s = run(start(), ...setup, drop('watch-glass', 'beaker'))
    expect(hint(s)).toBe('Kaca arloji masih kosong. Timbang CuSO₄ dulu.')
    s = run(start(), ...setup, drop('cylinder', 'beaker'))
    expect(hint(s)).toBe(
      'Gelas ukur masih kosong. Isi dulu dari botol air suling.',
    )
    s = run(start(), drop('water', 'cylinder'))
    expect(hint(s)).toContain('Taruh gelas ukur di meja kerja dulu')
    s = run(
      start(),
      drop('watch-glass', 'balance'),
      drop('cylinder', 'bench'),
      ...scoop('spoon-small'),
      drop('watch-glass', 'beaker'),
    )
    expect(hint(s)).toBe('Taruh gelas kimia di meja kerja dulu.')
  })

  it('stirring an empty or incomplete beaker has no effect', () => {
    let s = run(start(), ...setup, drop('stirrer', 'beaker'))
    expect(hint(s)).toBe(
      'Gelas kimia masih kosong. Mengaduk gelas kosong tidak berpengaruh.',
    )
    expect(s.world.items.stirrer.at).toBe('shelf')
    expect(exp.isActive(s.world)).toBe(false)

    s = run(start(), ...setup, ...measureWater(50), drop('stirrer', 'beaker'))
    expect(hint(s)).toContain('Belum ada CuSO₄')
    s = run(start(), ...setup, ...weigh(1), drop('stirrer', 'beaker'))
    expect(hint(s)).toContain('Belum ada air')
    s = run(start(), ...solution(4, 100), tap('stirrer'))
    expect(hint(s)).toContain('sudah larut sempurna')
    s = run(start(), tap('stirrer'))
    expect(hint(s)).toBe('Masukkan batang pengaduk ke gelas kimia dulu.')
  })
})
