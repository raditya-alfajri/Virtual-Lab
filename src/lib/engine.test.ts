import { describe, expect, it } from 'vitest'
import type { Experiment } from '../data/types'
import {
  createInitialState,
  getView,
  runEngine,
  SHELF,
  type EngineAction,
  type EngineState,
} from './engine'
import { LAMP_HOT_TEMP, sampleExperiment as exp } from './sample-experiment'

const drop = (sourceId: string, targetId: string): EngineAction => ({
  type: 'drop',
  sourceId,
  targetId,
})
const tap = (itemId: string): EngineAction => ({ type: 'use', itemId })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })

function play(
  actions: EngineAction[],
  experiment: Experiment = exp,
  from: EngineState = createInitialState(experiment),
): EngineState {
  return actions.reduce((s, a) => runEngine(experiment, s, a), from)
}

const eventTypes = (s: EngineState) => s.events.map((e) => e.type)

describe('createInitialState', () => {
  it('places items at start or shelf and copies their initial state', () => {
    const s = createInitialState(exp)
    expect(s.world.time).toBe(0)
    expect(s.world.items['tube-1']).toEqual({
      at: SHELF,
      state: { filled: false, color: 'bening' },
    })
    expect(s.world.items.lamp.at).toBe('bench')
    expect(s.world.items.meter.state).toEqual({})
    expect(s.world.items['tube-1'].state).not.toBe(exp.items[0].state)
  })
})

describe('free order', () => {
  it('gives the same result regardless of action order', () => {
    const a = play([
      drop('dye', 'tube-1'),
      drop('meter', 'tube-1'),
      drop('tube-2', 'rack'),
      tap('lamp'),
    ])
    const b = play([
      tap('lamp'),
      drop('tube-2', 'rack'),
      drop('dye', 'tube-1'),
      drop('meter', 'tube-1'),
    ])
    expect(b.world).toEqual(a.world)
    expect(b.rows).toEqual(a.rows)
  })

  it('is deterministic and does not mutate the input state', () => {
    const start = createInitialState(exp)
    const snapshot = structuredClone(start)
    const actions = [drop('dye', 'tube-1'), tap('lamp'), tick(0.1)]
    expect(play(actions, exp, start)).toEqual(play(actions, exp, start))
    expect(start).toEqual(snapshot)
  })
})

describe('interactions', () => {
  it('runs a matching interaction and emits its events', () => {
    const s = play([drop('dye', 'tube-1')])
    expect(s.world.items['tube-1'].state).toEqual({
      filled: true,
      color: 'biru',
    })
    expect(s.events).toEqual([{ type: 'color-changed', itemId: 'tube-1' }])
    expect(s.explanation?.result).toBe('Tabung berwarna biru.')
    expect(getView(exp, s)['tube-1'].color).toBe('biru')
  })

  it('prefers an id rule over a kind rule', () => {
    const s = play([drop('dye', 'tube-2')])
    expect(s.hint).toBe('Tabung 2 disiapkan sebagai pembanding.')
    expect(s.world.items['tube-2'].state.filled).toBe(false)
  })

  it('rejects when the interaction rejects, leaving the world untouched', () => {
    const before = play([drop('dye', 'tube-1')])
    const s = runEngine(exp, before, drop('dye', 'tube-1'))
    expect(s.world).toBe(before.world)
    expect(s.hint).toBe('Satu tabung hanya untuk satu larutan.')
    expect(s.events).toEqual([{ type: 'rejected' }])
  })
})

describe('zones and shelf', () => {
  it('moves an item into a zone that accepts it', () => {
    const s = play([drop('tube-1', 'rack')])
    expect(s.world.items['tube-1'].at).toBe('rack')
    expect(eventTypes(s)).toEqual(['action-ok'])
    expect(s.hint).toBeNull()
  })

  it('rejects an item the zone does not accept', () => {
    const s = play([drop('dye', 'rack')])
    expect(s.world.items.dye.at).toBe(SHELF)
    expect(s.hint).toBe('Rak tabung tidak bisa menampung Botol pewarna.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('rejects when the zone is full', () => {
    const s = play([drop('tube-1', 'rack'), drop('tube-2', 'rack')])
    expect(s.world.items['tube-2'].at).toBe(SHELF)
    expect(s.hint).toBe('Rak tabung sudah penuh.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('does not count the item itself against capacity', () => {
    const s = play([drop('tube-1', 'rack'), drop('tube-1', 'rack')])
    expect(s.world.items['tube-1'].at).toBe('rack')
    expect(eventTypes(s)).toEqual(['action-ok'])
  })

  it('returns an item to the shelf', () => {
    const s = play([drop('tube-1', 'rack'), drop('tube-1', SHELF)])
    expect(s.world.items['tube-1'].at).toBe(SHELF)
    expect(eventTypes(s)).toEqual(['action-ok'])
  })
})

describe('rejections', () => {
  it('rejects moving a fixed item', () => {
    const s = play([drop('lamp', 'rack')])
    expect(s.world.items.lamp.at).toBe('bench')
    expect(s.hint).toBe('Benda ini tidak bisa dipindahkan.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('rejects dropping an item onto itself', () => {
    const s = play([drop('tube-1', 'tube-1')])
    expect(s.hint).toBe('Alat ini tidak bisa dipakai di situ.')
  })

  it('rejects a pair with no rule', () => {
    const start = createInitialState(exp)
    const s = runEngine(exp, start, drop('tube-1', 'tube-2'))
    expect(s.world).toBe(start.world)
    expect(s.hint).toBe('Alat ini tidak bisa dipakai di situ.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('clears the hint after a later successful action', () => {
    const s = play([drop('lamp', 'rack'), drop('tube-1', 'rack')])
    expect(s.hint).toBeNull()
  })
})

describe('tap', () => {
  it('runs the item handler', () => {
    const on = play([tap('lamp')])
    expect(on.world.items.lamp.state.on).toBe(true)
    expect(on.events).toEqual([{ type: 'heater-on', itemId: 'lamp' }])

    const off = runEngine(exp, on, tap('lamp'))
    expect(off.world.items.lamp.state.on).toBe(false)
    expect(eventTypes(off)).toEqual(['action-ok'])
  })

  it('does nothing for an item without a handler', () => {
    const before = play([drop('lamp', 'rack')])
    const s = runEngine(exp, before, tap('tube-1'))
    expect(s.world).toBe(before.world)
    expect(s.hint).toBe(before.hint)
    expect(s.events).toEqual([])
  })
})

describe('tick', () => {
  it('advances time and runs the process', () => {
    const s = play([tap('lamp'), tick(0.5), tick(0.5)])
    expect(s.world.time).toBe(1)
    expect(s.world.items.lamp.state.temp).toBe(26)
  })

  it('keeps hint and explanation on a quiet tick', () => {
    const before = play([drop('dye', 'tube-1'), drop('lamp', 'rack')])
    const s = runEngine(exp, before, tick(0.1))
    expect(s.world.time).toBeCloseTo(0.1)
    expect(s.hint).toBe('Benda ini tidak bisa dipindahkan.')
    expect(s.explanation).toBe(before.explanation)
    expect(s.events).toEqual([])
  })

  it('applies events and explanation when the process changes', () => {
    const steps = Array.from({ length: LAMP_HOT_TEMP - 25 }, () => tick(1))
    const s = play([tap('lamp'), drop('lamp', 'rack'), ...steps])
    expect(s.world.items.lamp.state.temp).toBe(LAMP_HOT_TEMP)
    expect(s.events).toEqual([{ type: 'color-changed', itemId: 'lamp' }])
    expect(s.explanation?.result).toBe('Lampu jadi merah.')
    expect(s.hint).toBeNull()
    expect(eventTypes(runEngine(exp, s, tick(1)))).toEqual([])
  })

  it('ignores a non-positive dt', () => {
    const before = createInitialState(exp)
    expect(runEngine(exp, before, tick(0)).world).toBe(before.world)
    expect(runEngine(exp, before, tick(-1)).world).toBe(before.world)
  })

  it('only advances time when the experiment has no process', () => {
    const noTick: Experiment = { ...exp, tick: undefined }
    const s = play([tap('lamp'), tick(2)], noTick)
    expect(s.world.time).toBe(2)
    expect(s.world.items.lamp.state.temp).toBe(25)
  })
})

describe('records', () => {
  it('adds a record with exactly one record-added event', () => {
    const s = play([drop('dye', 'tube-1'), drop('meter', 'tube-1')])
    expect(s.rows).toEqual([{ tabung: 'tube-1', warna: 'biru' }])
    expect(s.events).toEqual([{ type: 'record-added' }])
    expect(s.explanation?.result).toBe('Warna tercatat: biru.')
  })

  it('does not add a duplicate row', () => {
    const s = play([
      drop('dye', 'tube-1'),
      drop('meter', 'tube-1'),
      drop('meter', 'tube-1'),
    ])
    expect(s.rows).toHaveLength(1)
    expect(eventTypes(s)).toEqual(['action-ok'])
  })

  it('shows duplicateNote instead of the explanation for a duplicate row', () => {
    const note = {
      result: 'Data ini sudah ada di tabel.',
      reason: 'Coba lagi.',
    }
    const withNote: Experiment = {
      ...exp,
      interactions: exp.interactions.map((it) =>
        it.source === 'meter'
          ? {
              ...it,
              run: (world, sourceId, targetId) => {
                const result = it.run(world, sourceId, targetId)
                return 'reject' in result
                  ? result
                  : { ...result, duplicateNote: note }
              },
            }
          : it,
      ),
    }
    const first = play(
      [drop('dye', 'tube-1'), drop('meter', 'tube-1')],
      withNote,
    )
    expect(first.explanation?.result).toBe('Warna tercatat: biru.')

    const again = runEngine(withNote, first, drop('meter', 'tube-1'))
    expect(again.rows).toHaveLength(1)
    expect(again.explanation).toBe(note)
  })

  it('rejects measuring an empty tube without recording', () => {
    const s = play([drop('meter', 'tube-1')])
    expect(s.rows).toEqual([])
    expect(s.hint).toBe('Tabung masih kosong.')
  })

  describe('when the data emits record-added itself', () => {
    const withLine: Experiment = {
      ...exp,
      interactions: exp.interactions.map((it) =>
        it.source === 'meter'
          ? {
              ...it,
              run: (world, sourceId, targetId) => {
                const result = it.run(world, sourceId, targetId)
                if ('reject' in result) return result
                return {
                  ...result,
                  events: [
                    { type: 'record-added', lineId: 'record-color' },
                    { type: 'record-added' },
                  ],
                }
              },
            }
          : it,
      ),
    }

    it('keeps the data event and does not add another', () => {
      const s = play([drop('dye', 'tube-1'), drop('meter', 'tube-1')], withLine)
      expect(s.rows).toHaveLength(1)
      expect(s.events).toEqual([
        { type: 'record-added', lineId: 'record-color' },
      ])
    })

    it('drops every record-added when the row is a duplicate', () => {
      const s = play(
        [
          drop('dye', 'tube-1'),
          drop('meter', 'tube-1'),
          drop('meter', 'tube-1'),
        ],
        withLine,
      )
      expect(s.rows).toHaveLength(1)
      expect(eventTypes(s)).toEqual(['action-ok'])
    })
  })
})

describe('removeRow and reset', () => {
  it('removes a row by index', () => {
    const filled = play([
      drop('dye', 'tube-1'),
      drop('meter', 'tube-1'),
      drop('tube-1', 'rack'),
    ])
    const s = runEngine(exp, filled, { type: 'removeRow', index: 0 })
    expect(s.rows).toEqual([])
    expect(s.world).toBe(filled.world)
  })

  it('resets to the initial state', () => {
    const messy = play([
      drop('dye', 'tube-1'),
      drop('meter', 'tube-1'),
      tap('lamp'),
      tick(1),
      drop('lamp', 'rack'),
    ])
    expect(runEngine(exp, messy, { type: 'reset' })).toEqual(
      createInitialState(exp),
    )
  })
})

describe('pull and release', () => {
  const setState = (
    s: EngineState['world'],
    id: string,
    patch: Record<string, number | boolean>,
  ) => ({
    ...s,
    items: {
      ...s.items,
      [id]: { ...s.items[id], state: { ...s.items[id].state, ...patch } },
    },
  })
  const pulling: Experiment = {
    ...exp,
    pull: {
      lamp: (world, id, value) =>
        value > 10
          ? { reject: 'Terlalu jauh.' }
          : { world: setState(world, id, { angle: value }) },
    },
    release: {
      lamp: (world, id) => ({
        world: setState(world, id, { swinging: true }),
        hint: 'Lampu berayun.',
      }),
    },
  }

  it('runs the pull handler with the value', () => {
    const s = play([{ type: 'pull', itemId: 'lamp', value: -6 }], pulling)
    expect(s.world.items.lamp.state.angle).toBe(-6)
    expect(eventTypes(s)).toEqual(['action-ok'])
  })

  it('rejects through the pull handler', () => {
    const s = play([{ type: 'pull', itemId: 'lamp', value: 20 }], pulling)
    expect(s.hint).toBe('Terlalu jauh.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('ignores a pull without a handler or with a bad value', () => {
    const start = createInitialState(pulling)
    for (const action of [
      { type: 'pull', itemId: 'tube-1', value: 3 },
      { type: 'pull', itemId: 'lamp', value: Number.NaN },
      { type: 'release', itemId: 'tube-1' },
    ] as EngineAction[]) {
      expect(runEngine(pulling, start, action).world).toBe(start.world)
    }
  })

  it('runs the release handler and shows its hint', () => {
    const s = play([{ type: 'release', itemId: 'lamp' }], pulling)
    expect(s.world.items.lamp.state.swinging).toBe(true)
    expect(s.hint).toBe('Lampu berayun.')
  })
})

describe('guard', () => {
  const guarded: Experiment = {
    ...exp,
    guard: (_world, sourceId, targetId) =>
      sourceId === 'tube-1' && targetId === 'rack' ? 'Tunggu dulu.' : null,
  }

  it('refuses a move before any rule runs', () => {
    const s = play([drop('tube-1', 'rack')], guarded)
    expect(s.world.items['tube-1'].at).not.toBe('rack')
    expect(s.hint).toBe('Tunggu dulu.')
    expect(eventTypes(s)).toEqual(['rejected'])
  })

  it('lets other moves through', () => {
    const s = play([drop('tube-2', 'rack')], guarded)
    expect(s.world.items['tube-2'].at).toBe('rack')
  })
})
