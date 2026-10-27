import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import { acidBaseTest as exp } from './acid-base-test'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (id: string, target: string): EngineAction => ({
  type: 'drop',
  id,
  target,
})
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const start = () => createInitialState(exp)

// Tabung di rak, satu tetes larutan, indikator, tunggu warna stabil.
const prepare = (solution: string, tube = 'tube-1', rack = 'rack-1') => [
  drop(tube, rack),
  drop('pipette', solution),
  drop('pipette', tube),
  drop('pipette', 'sink'),
  drop('indicator', tube),
  tick(1),
]

describe('K1 Uji Asam & Basa: values from the PRD', () => {
  it.each([
    ['cuka', 'Cuka', 'merah', 3, 'asam'],
    ['air-jeruk', 'Air jeruk', 'jingga', 4, 'asam'],
    ['air-suling', 'Air suling', 'hijau', 7, 'netral'],
    ['air-sabun', 'Air sabun', 'biru', 10, 'basa'],
    ['naoh', 'NaOH encer', 'ungu', 13, 'basa'],
  ])('%s → pH %s', (id, larutan, warna, ph, sifat) => {
    const s = run(start(), ...prepare(id), drop('tube-1', 'ph-card'))
    expect(s.rows).toEqual([{ larutan, warna, ph, sifat }])
    expect(s.explanation?.result).toContain(`pH ${ph}`)
    expect(s.explanation?.reason).toBeTruthy()
    expect(exp.view(s.world)['tube-1'].label).toBe(`pH ${ph} · ${warna}`)
  })
})

describe('K1 Uji Asam & Basa: process', () => {
  it('changes color gradually and finishes within one second', () => {
    let s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('pipette', 'cuka'),
      drop('pipette', 'tube-1'),
      drop('indicator', 'tube-1'),
    )
    const before = exp.view(s.world)['tube-1'].color
    s = run(s, tick(0.5))
    const middle = exp.view(s.world)['tube-1']
    expect(middle.color).not.toBe(before)
    expect(middle.color).not.toBe('#E53935')
    expect(middle.label).toBe('Warna berubah…')
    expect(exp.isActive(s.world)).toBe(true)

    s = run(s, tick(0.5))
    expect(exp.view(s.world)['tube-1'].color).toBe('#E53935')
    expect(exp.isActive(s.world)).toBe(false)
  })

  it('accepts the indicator before the solution', () => {
    const s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('indicator', 'tube-1'),
      drop('pipette', 'naoh'),
      drop('pipette', 'tube-1'),
      tick(1),
      drop('tube-1', 'ph-card'),
    )
    expect(s.rows[0].ph).toBe(13)
  })

  it('uses up the pipette drop by drop', () => {
    let s = run(start(), drop('tube-1', 'rack-1'), drop('pipette', 'cuka'))
    expect(exp.view(s.world).pipette.label).toBe('Cuka · 5 tetes')
    s = run(s, ...Array.from({ length: 5 }, () => drop('pipette', 'tube-1')))
    expect(exp.view(s.world).pipette.label).toBe('Kosong')
    expect(exp.view(s.world)['tube-1'].level).toBe(0.5)
  })

  it('runs three tubes at the same time without duplicate rows', () => {
    const s = run(
      start(),
      ...prepare('cuka', 'tube-1', 'rack-1'),
      ...prepare('naoh', 'tube-2', 'rack-2'),
      ...prepare('cuka', 'tube-3', 'rack-3'),
      drop('tube-1', 'ph-card'),
      drop('tube-2', 'ph-card'),
      drop('tube-3', 'ph-card'),
      drop('tube-1', 'ph-card'),
    )
    expect(s.rows.map((r) => r.ph)).toEqual([3, 13])
  })

  it('empties a tube at the sink so another solution can be tested', () => {
    const s = run(
      start(),
      ...prepare('cuka'),
      drop('tube-1', 'sink'),
      ...prepare('air-sabun').slice(1),
      drop('tube-1', 'ph-card'),
    )
    expect(s.world.items['tube-1'].at).toBe('rack-1')
    expect(s.rows.map((r) => r.ph)).toEqual([10])
  })

  it('cleans a tube returned to the shelf', () => {
    const s = run(start(), ...prepare('cuka'), drop('tube-1', 'shelf'))
    expect(s.world.items['tube-1']).toEqual(start().world.items['tube-1'])
  })
})

describe('K1 Uji Asam & Basa: educational rejections', () => {
  const hint = (s: EngineState) => s.hint?.text

  it('one tube holds one solution', () => {
    const s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('pipette', 'cuka'),
      drop('pipette', 'tube-1'),
      drop('pipette', 'sink'),
      drop('pipette', 'naoh'),
      drop('pipette', 'tube-1'),
    )
    expect(hint(s)).toBe(
      'Satu tabung hanya untuk satu larutan. Kosongkan tabung di wastafel dulu.',
    )
    expect(s.world.items['tube-1'].state.solution).toBe('cuka')
  })

  it('a filled pipette cannot take another solution', () => {
    const s = run(start(), drop('pipette', 'cuka'), drop('pipette', 'naoh'))
    expect(hint(s)).toContain('Pipet masih berisi Cuka')
    expect(s.world.items.pipette.state.solution).toBe('cuka')
  })

  it('needs the tube in the rack and a filled pipette', () => {
    let s = run(start(), drop('pipette', 'cuka'), drop('pipette', 'tube-1'))
    expect(hint(s)).toBe('Taruh tabung di rak dulu agar tidak tumpah.')
    s = run(start(), drop('tube-1', 'rack-1'), drop('pipette', 'tube-1'))
    expect(hint(s)).toBe('Pipet masih kosong. Isi dulu dari botol larutan.')
    s = run(start(), drop('cuka', 'tube-1'))
    expect(hint(s)).toBe(
      'Pakai pipet tetes untuk memindahkan larutan ke tabung.',
    )
  })

  it('a tube takes the indicator once and fills up to ten drops', () => {
    let s = run(start(), ...prepare('cuka'), drop('indicator', 'tube-1'))
    expect(hint(s)).toBe('Tabung ini sudah diberi indikator.')
    s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('pipette', 'cuka'),
      ...Array.from({ length: 5 }, () => drop('pipette', 'tube-1')),
      drop('pipette', 'cuka'),
      ...Array.from({ length: 5 }, () => drop('pipette', 'tube-1')),
      drop('pipette', 'cuka'),
      drop('pipette', 'tube-1'),
    )
    expect(hint(s)).toBe('Tabung sudah penuh.')
    expect(s.world.items['tube-1'].state.drops).toBe(10)
  })

  it('gives no reading without a solution, without indicator, or before the color is stable', () => {
    let s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('indicator', 'tube-1'),
      tick(1),
      drop('tube-1', 'ph-card'),
    )
    expect(hint(s)).toBe('Tabung ini belum berisi larutan.')

    s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('pipette', 'cuka'),
      drop('pipette', 'tube-1'),
      drop('tube-1', 'ph-card'),
    )
    expect(hint(s)).toContain('Teteskan indikator universal dulu')

    s = run(
      s,
      drop('indicator', 'tube-1'),
      tick(0.4),
      drop('tube-1', 'ph-card'),
    )
    expect(hint(s)).toBe('Tunggu sampai warna indikator berhenti berubah.')
    expect(s.rows).toHaveLength(0)
  })

  it('tubes only go into the rack, one per slot', () => {
    let s = run(start(), drop('tube-1', 'rack-1'), drop('tube-2', 'rack-1'))
    expect(hint(s)).toBe('Rak tabung 1 sudah penuh. Pindahkan dulu isinya.')
    s = run(start(), drop('pipette', 'rack-1'))
    expect(hint(s)).toBe('Pipet tetes tidak bisa ditaruh di Rak tabung 1.')
  })
})
