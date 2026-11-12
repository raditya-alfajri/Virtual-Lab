import { describe, expect, it } from 'vitest'
import { touchTarget } from './touch-target'

describe('touchTarget', () => {
  it('needs no larger box for a rect that is big enough', () => {
    expect(touchTarget({ x: 0, y: 0, w: 50, h: 60 }, 44)).toBeUndefined()
  })

  it('grows a small rect about its centre', () => {
    expect(touchTarget({ x: 100, y: 100, w: 20, h: 30 }, 44)).toEqual({
      x: 88,
      y: 93,
      w: 44,
      h: 44,
    })
  })

  it('only grows the axis that is too short', () => {
    expect(touchTarget({ x: 0, y: 0, w: 80, h: 20 }, 44)).toEqual({
      x: 0,
      y: -12,
      w: 80,
      h: 44,
    })
  })

  it('grows an attached item from the part above its parent, upwards', () => {
    const flask = { x: 1067, y: 479, w: 132, h: 161 }
    const thermometer = { x: 1113, y: 423, w: 40, h: 210 }
    const box = touchTarget(thermometer, 88, flask)
    expect(box).toEqual({ x: 1089, y: 391, w: 88, h: 88 })
    expect(box && box.y + box.h).toBe(flask.y)
  })

  it('grows sideways away from the parent for a part sticking out left', () => {
    const parent = { x: 100, y: 0, w: 100, h: 100 }
    const box = touchTarget({ x: 90, y: 10, w: 40, h: 20 }, 44, parent)
    expect(box).toEqual({ x: 56, y: -2, w: 44, h: 44 })
    expect(box && box.x + box.w).toBe(parent.x)
  })

  it('does not grow an attached item that stays inside its parent', () => {
    const parent = { x: 0, y: 0, w: 200, h: 200 }
    expect(
      touchTarget({ x: 50, y: 50, w: 10, h: 10 }, 44, parent),
    ).toBeUndefined()
  })

  it('does not grow a part that already sticks out far enough', () => {
    const parent = { x: 0, y: 100, w: 200, h: 100 }
    expect(
      touchTarget({ x: 50, y: 0, w: 60, h: 150 }, 44, parent),
    ).toBeUndefined()
  })
})
