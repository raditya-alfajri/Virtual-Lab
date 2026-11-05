import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../../lib/engine'
import {
  reactionRate as exp,
  reactionTime,
  relativeRate,
} from './reaction-rate'

const run = (s: EngineState, ...actions: EngineAction[]) =>
  actions.reduce((acc, a) => runEngine(exp, acc, a), s)
const drop = (id: string, target: string): EngineAction => ({
  type: 'drop',
  id,
  target,
})
const tap = (id: string): EngineAction => ({ type: 'use', id })
const tick = (dt: number): EngineAction => ({ type: 'tick', dt })
const seconds = (n: number, dt = 1) =>
  Array.from({ length: Math.round(n / dt) }, () => tick(dt))
const start = () => createInitialState(exp)
const hint = (s: EngineState) => s.hint?.text
const flask = (s: EngineState) => s.world.items.flask.state

const fill = (bottle: string) => [
  drop('flask', 'bench'),
  drop(bottle, 'flask'),
  drop('thermometer', 'flask'),
]
// Panaskan sampai suhu yang diinginkan lalu matikan pemanas.
const heat = (secondsOn: number, dt = 1) => [
  drop('flask', 'bath'),
  tap('bath'),
  ...seconds(secondsOn, dt),
  tap('bath'),
]
const react = [drop('flask', 'paper'), tap('stopwatch'), drop('hcl', 'flask')]
const trial = (bottle: string, secondsOn = 0) => [
  ...fill(bottle),
  ...(secondsOn ? heat(secondsOn) : []),
  ...react,
]
const clean = [drop('flask', 'shelf'), tap('stopwatch')]

describe('K3 Laju Reaksi: formula', () => {
  it.each([
    [0.2, 25, 60],
    [0.1, 35, 60],
    [0.1, 25, 120],
    [0.05, 25, 240],
    [0.2, 35, 30],
    [0.2, 55, 7.5],
  ])('%s M at %s °C → %s s', (c, T, t) => {
    expect(reactionTime(c, T)).toBeCloseTo(t, 10)
  })

  it('relative rate is 1/t', () => {
    expect(relativeRate(60)).toBeCloseTo(1 / 60, 10)
  })
})

describe('K3 Laju Reaksi: process', () => {
  it('records a row when the cross disappears', () => {
    let s = run(start(), ...trial('thio-020'), ...seconds(59))
    expect(s.rows).toHaveLength(0)
    s = run(s, tick(1))
    expect(s.rows).toEqual([
      { suhu: 25, konsentrasi: 0.2, waktu: 60, laju: 0.0167 },
    ])
    expect(s.explanation?.result).toContain('60 s')
    expect(s.explanation?.reason).toContain('tumbukan')
    expect(s.explanation?.formula).toContain('2^(−(T − T₀) ÷ 10)')
    expect(exp.view(s.world).paper.label).toBe('Tanda silang hilang')
  })

  it('fades the cross gradually', () => {
    let s = run(start(), ...trial('thio-020'))
    expect(exp.view(s.world).paper.visibility).toBe(1)
    s = run(s, ...seconds(30))
    expect(exp.view(s.world).paper.visibility).toBe(0.5)
    expect(exp.view(s.world).paper.label).toBe('Tanda silang memudar…')
    expect(exp.view(s.world).flask.color).not.toBe(
      exp.view(start().world).flask.color,
    )
    s = run(s, ...seconds(30))
    expect(exp.view(s.world).paper.visibility).toBe(0)
  })

  it('heats gradually only while the heater is on', () => {
    let s = run(start(), ...fill('thio-010'), drop('flask', 'bath'))
    expect(hint(s)).toBe('Nyalakan pemanas dulu agar suhu naik.')
    expect(exp.isActive(s.world)).toBe(false)
    s = run(s, tick(1))
    expect(flask(s).temp).toBe(25)

    s = run(s, tap('bath'), ...seconds(10))
    expect(exp.view(s.world).thermometer.reading).toBe('30 °C')
    s = run(s, tap('bath'), ...seconds(10))
    expect(flask(s).temp).toBe(30)
    expect(exp.isActive(s.world)).toBe(false)
  })

  it('0,1 M at 35 °C takes 60 s, and the thermometer moves with the flask', () => {
    let s = run(start(), ...fill('thio-010'), ...heat(20))
    expect(exp.view(s.world).thermometer.reading).toBe('35 °C')
    s = run(s, drop('flask', 'paper'))
    expect(s.world.items.thermometer.at).toBe('flask')
    expect(s.world.items.flask.at).toBe('paper')
    s = run(s, tap('stopwatch'), drop('hcl', 'flask'), ...seconds(60))
    expect(s.rows).toEqual([
      { suhu: 35, konsentrasi: 0.1, waktu: 60, laju: 0.0167 },
    ])
  })

  it('gives the same result in any order', () => {
    const a = run(
      start(),
      drop('thermometer', 'flask'),
      drop('flask', 'paper'),
      drop('thio-005', 'flask'),
      tap('stopwatch'),
      drop('hcl', 'flask'),
      ...seconds(240),
    )
    const b = run(start(), ...trial('thio-005'), ...seconds(240))
    expect(a.rows).toEqual(b.rows)
    expect(a.rows).toEqual([
      { suhu: 25, konsentrasi: 0.05, waktu: 240, laju: 0.0042 },
    ])
  })

  it('locks the temperature when HCl is poured, rounded to whole degrees', () => {
    let s = run(
      start(),
      ...fill('thio-020'),
      ...heat(20.4, 0.4), // 35,2 °C
      ...react,
    )
    expect(flask(s).reactionTemp).toBe(35)
    // Pemanas dinyalakan lagi tidak memengaruhi labu di atas kertas.
    s = run(s, tap('bath'), ...seconds(30))
    expect(exp.view(s.world).thermometer.reading).toBe('35 °C')
    expect(s.rows).toEqual([
      { suhu: 35, konsentrasi: 0.2, waktu: 30, laju: 0.0333 },
    ])

    // 34,8 °C dibulatkan ke 35 °C: tidak ada baris yang hampir sama.
    s = run(
      s,
      tap('bath'),
      ...clean,
      ...fill('thio-020'),
      ...heat(19.6, 0.4),
      ...react,
      ...seconds(30),
    )
    expect(s.rows).toHaveLength(1)
  })

  it('stopwatch counts from the HCl pour and stops at the reaction time', () => {
    const s = run(
      start(),
      ...fill('thio-020'),
      drop('flask', 'paper'),
      tap('stopwatch'),
      ...seconds(10),
      drop('hcl', 'flask'),
      ...seconds(60),
    )
    expect(exp.view(s.world).stopwatch.reading).toBe('60,00 s')
    expect(s.world.items.stopwatch.state.running).toBe(false)
    expect(exp.isActive(s.world)).toBe(false)
  })

  it('records nothing if the stopwatch was stopped before the cross disappeared', () => {
    const s = run(
      start(),
      ...trial('thio-020'),
      ...seconds(20),
      tap('stopwatch'),
      ...seconds(40),
    )
    expect(s.rows).toHaveLength(0)
    expect(hint(s)).toContain('stopwatch tidak berjalan')
  })

  it('does not record the same trial twice', () => {
    const s = run(
      start(),
      ...trial('thio-015'),
      ...seconds(81),
      ...clean,
      ...trial('thio-015'),
      ...seconds(81),
    )
    expect(s.rows).toEqual([
      { suhu: 25, konsentrasi: 0.15, waktu: 80, laju: 0.0125 },
    ])
  })

  it('a flask returned to the shelf is clean and back at 25 °C', () => {
    const s = run(
      start(),
      ...fill('thio-020'),
      ...heat(10),
      drop('flask', 'shelf'),
    )
    expect(s.world.items.flask).toEqual(start().world.items.flask)
    expect(s.world.items.thermometer.at).toBe('shelf')
  })
})

describe('K3 Laju Reaksi: educational rejections', () => {
  it('HCl without Na₂S₂O₃ does not react', () => {
    const s = run(
      start(),
      drop('flask', 'paper'),
      drop('thermometer', 'flask'),
      tap('stopwatch'),
      drop('hcl', 'flask'),
    )
    expect(hint(s)).toBe(
      'HCl tanpa Na₂S₂O₃ tidak bereaksi. Tuang larutan Na₂S₂O₃ ke labu dulu.',
    )
    expect(flask(s).acid).toBe(false)
  })

  it('the stopwatch must run before HCl is poured', () => {
    const s = run(
      start(),
      ...fill('thio-020'),
      drop('flask', 'paper'),
      drop('hcl', 'flask'),
    )
    expect(hint(s)).toBe('Jalankan stopwatch dulu sebelum menuang HCl.')
    expect(flask(s).acid).toBe(false)
    expect(exp.isActive(s.world)).toBe(false)
  })

  it('HCl needs the flask on the cross paper and a thermometer', () => {
    let s = run(
      start(),
      ...fill('thio-020'),
      tap('stopwatch'),
      drop('hcl', 'flask'),
    )
    expect(hint(s)).toContain('Taruh labu di atas kertas bertanda silang dulu')
    s = run(
      start(),
      drop('flask', 'paper'),
      drop('thio-020', 'flask'),
      tap('stopwatch'),
      drop('hcl', 'flask'),
    )
    expect(hint(s)).toBe('Pasang termometer di labu dulu agar suhunya terbaca.')
    expect(s.rows).toHaveLength(0)
  })

  it('HCl cannot be poured twice', () => {
    let s = run(start(), ...trial('thio-020'), drop('hcl', 'flask'))
    expect(hint(s)).toBe(
      'HCl sudah dituang. Tunggu sampai tanda silang hilang.',
    )
    s = run(s, ...seconds(60), drop('hcl', 'flask'))
    expect(hint(s)).toContain('Reaksi di labu ini sudah selesai')
  })

  it('one flask holds one solution and must be on the bench', () => {
    let s = run(start(), drop('thio-020', 'flask'))
    expect(hint(s)).toBe('Taruh labu di meja kerja dulu.')
    s = run(start(), ...fill('thio-020'), drop('thio-005', 'flask'))
    expect(hint(s)).toContain('Satu labu hanya untuk satu larutan')
    expect(flask(s).conc).toBe(0.2)
  })

  it('limits the temperature to 55 °C', () => {
    let s = run(
      start(),
      ...fill('thio-020'),
      drop('flask', 'bath'),
      tap('bath'),
    )
    s = run(s, ...seconds(60))
    expect(flask(s).temp).toBe(55)
    expect(s.world.items.bath.state.on).toBe(false)
    expect(hint(s)).toContain('Suhu sudah 55 °C')
    expect(exp.isActive(s.world)).toBe(false)

    s = run(s, tap('bath'))
    expect(hint(s)).toBe('Suhu sudah 55 °C, batas tertinggi percobaan ini.')
    expect(s.world.items.bath.state.on).toBe(false)

    s = run(s, ...react, ...seconds(7.5, 0.5))
    expect(s.rows).toEqual([
      { suhu: 55, konsentrasi: 0.2, waktu: 7.5, laju: 0.1333 },
    ])
  })

  it('the heater does nothing without a filled flask', () => {
    const s = run(start(), tap('bath'), ...seconds(5))
    expect(hint(s)).toContain('Taruh labu berisi Na₂S₂O₃ di penangas')
    expect(exp.isActive(s.world)).toBe(false)
    expect(flask(s).temp).toBe(25)
  })

  it('the flask and thermometer stay put while reacting', () => {
    let s = run(start(), ...trial('thio-020'), drop('flask', 'bath'))
    expect(hint(s)).toContain('Reaksi sedang berjalan')
    expect(s.world.items.flask.at).toBe('paper')
    s = run(s, drop('thermometer', 'shelf'))
    expect(hint(s)).toContain('Reaksi sedang berjalan')
    expect(s.world.items.thermometer.at).toBe('flask')

    s = run(s, drop('flask', 'shelf'))
    expect(s.world.items.flask).toEqual(start().world.items.flask)
  })
})

describe('K3 Laju Reaksi: view keys for the lab scene', () => {
  const view = (s: EngineState) => exp.view(s.world)

  it('tells whether the heater is on', () => {
    expect(view(start()).bath.on).toBe(false)
    const s = run(start(), tap('bath'))
    expect(view(s).bath.on).toBe(true)
    expect(view(run(s, tap('bath'))).bath.on).toBe(false)
  })

  it('gives the thermometer temperature, room temperature outside the flask', () => {
    expect(view(start()).thermometer.temp).toBe(25)
    const s = run(start(), ...fill('thio-020'), ...heat(10))
    expect(view(s).thermometer.temp).toBe(30)
    expect(view(s).thermometer.reading).toBe('30 °C')
  })

  it('gives the stopwatch time in seconds', () => {
    expect(view(start()).stopwatch.elapsed).toBe(0)
    const s = run(start(), tap('stopwatch'), ...seconds(2, 0.5))
    expect(view(s).stopwatch.elapsed).toBeCloseTo(2, 10)
  })
})
