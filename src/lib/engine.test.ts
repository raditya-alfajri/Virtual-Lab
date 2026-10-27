import { describe, it, expect } from 'vitest'
import {
  runEngine,
  createInitialState,
  MAX_DT,
  type EngineAction,
  type EngineState,
} from './engine'
import { sampleK1 } from './sample-experiment'
import { ok, update } from '../data/instruments'
import type { Experiment } from '../data/types'

const start = () => createInitialState(sampleK1)

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(sampleK1, acc, a), s)

const drop = (id: string, target: string): EngineAction => ({
  type: 'drop',
  id,
  target,
})
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })

describe('sandbox engine: placing items', () => {
  it('starts with items on the shelf or at their start zone', () => {
    const s = start()
    expect(s.world.time).toBe(0)
    expect(s.world.items['tube-1']).toEqual({
      at: 'shelf',
      state: { solution: '', indicator: false, progress: 0 },
    })
    expect(s.world.items.lamp.at).toBe('bench')
  })

  it('moves an item into a zone that accepts it', () => {
    const s = run(start(), drop('tube-1', 'rack-1'))
    expect(s.world.items['tube-1'].at).toBe('rack-1')
    expect(s.hint).toBeNull()
  })

  it('rejects a full zone with a hint near that zone', () => {
    const s = run(start(), drop('tube-1', 'rack-1'), drop('tube-2', 'rack-1'))
    expect(s.world.items['tube-2'].at).toBe('shelf')
    expect(s.hint).toEqual({
      text: 'Rak 1 sudah penuh. Pindahkan dulu isinya.',
      target: 'rack-1',
    })
  })

  it('rejects an item the zone does not accept', () => {
    const s = run(start(), drop('indicator', 'rack-1'))
    expect(s.hint?.text).toBe('Indikator tidak bisa ditaruh di Rak 1.')
  })

  it('rejects dropping onto an item without an interaction', () => {
    const s = run(start(), drop('stopwatch', 'tube-1'))
    expect(s.hint?.text).toBe('Stopwatch tidak bisa dipakai pada Tabung.')
  })

  it('ignores unknown items, unknown targets, fixed items and no-op moves', () => {
    const s = start()
    expect(run(s, drop('garam', 'rack-1'))).toBe(s)
    expect(run(s, drop('tube-1', 'meja-lain'))).toBe(s)
    expect(run(s, drop('lamp', 'rack-1'))).toBe(s)
    expect(run(s, drop('tube-1', 'shelf'))).toBe(s)
    expect(run(s, drop('tube-1', 'tube-1'))).toBe(s)
  })

  it('clears a hint after the next successful action', () => {
    const s = run(
      start(),
      drop('indicator', 'rack-1'),
      drop('tube-1', 'rack-1'),
    )
    expect(s.hint).toBeNull()
  })

  it('returns an item to the shelf clean, together with what is attached', () => {
    let s = run(start(), drop('tube-1', 'rack-1'), drop('acid', 'tube-1'))
    s = {
      ...s,
      world: {
        ...s.world,
        items: { ...s.world.items, stopwatch: { at: 'tube-1', state: {} } },
      },
    }
    expect(run(s, drop('stopwatch', 'tube-1'))).toBe(s)
    expect(run(s, drop('tube-1', 'stopwatch'))).toBe(s)

    s = run(s, drop('tube-1', 'shelf'))
    expect(s.world.items['tube-1']).toEqual(start().world.items['tube-1'])
    expect(s.world.items.stopwatch).toEqual(start().world.items.stopwatch)
  })
})

describe('sandbox engine: processes and measurement', () => {
  const ready = () =>
    run(start(), drop('tube-1', 'rack-1'), drop('acid', 'tube-1'))

  it('works in any order: solution first or indicator first', () => {
    const a = run(ready(), drop('indicator', 'tube-1'), tick(1))
    const b = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('indicator', 'tube-1'),
      drop('acid', 'tube-1'),
      tick(1),
    )
    expect(a.world.items['tube-1']).toEqual(b.world.items['tube-1'])
  })

  it('rejects a measurement before the process has finished', () => {
    const s = run(ready(), drop('indicator', 'tube-1'), tick(0.5))
    const measured = run(s, drop('tube-1', 'card'))
    expect(measured.hint?.text).toBe('Tunggu warnanya.')
    expect(measured.rows).toHaveLength(0)
  })

  it('records a row only through the measuring tool, and only once', () => {
    let s = run(ready(), drop('indicator', 'tube-1'), tick(1))
    expect(s.rows).toHaveLength(0)
    s = run(s, drop('tube-1', 'card'), drop('tube-1', 'card'))
    expect(s.rows).toEqual([{ larutan: 'acid', ph: 3 }])
    expect(s.explanation?.result).toBe('pH 3')
    expect(s.world.items['tube-1'].at).toBe('rack-1')
  })

  it('keeps the explanation until a new result arrives', () => {
    let s = run(ready(), drop('indicator', 'tube-1'), tick(1))
    s = run(s, drop('tube-1', 'card'), drop('tube-2', 'rack-2'))
    expect(s.explanation?.result).toBe('pH 3')
  })

  it('does nothing on tick while no process is running', () => {
    const s = ready()
    expect(run(s, tick(0.5))).toBe(s)
  })

  it('ignores zero or negative dt and caps a large dt', () => {
    const s = run(start(), { type: 'use', id: 'stopwatch' })
    expect(run(s, tick(0))).toBe(s)
    expect(run(s, tick(-1))).toBe(s)
    const late = run(s, tick(10))
    expect(late.world.time).toBe(MAX_DT)
    expect(late.world.items.stopwatch.state.elapsed).toBe(MAX_DT)
  })

  it('gives the same result for one big tick or many small ticks', () => {
    const s = run(ready(), drop('indicator', 'tube-1'))
    const one = run(s, tick(0.8))
    const many = run(s, ...Array.from({ length: 8 }, () => tick(0.1)))
    expect(many.world.time).toBeCloseTo(one.world.time)
    expect(Number(many.world.items['tube-1'].state.progress)).toBeCloseTo(
      Number(one.world.items['tube-1'].state.progress),
    )
  })

  it('keeps a hint shown while time passes', () => {
    let s = run(ready(), drop('indicator', 'tube-1'), drop('tube-1', 'card'))
    s = run(s, tick(0.1))
    expect(s.hint?.text).toBe('Tunggu warnanya.')
  })
})

describe('sandbox engine: tapping, pulling, guards', () => {
  it('runs the tap handler of an item kind', () => {
    const s = run(start(), { type: 'use', id: 'stopwatch' })
    expect(s.world.items.stopwatch.state.running).toBe(true)
    expect(run(s, { type: 'use', id: 'tube-1' })).toBe(s)
  })

  it('runs pull and release handlers', () => {
    const exp: Experiment = {
      ...sampleK1,
      pull: {
        lamp: (w, id, value) =>
          value > 15
            ? { reject: 'Terlalu jauh.' }
            : ok(update(w, id, { angle: value })),
      },
      release: { lamp: (w, id) => ok(update(w, id, { released: true })) },
    }
    let s = runEngine(exp, createInitialState(exp), {
      type: 'pull',
      id: 'lamp',
      value: 20,
    })
    expect(s.hint).toEqual({ text: 'Terlalu jauh.', target: 'lamp' })
    s = runEngine(exp, s, { type: 'pull', id: 'lamp', value: 10 })
    s = runEngine(exp, s, { type: 'release', id: 'lamp' })
    expect(s.world.items.lamp.state).toEqual({ angle: 10, released: true })
  })

  it('lets a guard reject a move before anything happens', () => {
    const exp: Experiment = {
      ...sampleK1,
      guard: (w, id) =>
        w.items[id].at === 'rack-1' ? 'Tabung sedang dipakai.' : null,
    }
    let s = runEngine(exp, createInitialState(exp), drop('tube-1', 'rack-1'))
    s = runEngine(exp, s, drop('tube-1', 'shelf'))
    expect(s.hint?.text).toBe('Tabung sedang dipakai.')
    expect(s.world.items['tube-1'].at).toBe('rack-1')
  })

  it('removes a row and resets everything', () => {
    let s = run(
      start(),
      drop('tube-1', 'rack-1'),
      drop('acid', 'tube-1'),
      drop('indicator', 'tube-1'),
      tick(1),
      drop('tube-1', 'card'),
    )
    expect(run(s, { type: 'removeRow', index: 0 }).rows).toHaveLength(0)
    s = run(s, { type: 'reset' })
    expect(s).toEqual(start())
  })
})
