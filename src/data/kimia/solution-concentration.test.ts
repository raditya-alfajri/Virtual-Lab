import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  getView,
  runEngine,
  SHELF,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import type { LabEvent } from '../types'
import {
  DISSOLVE_STIRS,
  solutionConcentration as exp,
} from './solution-concentration'

const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const tap = (itemId: string): EngineAction => ({ type: 'use', itemId })

function play(
  actions: EngineAction[],
  from: EngineState = createInitialState(exp),
): EngineState {
  return actions.reduce((s, a) => runEngine(exp, s, a), from)
}

/** Every event emitted along the way, not only the last step's. */
function playLog(
  actions: EngineAction[],
  from: EngineState = createInitialState(exp),
): LabEvent[] {
  const log: LabEvent[] = []
  let s = from
  for (const a of actions) {
    s = runEngine(exp, s, a)
    log.push(...s.events)
  }
  return log
}

const eventTypes = (s: EngineState) => s.events.map((e) => e.type)

/** Spoon CuSO₄ onto the watch glass (assumed on the balance): 4 g first, then 1 g. */
function weigh(grams: number): EngineAction[] {
  const out: EngineAction[] = []
  for (let i = 0; i < Math.floor(grams / 4); i++) {
    out.push(drop('spoon-large', 'cuso4'), drop('spoon-large', 'watch-glass'))
  }
  for (let i = 0; i < grams % 4; i++) {
    out.push(drop('spoon-small', 'cuso4'), drop('spoon-small', 'watch-glass'))
  }
  return out
}

const fillCylinder = (mL: number) =>
  Array.from({ length: mL / 50 }, () => drop('water', 'cylinder'))

const addSolid = (grams: number) => [
  drop('watch-glass', 'balance'),
  ...weigh(grams),
  drop('watch-glass', 'beaker'),
]
const addWater = (mL: number) => [
  ...fillCylinder(mL),
  drop('cylinder', 'beaker'),
]
const stir = (times = DISSOLVE_STIRS) =>
  Array.from({ length: times }, () => tap('stirrer'))

const makeSolution = (grams: number, mL: number) => [
  ...addSolid(grams),
  ...addWater(mL),
  drop('stirrer', 'beaker'),
  ...stir(),
]

describe('setup', () => {
  it('starts with empty tools in their places', () => {
    const s = createInitialState(exp)
    expect(s.world.items.beaker.at).toBe('bench')
    expect(s.world.items.cylinder.at).toBe('bench')
    expect(s.world.items['watch-glass'].at).toBe(SHELF)
    expect(s.world.items.stirrer.at).toBe(SHELF)
    expect(s.world.items['spoon-small'].state).toEqual({ size: 1, load: 0 })
    expect(s.world.items['spoon-large'].state).toEqual({ size: 4, load: 0 })
    expect(s.world.items.beaker.state).toMatchObject({
      mass: 0,
      volume: 0,
      stirs: 0,
    })
  })

  it('has a line for every lineId it uses', () => {
    expect(exp.lines.map((l) => l.id)).toEqual([
      'k2-stirring-started',
      'k2-dissolved',
      'k2-dilution',
    ])
  })
})

describe('concentration', () => {
  it('16 g in 100 mL gives 0,100 mol and 1,00 M', () => {
    const s = play(makeSolution(16, 100))
    expect(s.rows).toEqual([
      {
        massa: 16,
        volume: 100,
        mol: '0,100',
        konsentrasi: '1,00',
        warna: 'Biru tua',
      },
    ])
    expect(s.events).toEqual([
      { type: 'dissolved', itemId: 'beaker', lineId: 'k2-dissolved' },
      { type: 'record-added' },
    ])
    expect(s.explanation?.formula).toBe('M = 0,100 mol ÷ 0,100 L = 1,00 M')
  })

  it('rounds half up with a decimal comma', () => {
    // 2 g → 0,0125 mol; 1 g in 250 mL → 0,025 M.
    expect(play(makeSolution(2, 50)).rows[0]).toMatchObject({
      mol: '0,013',
      konsentrasi: '0,25',
      warna: 'Biru muda',
    })
    expect(play(makeSolution(1, 250)).rows[0]).toMatchObject({
      mol: '0,006',
      konsentrasi: '0,03',
      warna: 'Biru pucat',
    })
  })
})

describe('dilution', () => {
  const dissolved = () => play(makeSolution(16, 100))

  it('100 mL → 200 mL gives 0,50 M as a new row', () => {
    const diluted = play(addWater(100), dissolved())
    expect(diluted.events).toEqual([
      { type: 'dilution', itemId: 'beaker', lineId: 'k2-dilution' },
    ])
    expect(diluted.world.items.beaker.state.stirs).toBe(0)
    expect(diluted.rows).toHaveLength(1)

    const s = play(stir(), diluted)
    expect(s.rows).toEqual([
      {
        massa: 16,
        volume: 100,
        mol: '0,100',
        konsentrasi: '1,00',
        warna: 'Biru tua',
      },
      {
        massa: 16,
        volume: 200,
        mol: '0,100',
        konsentrasi: '0,50',
        warna: 'Biru',
      },
    ])
  })

  it('re-stirring goes from the old colour to the new one, not from clear water', () => {
    const before = getView(exp, dissolved()).beaker.color
    const diluted = play(addWater(100), dissolved())
    expect(getView(exp, diluted).beaker).toMatchObject({
      color: before,
      label: 'Larut 0%',
      solid: 0,
    })
    expect(getView(exp, play(stir(), diluted)).beaker.color).toBe('#1e88e5')
  })

  it('adding water to a mixture still being stirred is not a dilution', () => {
    const s = play([
      ...addSolid(4),
      ...addWater(50),
      drop('stirrer', 'beaker'),
      ...stir(2),
    ])
    const more = play(addWater(50), s)
    expect(eventTypes(more)).toEqual(['action-ok'])
    expect(more.world.items.beaker.state.stirs).toBe(2)
  })

  it('adding CuSO₄ to a dissolved solution needs stirring again, without a dilution', () => {
    const more = play(addSolid(4), play(makeSolution(4, 100)))
    expect(eventTypes(more)).toEqual(['action-ok'])
    expect(more.world.items.beaker.state.stirs).toBe(0)
    expect(getView(exp, more).beaker.solid).toBe(0.5)

    const s = play(stir(), more)
    expect(s.rows.map((r) => r.konsentrasi)).toEqual(['0,25', '0,50'])
  })
})

describe('free order', () => {
  it('gives the same row with water first or CuSO₄ first', () => {
    const solidFirst = play(makeSolution(8, 150))
    const waterFirst = play([
      ...addWater(150),
      ...addSolid(8),
      drop('stirrer', 'beaker'),
      ...stir(),
    ])
    expect(waterFirst.world).toEqual(solidFirst.world)
    expect(waterFirst.rows).toEqual(solidFirst.rows)
    expect(waterFirst.rows).toHaveLength(1)
  })
})

describe('stirring events', () => {
  it('emits stirring-started and dissolved exactly once per process', () => {
    const log = playLog([
      ...makeSolution(16, 100),
      ...stir(3),
      ...addWater(100),
      ...stir(),
      ...stir(2),
    ])
    const of = (type: string) => log.filter((e) => e.type === type)

    expect(of('stirring-started')).toEqual([
      {
        type: 'stirring-started',
        itemId: 'beaker',
        lineId: 'k2-stirring-started',
      },
      {
        type: 'stirring-started',
        itemId: 'beaker',
        lineId: 'k2-stirring-started',
      },
    ])
    expect(of('dissolved')).toEqual([
      { type: 'dissolved', itemId: 'beaker', lineId: 'k2-dissolved' },
      { type: 'dissolved', itemId: 'beaker', lineId: 'k2-dissolved' },
    ])
    expect(of('dilution')).toHaveLength(1)
    expect(of('record-added')).toEqual([
      { type: 'record-added' },
      { type: 'record-added' },
    ])
  })

  it('fires stirring-started on the first tap and nothing special in between', () => {
    const ready = play([
      ...addSolid(4),
      ...addWater(100),
      drop('stirrer', 'beaker'),
    ])
    const first = runEngine(exp, ready, tap('stirrer'))
    expect(first.events).toEqual([
      {
        type: 'stirring-started',
        itemId: 'beaker',
        lineId: 'k2-stirring-started',
      },
    ])
    const second = runEngine(exp, first, tap('stirrer'))
    expect(eventTypes(second)).toEqual(['action-ok'])
    expect(second.rows).toEqual([])
  })
})

describe('rejections', () => {
  function expectRejected(s: EngineState, hint: string) {
    expect(s.hint).toBe(hint)
    expect(eventTypes(s)).toEqual(['rejected'])
  }

  it('rejects filling a watch glass that is not on the balance', () => {
    const s = play([
      drop('spoon-large', 'cuso4'),
      drop('spoon-large', 'watch-glass'),
    ])
    expectRejected(
      s,
      'Letakkan kaca arloji di atas neraca dulu supaya CuSO₄ bisa ditimbang.',
    )
    expect(s.world.items['watch-glass'].state.mass).toBe(0)
    expect(s.world.items['spoon-large'].state.load).toBe(4)
  })

  it('rejects more than 16 g on the watch glass', () => {
    const s = play([
      drop('watch-glass', 'balance'),
      ...weigh(16),
      drop('spoon-small', 'cuso4'),
      drop('spoon-small', 'watch-glass'),
    ])
    expectRejected(s, 'Massa CuSO₄ di kaca arloji maksimal 16 g.')
    expect(s.world.items['watch-glass'].state.mass).toBe(16)
  })

  it('rejects more than 16 g in the beaker in total', () => {
    const s = play([...addSolid(16), ...addSolid(1)])
    expectRejected(s, 'CuSO₄ di gelas kimia maksimal 16 g.')
    expect(s.world.items.beaker.state.mass).toBe(16)
  })

  it('rejects more than 250 mL in the cylinder and in the beaker', () => {
    expectRejected(play(fillCylinder(300)), 'Gelas ukur hanya muat 250 mL.')

    const s = play([...addWater(250), ...addWater(50)])
    expectRejected(
      s,
      'Gelas kimia hanya muat 250 mL. Air di gelas ukur terlalu banyak.',
    )
    expect(s.world.items.beaker.state.volume).toBe(250)
    expect(s.world.items.cylinder.state.volume).toBe(50)
  })

  it('rejects pouring water straight from the bottle into the beaker', () => {
    expectRejected(
      play([drop('water', 'beaker')]),
      'Ukur airnya dulu dengan gelas ukur sebelum dituang.',
    )
  })

  it('rejects a spoon straight into the beaker', () => {
    const s = play([
      drop('spoon-large', 'cuso4'),
      drop('spoon-large', 'beaker'),
    ])
    expectRejected(
      s,
      'Timbang CuSO₄ dulu di atas kaca arloji sebelum dimasukkan.',
    )
    expect(s.world.items.beaker.state.mass).toBe(0)
  })

  it('rejects stirring without the stirrer in the beaker', () => {
    const s = play([...addSolid(4), ...addWater(100), tap('stirrer')])
    expectRejected(
      s,
      'Masukkan batang pengaduk ke gelas kimia dulu, lalu ketuk untuk mengaduk.',
    )
    expect(s.world.items.beaker.state.stirs).toBe(0)

    const removed = play(
      [drop('stirrer', 'beaker'), drop('stirrer', 'bench'), tap('stirrer')],
      play([...addSolid(4), ...addWater(100)]),
    )
    expectRejected(
      removed,
      'Masukkan batang pengaduk ke gelas kimia dulu, lalu ketuk untuk mengaduk.',
    )
  })

  it('rejects stirring a beaker without both water and CuSO₄', () => {
    const withStirrer = [drop('stirrer', 'beaker'), tap('stirrer')]
    expectRejected(play(withStirrer), 'Gelas kimia masih kosong.')
    expectRejected(
      play([...addWater(100), ...withStirrer]),
      'Masukkan CuSO₄ dulu ke gelas kimia.',
    )
    expectRejected(
      play([...addSolid(4), ...withStirrer]),
      'Tuang air dulu ke gelas kimia.',
    )
  })

  it('rejects other impossible actions', () => {
    expectRejected(
      play([drop('spoon-small', 'cuso4'), drop('spoon-small', 'cuso4')]),
      'Sendok masih berisi CuSO₄. Tuang dulu ke kaca arloji.',
    )
    expectRejected(
      play([
        drop('watch-glass', 'balance'),
        drop('spoon-small', 'watch-glass'),
      ]),
      'Sendok masih kosong. Ambil CuSO₄ dulu dari wadahnya.',
    )
    expectRejected(
      play([drop('cylinder', 'beaker')]),
      'Gelas ukur masih kosong. Isi dulu dengan air suling.',
    )
    expectRejected(
      play([drop('watch-glass', 'beaker')]),
      'Kaca arloji masih kosong. Timbang CuSO₄ dulu di atasnya.',
    )
    expectRejected(
      play([drop('cylinder', 'balance')]),
      'Neraca digital tidak bisa menampung Gelas ukur 250 mL.',
    )
  })
})

describe('records', () => {
  it('does not add duplicate rows', () => {
    const once = play(makeSolution(16, 100))
    const more = play(stir(3), once)
    expect(more.rows).toHaveLength(1)
    expect(eventTypes(more)).toEqual(['action-ok'])

    const again = runEngine(exp, more, drop('stirrer', 'beaker'))
    expect(again.rows).toHaveLength(1)
  })
})

describe('view', () => {
  it('shows the mass on the watch glass only while it is on the balance', () => {
    const weighed = play([drop('watch-glass', 'balance'), ...weigh(8)])
    expect(getView(exp, weighed)['watch-glass']).toMatchObject({
      reading: '8,00 g',
      level: 0.5,
    })
    const moved = runEngine(exp, weighed, drop('watch-glass', 'bench'))
    expect(getView(exp, moved)['watch-glass'].reading).toBeUndefined()
    expect(getView(exp, moved)['watch-glass'].level).toBe(0.5)
  })

  it('shows the cylinder volume', () => {
    expect(getView(exp, play(fillCylinder(100))).cylinder).toMatchObject({
      reading: '100 mL',
      level: 0.4,
    })
  })

  it('labels the spoons and the stirrer', () => {
    const s = play([drop('spoon-large', 'cuso4'), drop('stirrer', 'beaker')])
    const view = getView(exp, s)
    expect(view['spoon-large'].label).toBe('Berisi 4 g')
    expect(view['spoon-small'].label).toBe('Kosong')
    expect(view.stirrer).toEqual({
      label: 'Ketuk untuk mengaduk',
      active: true,
    })
    expect(getView(exp, createInitialState(exp)).stirrer.active).toBe(false)
  })

  it('shows the beaker going from clear water to blue while dissolving', () => {
    const water = play(addWater(100))
    expect(getView(exp, water).beaker).toMatchObject({
      label: 'Air suling',
      color: '#eaf4fa',
      level: 0.4,
    })

    const mixed = play([...addSolid(16), drop('stirrer', 'beaker')], water)
    const start = getView(exp, mixed).beaker
    expect(start).toMatchObject({
      label: 'Larut 0%',
      color: '#eaf4fa',
      solid: 1,
    })

    const half = getView(exp, play(stir(2), mixed)).beaker
    expect(half.label).toBe('Larut 40%')
    expect(half.color).not.toBe(start.color)

    const done = getView(exp, play(stir(), mixed)).beaker
    expect(done).toMatchObject({
      label: 'Larut sempurna',
      color: '#0d47a1',
      solid: 0,
    })
  })

  it('labels an empty beaker and one with only CuSO₄', () => {
    expect(getView(exp, createInitialState(exp)).beaker).toMatchObject({
      label: 'Kosong',
      color: undefined,
      level: 0,
    })
    expect(getView(exp, play(addSolid(4))).beaker).toMatchObject({
      label: 'Belum ada air',
      solid: 1,
    })
  })
})
