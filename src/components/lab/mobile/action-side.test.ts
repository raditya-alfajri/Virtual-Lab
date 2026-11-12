import { describe, expect, it } from 'vitest'
import { fitActionSide } from './action-side'

describe('fitActionSide', () => {
  // The flask in the reaction-rate bath, near the right edge of the stage.
  const flaskInBath = { x: 1067, y: 479, w: 132, h: 161 }

  it('keeps a button that fits beside the item', () => {
    expect(fitActionSide('right', flaskInBath, 100)).toBe('right')
    expect(fitActionSide('left', flaskInBath, 100)).toBe('left')
  })

  it('moves a button off the right edge to the left of the item', () => {
    expect(fitActionSide('right', flaskInBath, 246)).toBe('left')
  })

  it('moves a button off the left edge to the right of the item', () => {
    expect(fitActionSide('left', { x: 40, y: 0, w: 60, h: 60 }, 120)).toBe(
      'right',
    )
  })

  it('stays put when neither side has room', () => {
    expect(fitActionSide('right', { x: 0, y: 0, w: 1440, h: 60 }, 50)).toBe(
      'right',
    )
  })

  it('leaves buttons above and below the item alone', () => {
    expect(fitActionSide('below', flaskInBath, 2000)).toBe('below')
    expect(fitActionSide('above', flaskInBath, 2000)).toBe('above')
  })
})
