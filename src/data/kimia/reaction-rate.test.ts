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
import { reactionRate as exp } from './reaction-rate'

const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const tap = (itemId: string): EngineAction => ({ type: 'use', itemId })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const wait = (seconds: number, step = 0.5) =>
  Array.from({ length: Math.round(seconds / step) }, () => tick(step))

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

const heat = (seconds: number) => [
  drop('flask', 'bath'),
  tap('bath'),
  ...wait(seconds),
  tap('bath'),
]

const startTrial = (bottle: string, heatSeconds = 0) => [
  drop(bottle, 'flask'),
  drop('thermometer', 'flask'),
  ...(heatSeconds ? heat(heatSeconds) : []),
  drop('flask', 'paper'),
  tap('stopwatch'),
  drop('hcl', 'flask'),
]
const trial = (bottle: string, heatSeconds = 0) => [
  ...startTrial(bottle, heatSeconds),
  ...wait(300),
]

describe('setup', () => {
  it('starts with the tools on the bench and the flask at room temperature', () => {
    const s = createInitialState(exp)
    for (const id of ['flask', 'thermometer', 'stopwatch', 'bath', 'paper']) {
      expect(s.world.items[id].at).toBe('bench')
    }
    expect(s.world.items['thio-015'].state).toEqual({ conc: 0.15 })
    expect(s.world.items.flask.state).toMatchObject({ conc: 0, temp: 25 })
  })

  it('cannot move the bath or the paper', () => {
    const s = play([drop('bath', 'bench')])
    expect(s.hint).toBe('Benda ini tidak bisa dipindahkan.')
  })

  it('has a line for every lineId it uses', () => {
    expect(exp.lines.map((l) => l.id)).toEqual([
      'k3-heater-on',
      'k3-reaction-started',
      'k3-cross-gone',
    ])
  })
})

describe('reaction time', () => {
  const cases = [
    [
      'thio-020',
      0,
      { suhu: 25, konsentrasi: '0,20', waktu: '60,0', laju: '0,0167' },
    ],
    [
      'thio-010',
      20,
      { suhu: 35, konsentrasi: '0,10', waktu: '60,0', laju: '0,0167' },
    ],
    [
      'thio-005',
      0,
      { suhu: 25, konsentrasi: '0,05', waktu: '240,0', laju: '0,0042' },
    ],
    [
      'thio-020',
      60,
      { suhu: 55, konsentrasi: '0,20', waktu: '7,5', laju: '0,1333' },
    ],
  ] as const

  it.each(cases)('%s heated %i s', (bottle, heatSeconds, row) => {
    const s = play(trial(bottle, heatSeconds))
    expect(s.rows).toEqual([row])
  })

  it('explains the result with the measured time', () => {
    const s = play(trial('thio-020'))
    expect(s.explanation).toMatchObject({
      result: 'Tanda silang hilang setelah 60,0 detik.',
      formula: 'laju relatif = 1 ÷ t = 1 ÷ 60,0 = 0,0167',
    })
  })
})

describe('temperature', () => {
  it('locks the rounded temperature when HCl is poured', () => {
    // 20,5 s at 0,5 °C/s → 35,25 °C, recorded as 35 °C.
    const started = play(startTrial('thio-010', 20.5))
    expect(started.world.items.flask.state.temp).toBe(35.25)
    expect(started.world.items.flask.state.lockedTemp).toBe(35)
    expect(started.events).toEqual([
      {
        type: 'reaction-started',
        itemId: 'flask',
        lineId: 'k3-reaction-started',
      },
    ])

    const heatedAfter = play(
      [tap('bath'), drop('flask', 'bath'), ...wait(300)],
      started,
    )
    expect(heatedAfter.rows).toEqual([
      { suhu: 35, konsentrasi: '0,10', waktu: '60,0', laju: '0,0167' },
    ])

    const reheated = play([drop('flask', 'bath'), ...wait(20)], heatedAfter)
    expect(reheated.world.items.flask.state.temp).toBe(45.25)
    expect(reheated.rows).toEqual(heatedAfter.rows)
  })

  it('rises only while the heater is on and the flask is in the bath', () => {
    const temp = (s: EngineState) => s.world.items.flask.state.temp
    expect(temp(play([drop('flask', 'bath'), ...wait(10)]))).toBe(25)
    expect(temp(play([tap('bath'), ...wait(10)]))).toBe(25)

    const heated = play([drop('flask', 'bath'), tap('bath'), ...wait(10)])
    expect(temp(heated)).toBe(30)
    expect(temp(play([drop('flask', 'bench'), ...wait(10)], heated))).toBe(30)
  })

  it('stops at 55 °C with a short message', () => {
    const reached = play([drop('flask', 'bath'), tap('bath'), ...wait(60)])
    expect(reached.world.items.flask.state.temp).toBe(55)
    expect(reached.explanation?.result).toBe('Suhu labu mencapai 55 °C.')

    const later = play(wait(10), reached)
    expect(later.world.items.flask.state.temp).toBe(55)
    expect(later.explanation).toBe(reached.explanation)
    expect(later.events).toEqual([])
  })

  it('moves the thermometer together with the flask', () => {
    const s = play([
      drop('thermometer', 'flask'),
      drop('flask', 'bath'),
      tap('bath'),
      ...wait(10),
      drop('flask', 'paper'),
    ])
    expect(s.world.items.flask.at).toBe('paper')
    expect(s.world.items.thermometer.at).toBe('flask')
    expect(getView(exp, s).thermometer.reading).toBe('30 °C')

    const detached = runEngine(exp, s, drop('thermometer', 'bench'))
    expect(getView(exp, detached).thermometer.reading).toBe('25 °C')
  })
})

describe('stopwatch', () => {
  it('stops exactly at the time written in the table', () => {
    // 0,1 s frames, like the real animation loop.
    const s = play([...startTrial('thio-020'), ...wait(70, 0.1)])
    const stopwatch = s.world.items.stopwatch.state
    expect(stopwatch.running).toBe(false)
    expect(stopwatch.elapsed).toBe(s.world.items.flask.state.reactionTime)
    expect(getView(exp, s).stopwatch.reading).toBe(`${s.rows[0].waktu} s`)
  })

  it('restarts from zero when HCl is poured', () => {
    const s = play([
      drop('thio-020', 'flask'),
      drop('thermometer', 'flask'),
      drop('flask', 'paper'),
      tap('stopwatch'),
      ...wait(5),
      drop('hcl', 'flask'),
    ])
    expect(s.world.items.stopwatch.state).toEqual({ running: true, elapsed: 0 })
  })
})

describe('events', () => {
  it('emits heater-on, reaction-started and record-added once each', () => {
    const log = playLog(trial('thio-010', 20))
    const of = (type: string) => log.filter((e) => e.type === type)
    expect(of('heater-on')).toEqual([
      { type: 'heater-on', itemId: 'bath', lineId: 'k3-heater-on' },
    ])
    expect(of('reaction-started')).toEqual([
      {
        type: 'reaction-started',
        itemId: 'flask',
        lineId: 'k3-reaction-started',
      },
    ])
    expect(of('record-added')).toEqual([
      { type: 'record-added', itemId: 'paper', lineId: 'k3-cross-gone' },
    ])
  })
})

describe('rejections', () => {
  function expectRejected(s: EngineState, hint: string) {
    expect(s.hint).toBe(hint)
    expect(eventTypes(s)).toEqual(['rejected'])
    expect(s.world.items.flask.state.hcl).toBe(false)
  }

  it('rejects HCl while a condition is missing', () => {
    expectRejected(
      play([drop('hcl', 'flask')]),
      'Isi labu dengan Na₂S₂O₃ dulu.',
    )
    expectRejected(
      play([
        drop('thio-020', 'flask'),
        drop('thermometer', 'flask'),
        tap('stopwatch'),
        drop('hcl', 'flask'),
      ]),
      'Letakkan labu di atas kertas silang dulu.',
    )
    expectRejected(
      play([
        drop('thio-020', 'flask'),
        drop('flask', 'paper'),
        tap('stopwatch'),
        drop('hcl', 'flask'),
      ]),
      'Pasang termometer di labu dulu.',
    )
    expectRejected(
      play([
        drop('thio-020', 'flask'),
        drop('thermometer', 'flask'),
        drop('flask', 'paper'),
        drop('hcl', 'flask'),
      ]),
      'Jalankan stopwatch dulu.',
    )
  })

  it('rejects HCl in a flask that already reacted', () => {
    const s = play([...trial('thio-020'), drop('hcl', 'flask')])
    expect(s.hint).toBe(
      'Labu ini sudah diberi HCl. Bersihkan labu untuk percobaan baru.',
    )
    expect(s.rows).toHaveLength(1)
  })

  it('rejects a second solution in a filled flask', () => {
    const s = play([drop('thio-020', 'flask'), drop('thio-005', 'flask')])
    expect(s.hint).toBe(
      'Labu sudah berisi Na₂S₂O₃ 0,20 M. Satu labu untuk satu percobaan.',
    )
    expect(s.world.items.flask.state.conc).toBe(0.2)
  })

  it('keeps the flask on the cross paper while the reaction runs', () => {
    const running = play([...startTrial('thio-005'), ...wait(10)])
    for (const target of ['bath', 'bench', SHELF]) {
      const s = runEngine(exp, running, drop('flask', target))
      expect(s.hint).toBe(
        'Biarkan labu di atas kertas silang sampai reaksi selesai.',
      )
      expect(eventTypes(s)).toEqual(['rejected'])
      expect(s.world.items.flask.at).toBe('paper')
    }

    const done = play(wait(300), running)
    expect(eventTypes(runEngine(exp, done, drop('flask', 'bench')))).toEqual([
      'action-ok',
    ])
  })

  it('rejects cleaning the flask or stopping the stopwatch mid-reaction', () => {
    const running = play([...startTrial('thio-020'), ...wait(10)])
    expect(runEngine(exp, running, tap('flask')).hint).toBe(
      'Tunggu sampai reaksi selesai.',
    )
    expect(runEngine(exp, running, tap('stopwatch')).hint).toBe(
      'Biarkan stopwatch berjalan sampai tanda silang hilang.',
    )
    expect(play([tap('flask')]).hint).toBe('Labu sudah kosong.')
  })
})

describe('new trial without reset', () => {
  it('cleans the flask by tapping it and keeps the table', () => {
    const first = play(trial('thio-020'))
    const cleaned = runEngine(exp, first, tap('flask'))
    expect(cleaned.world.items.flask).toEqual({
      at: 'paper',
      state: {
        conc: 0,
        temp: 25,
        hcl: false,
        lockedTemp: 0,
        reactionTime: 0,
        elapsed: 0,
      },
    })
    expect(cleaned.world.items.thermometer.at).toBe('flask')
    expect(cleaned.rows).toHaveLength(1)

    const second = play(
      [
        drop('thio-010', 'flask'),
        tap('stopwatch'),
        drop('hcl', 'flask'),
        ...wait(300),
      ],
      cleaned,
    )
    expect(second.rows.map((r) => r.konsentrasi)).toEqual(['0,20', '0,10'])
  })

  it('does not add a duplicate row and says so', () => {
    const first = play(trial('thio-020'))
    const repeat = [
      tap('flask'),
      drop('thio-020', 'flask'),
      tap('stopwatch'),
      drop('hcl', 'flask'),
      ...wait(300),
    ]
    const log = playLog(repeat, first)
    const s = play(repeat, first)
    expect(s.rows).toHaveLength(1)
    expect(log.some((e) => e.type === 'record-added')).toBe(false)
    expect(s.explanation?.result).toBe('Data ini sudah ada di tabel.')
  })
})

describe('view', () => {
  it('shows tap actions only when tapping does something', () => {
    const view = getView(exp, createInitialState(exp))
    expect(view.bath).toEqual({
      label: 'Pemanas mati',
      active: false,
      action: 'Nyalakan',
    })
    expect(view.stopwatch).toEqual({
      reading: '0,0 s',
      active: false,
      action: 'Mulai',
    })
    expect(view.flask).toEqual({ label: 'Kosong', level: 0 })
    expect(view['thio-005'].label).toBe('0,05 M')

    const on = getView(exp, play([tap('bath'), drop('thio-020', 'flask')]))
    expect(on.bath.action).toBe('Matikan')
    expect(on.flask).toMatchObject({
      label: 'Na₂S₂O₃ 0,20 M',
      action: 'Bersihkan',
    })
  })

  it('clouds the flask and fades the cross as the reaction runs', () => {
    const before = play([...startTrial('thio-020')])
    const half = play(wait(30), before)
    const done = play(wait(30), half)

    const start = getView(exp, before)
    const middle = getView(exp, half)
    const end = getView(exp, done)

    expect(start.paper.visibility).toBe(1)
    expect(middle.paper.visibility).toBe(0.5)
    expect(end.paper.visibility).toBe(0)

    expect(middle.flask).toMatchObject({ label: 'Sedang bereaksi' })
    expect(middle.flask.action).toBeUndefined()
    expect(middle.stopwatch).toMatchObject({ reading: '30,0 s', active: true })
    expect(middle.stopwatch.action).toBeUndefined()
    expect(
      new Set([start.flask.color, middle.flask.color, end.flask.color]).size,
    ).toBe(3)

    expect(end.flask).toMatchObject({
      label: 'Reaksi selesai',
      color: '#e6d27a',
      action: 'Bersihkan',
    })
    expect(end.stopwatch).toMatchObject({
      reading: '60,0 s',
      active: false,
      action: 'Mulai',
    })
  })
})
