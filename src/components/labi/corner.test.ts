import { describe, expect, it } from 'vitest'
import {
  bubbleBox,
  cornerBox,
  pickBubblePlace,
  pickCorner,
  type Room,
} from './corner'

const room: Room = { width: 360, height: 500, top: 8, side: 8, bottom: 60 }
const size = { w: 56, h: 62 }

describe("Labi's corner on a phone", () => {
  it('takes the top right when the room is free', () => {
    expect(pickCorner(room, size, [])).toBe('top-right')
  })

  it('moves away from what is on the bench', () => {
    const topRight = { x: 280, y: 0, w: 80, h: 100 }
    expect(pickCorner(room, size, [topRight])).toBe('top-left')
    const top = { x: 0, y: 0, w: 360, h: 100 }
    expect(pickCorner(room, size, [top])).toBe('bottom-right')
  })

  it('keeps clear of the edges and of the shelf strip at the bottom', () => {
    expect(cornerBox('bottom-left', room, size)).toEqual({
      x: 8,
      y: 500 - 60 - 62,
      ...size,
    })
    expect(cornerBox('top-right', room, size).x).toBe(360 - 8 - 56)
  })

  it('takes the corner covering the least when none is free', () => {
    const everywhere = { x: 0, y: 0, w: 360, h: 500 }
    const topLeft = { x: 0, y: 0, w: 100, h: 100 }
    expect(pickCorner(room, size, [everywhere, topLeft])).toBe('top-right')
  })
})

describe("Labi's balloon on a phone", () => {
  const labi = cornerBox('top-left', room, size)
  const bubble = { w: 250, h: 150 }

  it('goes beside Labi when that hides nothing', () => {
    expect(pickBubblePlace('top-left', labi, bubble, room, [])).toBe('beside')
    expect(bubbleBox('top-left', labi, bubble, 'beside')).toMatchObject({
      x: labi.x + labi.w + 8,
      y: labi.y,
    })
  })

  it('goes below Labi when beside it would hide a tool', () => {
    const bottles = { x: 280, y: 60, w: 70, h: 80 }
    expect(pickBubblePlace('top-left', labi, bubble, room, [bottles])).toBe(
      'stacked',
    )
  })

  it('stays in the room', () => {
    const low = cornerBox('bottom-right', room, size)
    const tall = { w: 250, h: 460 }
    const beside = { x: 0, y: 300, w: 200, h: 40 }
    expect(pickBubblePlace('bottom-right', low, tall, room, [beside])).toBe(
      'beside',
    )
  })
})
