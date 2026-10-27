import { describe, it, expect } from 'vitest'
import {
  fmt,
  mixColor,
  pressStopwatch,
  round,
  STOPWATCH_STATE,
  stopwatchView,
  tickStopwatch,
  update,
} from './instruments'
import type { World } from './types'

const world = (): World => ({
  time: 0,
  items: { sw: { at: 'shelf', state: { ...STOPWATCH_STATE } } },
})

describe('instrument helpers', () => {
  it('rounds and formats with a decimal comma', () => {
    expect(round(0.123456, 4)).toBe(0.1235)
    expect(fmt(0.5, 2)).toBe('0,50')
  })

  it('mixes colors from start to end', () => {
    expect(mixColor('#000000', '#FFFFFF', 0)).toBe('#000000')
    expect(mixColor('#000000', '#FFFFFF', 1)).toBe('#FFFFFF')
    expect(mixColor('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(mixColor('#000000', '#FFFFFF', 3)).toBe('#FFFFFF')
  })

  it('updates state without touching the original world', () => {
    const w = world()
    const next = update(w, 'sw', { running: true })
    expect(w.items.sw.state.running).toBe(false)
    expect(next.items.sw.state.running).toBe(true)
  })

  it('runs a stopwatch: start, count, stop, back to zero', () => {
    let w = pressStopwatch(world(), 'sw')
    expect(stopwatchView(w, 'sw').action).toBe('Berhenti')
    w = tickStopwatch(tickStopwatch(w, 'sw', 1.5), 'sw', 1)
    w = pressStopwatch(w, 'sw')
    expect(stopwatchView(w, 'sw')).toEqual({
      reading: '2,50 s',
      action: 'Nol-kan',
    })
    w = tickStopwatch(w, 'sw', 1)
    expect(stopwatchView(w, 'sw').reading).toBe('2,50 s')
    w = pressStopwatch(w, 'sw')
    expect(stopwatchView(w, 'sw')).toEqual({
      reading: '0,00 s',
      action: 'Mulai',
    })
  })
})
