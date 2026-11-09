import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  getView,
  runEngine,
  SHELF,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import { acidBaseTest as exp } from './acid-base-test'

const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
// Ten frames of 0.1 s: the indicator needs about one second.
const waitColor = (): EngineAction[] =>
  Array.from({ length: 10 }, () => tick(0.1))

function play(
  actions: EngineAction[],
  from: EngineState = createInitialState(exp),
): EngineState {
  return actions.reduce((s, a) => runEngine(exp, s, a), from)
}

const eventTypes = (s: EngineState) => s.events.map((e) => e.type)

/** Pipette a solution into a tube, add indicator, wait, then match on the pH card. */
const testWithPipette = (solution: string, tube = 'tube-1') => [
  drop('pipette', `bottle-${solution}`),
  drop('pipette', tube),
  drop('indicator', tube),
  ...waitColor(),
  drop(tube, 'ph-card'),
]

describe('setup', () => {
  it('starts tubes on the bench, not in the racks, and bottles with their pH', () => {
    const s = createInitialState(exp)
    expect(s.world.items['tube-1'].at).toBe(SHELF)
    expect(s.world.items['tube-3'].at).toBe(SHELF)
    expect(s.world.items['bottle-cuka'].state).toEqual({
      solution: 'cuka',
      ph: 3,
    })
    expect(s.world.items['bottle-naoh'].state).toEqual({
      solution: 'naoh',
      ph: 13,
    })
  })

  it('labels the pH column correctly', () => {
    expect(exp.columns.find((c) => c.key === 'ph')?.label).toBe('pH')
  })
})

describe('pH and nature of each solution', () => {
  const cases = [
    ['cuka', 'Cuka', 'Merah', 3, 'Asam'],
    ['jeruk', 'Air jeruk', 'Jingga', 4, 'Asam'],
    ['suling', 'Air suling', 'Hijau', 7, 'Netral'],
    ['sabun', 'Air sabun', 'Biru', 10, 'Basa'],
    ['naoh', 'NaOH encer', 'Ungu', 13, 'Basa'],
  ] as const

  it.each(cases)('%s', (solution, larutan, warna, ph, sifat) => {
    const s = play(testWithPipette(solution))
    expect(s.rows).toEqual([{ larutan, warna, ph, sifat }])
    expect(s.events).toEqual([
      { type: 'record-added', lineId: `k1-result-${solution}` },
    ])
    expect(exp.lines.some((l) => l.id === `k1-result-${solution}`)).toBe(true)
  })

  it('records all five solutions across reused tubes', () => {
    const empty = (tube: string) => drop(tube, 'sink')
    const s = play([
      ...testWithPipette('cuka', 'tube-1'),
      ...testWithPipette('jeruk', 'tube-2'),
      ...testWithPipette('suling', 'tube-3'),
      empty('tube-1'),
      ...testWithPipette('sabun', 'tube-1'),
      empty('tube-2'),
      ...testWithPipette('naoh', 'tube-2'),
    ])
    expect(s.rows.map((r) => r.ph)).toEqual([3, 4, 7, 10, 13])
  })

  it('works when pouring straight from the bottle', () => {
    const s = play([
      drop('bottle-sabun', 'tube-2'),
      drop('indicator', 'tube-2'),
      ...waitColor(),
      drop('tube-2', 'ph-card'),
    ])
    expect(s.rows).toEqual([
      { larutan: 'Air sabun', warna: 'Biru', ph: 10, sifat: 'Basa' },
    ])
  })
})

describe('free order', () => {
  it('gives the same result with indicator first or solution first', () => {
    const indicatorFirst = play([
      drop('indicator', 'tube-1'),
      drop('bottle-cuka', 'tube-1'),
      ...waitColor(),
      drop('tube-1', 'ph-card'),
    ])
    const solutionFirst = play([
      drop('bottle-cuka', 'tube-1'),
      drop('indicator', 'tube-1'),
      ...waitColor(),
      drop('tube-1', 'ph-card'),
    ])
    expect(solutionFirst.world).toEqual(indicatorFirst.world)
    expect(solutionFirst.rows).toEqual(indicatorFirst.rows)
  })
})

describe('gradual colour change', () => {
  const mixed = [drop('bottle-sabun', 'tube-1'), drop('indicator', 'tube-1')]

  it('changes colour over about one second', () => {
    const half = play([...mixed, tick(0.5)])
    expect(half.events).toEqual([])
    const done = runEngine(exp, half, tick(0.5))

    const start = getView(exp, play(mixed))['tube-1'].color
    const middle = getView(exp, half)['tube-1'].color
    const end = getView(exp, done)['tube-1'].color
    expect(new Set([start, middle, end]).size).toBe(3)
    expect(end).toBe('#1e88e5')
  })

  it('emits color-changed once, with the right line and a real explanation', () => {
    const done = play([...mixed, ...waitColor()])
    expect(done.events).toEqual([
      { type: 'color-changed', itemId: 'tube-1', lineId: 'k1-color-changed' },
    ])
    expect(exp.lines.some((l) => l.id === 'k1-color-changed')).toBe(true)
    expect(done.explanation?.result).toBe('Air sabun berubah menjadi biru.')

    const later = runEngine(exp, done, tick(0.1))
    expect(later.events).toEqual([])
    expect(later.explanation).toBe(done.explanation)
  })

  it('names the actual solution and colour', () => {
    const done = play([
      drop('bottle-cuka', 'tube-2'),
      drop('indicator', 'tube-2'),
      ...waitColor(),
    ])
    expect(done.explanation?.result).toBe('Cuka berubah menjadi merah.')
  })

  it('does not start without both solution and indicator', () => {
    const s = play([
      drop('bottle-cuka', 'tube-1'),
      drop('indicator', 'tube-2'),
      ...waitColor(),
    ])
    expect(s.world.items['tube-1'].state.progress).toBe(0)
    expect(s.world.items['tube-2'].state.progress).toBe(0)
  })
})

describe('rejections', () => {
  function expectRejected(s: EngineState, hint: string) {
    expect(s.hint).toBe(hint)
    expect(eventTypes(s)).toEqual(['rejected'])
  }

  it('rejects a second solution in a filled tube', () => {
    const filled = play([drop('bottle-cuka', 'tube-1')])
    const hint =
      'Tabung ini sudah berisi cuka. Satu tabung hanya untuk satu larutan.'

    const byBottle = runEngine(exp, filled, drop('bottle-sabun', 'tube-1'))
    expectRejected(byBottle, hint)
    expect(byBottle.world).toBe(filled.world)

    const byPipette = play(
      [drop('pipette', 'bottle-sabun'), drop('pipette', 'tube-1')],
      filled,
    )
    expectRejected(byPipette, hint)
    expect(byPipette.world.items.pipette.state.solution).toBe('sabun')
  })

  it('rejects a tube without indicator on the pH card', () => {
    const s = play([drop('bottle-cuka', 'tube-1'), drop('tube-1', 'ph-card')])
    expectRejected(s, 'Teteskan indikator dulu sebelum mencocokkan warna.')
    expect(s.rows).toEqual([])
  })

  it('rejects an empty pipette on a tube', () => {
    expectRejected(
      play([drop('pipette', 'tube-1')]),
      'Pipet masih kosong. Ambil larutan dulu dari botol.',
    )
  })

  it('rejects refilling a pipette that still holds another solution', () => {
    const s = play([
      drop('pipette', 'bottle-cuka'),
      drop('pipette', 'bottle-sabun'),
    ])
    expectRejected(
      s,
      'Pipet masih berisi cuka. Teteskan dulu ke tabung atau buang di wastafel.',
    )
    expect(s.world.items.pipette.state.solution).toBe('cuka')
  })

  it('rejects matching before the colour has settled', () => {
    const s = play([
      drop('bottle-cuka', 'tube-1'),
      drop('indicator', 'tube-1'),
      tick(0.5),
      drop('tube-1', 'ph-card'),
    ])
    expectRejected(s, 'Tunggu sampai warnanya berhenti berubah.')
  })

  it('rejects other impossible actions', () => {
    expectRejected(
      play([drop('tube-1', 'ph-card')]),
      'Tabung ini masih kosong.',
    )
    expectRejected(
      play([drop('indicator', 'tube-1'), drop('tube-1', 'ph-card')]),
      'Isi tabung dengan larutan dulu.',
    )
    expectRejected(
      play([drop('indicator', 'tube-1'), drop('indicator', 'tube-1')]),
      'Tabung ini sudah diberi indikator.',
    )
    expectRejected(play([drop('tube-1', 'sink')]), 'Tabung ini sudah kosong.')
    expectRejected(play([drop('pipette', 'sink')]), 'Pipet sudah kosong.')
    expectRejected(
      play([drop('tube-2', 'rack-2'), drop('tube-1', 'rack-2')]),
      'Rak tabung sudah penuh.',
    )
    expectRejected(
      play([drop('bottle-cuka', 'sink')]),
      'Wastafel tidak bisa menampung Cuka.',
    )
  })
})

describe('sink', () => {
  it('empties a tube so it can be reused, leaving it in place', () => {
    const used = play(testWithPipette('cuka'))
    const emptied = runEngine(exp, used, drop('tube-1', 'sink'))
    expect(eventTypes(emptied)).toEqual(['action-ok'])
    expect(emptied.world.items['tube-1']).toEqual({
      at: SHELF,
      state: { solution: '', ph: 0, indicator: false, progress: 0 },
    })
    expect(getView(exp, emptied)['tube-1']).toMatchObject({
      label: 'Kosong',
      level: 0,
    })

    const reused = play(testWithPipette('naoh'), emptied)
    expect(reused.rows.map((r) => r.larutan)).toEqual(['Cuka', 'NaOH encer'])
  })

  it('empties the pipette so another solution can be taken', () => {
    const s = play([
      drop('pipette', 'bottle-cuka'),
      drop('pipette', 'sink'),
      drop('pipette', 'bottle-jeruk'),
    ])
    expect(s.world.items.pipette.state).toEqual({ solution: 'jeruk', ph: 4 })
    expect(getView(exp, s).pipette).toMatchObject({
      label: 'Air jeruk',
      level: 1,
    })
  })
})

describe('records', () => {
  it('does not add duplicate rows', () => {
    const once = play(testWithPipette('cuka'))
    const twice = runEngine(exp, once, drop('tube-1', 'ph-card'))
    expect(twice.rows).toHaveLength(1)
    expect(eventTypes(twice)).toEqual(['action-ok'])

    const otherTube = play(testWithPipette('cuka', 'tube-2'), twice)
    expect(otherTube.rows).toHaveLength(1)
  })

  it('leaves the tube where it was after matching', () => {
    const onBench = play(testWithPipette('suling', 'tube-3'))
    expect(onBench.world.items['tube-3'].at).toBe(SHELF)

    const inRack = play([
      drop('tube-3', 'rack-3'),
      ...testWithPipette('suling', 'tube-3'),
    ])
    expect(inRack.world.items['tube-3'].at).toBe('rack-3')
    expect(inRack.rows).toHaveLength(1)
  })
})

describe('racks', () => {
  it('moves a tube from the bench to a rack and back, keeping its contents', () => {
    const filled = play([drop('bottle-cuka', 'tube-1')])

    const racked = runEngine(exp, filled, drop('tube-1', 'rack-1'))
    expect(eventTypes(racked)).toEqual(['action-ok'])
    expect(racked.world.items['tube-1'].at).toBe('rack-1')

    const back = runEngine(exp, racked, drop('tube-1', SHELF))
    expect(eventTypes(back)).toEqual(['action-ok'])
    expect(back.world.items['tube-1']).toEqual(filled.world.items['tube-1'])
  })
})

describe('view', () => {
  it('shows label, colour and level for tubes and pipette', () => {
    const s = play([
      drop('pipette', 'bottle-jeruk'),
      drop('indicator', 'tube-2'),
    ])
    const view = getView(exp, s)
    expect(view.pipette).toMatchObject({ label: 'Air jeruk', level: 1 })
    expect(view['tube-1']).toEqual({
      label: 'Kosong',
      color: undefined,
      level: 0,
    })
    expect(view['tube-2']).toMatchObject({ label: 'Indikator', level: 0.1 })
    expect(view['tube-2'].color).toBeDefined()
  })
})
