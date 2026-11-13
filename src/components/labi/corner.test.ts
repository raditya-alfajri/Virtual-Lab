import { describe, expect, it } from 'vitest'
import {
  cornerBox,
  pickCorner,
  placeBubble,
  snapToEdge,
  spotBox,
  spotOf,
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

describe('dragging Labi on a phone', () => {
  it('lands on the nearest edge when let go in the middle', () => {
    const spot = snapToEdge({ x: 20, y: 200 }, room, size, [])
    expect(spotBox(spot, room, size)).toMatchObject({ x: 8 })
    expect(spotBox(spot, room, size).y).toBeCloseTo(200, -1)
  })

  it('lands in the corner when let go near it', () => {
    const spot = snapToEdge({ x: 290, y: 10 }, room, size, [])
    expect(spot).toEqual({ fx: 1, fy: 0 })
  })

  it('slides along the edge off a tool it would cover', () => {
    const tool = { x: 0, y: 180, w: 80, h: 80 }
    const box = spotBox(
      snapToEdge({ x: 8, y: 200 }, room, size, [tool]),
      room,
      size,
    )
    expect(box.y + box.h <= 170 || box.y >= 270).toBe(true)
  })

  it('keeps its place between the edges as the room changes size', () => {
    const spot = spotOf({ x: 296, y: 200 }, room, size)
    const taller = { ...room, height: 600 }
    const box = spotBox(spot, taller, size)
    expect(box.x).toBe(296)
    expect(box.y).toBeGreaterThan(200)
    expect(box.y + box.h).toBeLessThanOrEqual(600 - room.bottom)
  })
})

describe("Labi's balloon on a phone", () => {
  const bubble = { w: 250, h: 150 }
  const inRoom = (box: { x: number; y: number; w: number; h: number }) =>
    box.x >= room.side &&
    box.y >= room.top &&
    box.x + box.w <= room.width - room.side &&
    box.y + box.h <= room.height

  it('goes beside Labi, toward the middle, when that hides nothing', () => {
    const labi = cornerBox('top-left', room, size)
    expect(placeBubble(labi, bubble, room, [])).toMatchObject({
      x: labi.x + labi.w + 8,
      y: labi.y,
    })
  })

  it('goes below Labi when beside it would hide a tool', () => {
    const labi = cornerBox('top-left', room, size)
    const bottles = { x: 280, y: 60, w: 70, h: 80 }
    const box = placeBubble(labi, bubble, room, [bottles])
    expect(box.y).toBeGreaterThanOrEqual(labi.y + labi.h)
  })

  it('stays in the room and clear of Labi wherever Labi is put', () => {
    for (const fx of [0, 0.5, 1]) {
      for (const fy of [0, 0.5, 1]) {
        const labi = spotBox({ fx, fy }, room, size)
        const box = placeBubble(labi, bubble, room, [])
        expect(inRoom(box)).toBe(true)
        expect(
          box.x >= labi.x + labi.w ||
            box.x + box.w <= labi.x ||
            box.y >= labi.y + labi.h ||
            box.y + box.h <= labi.y,
        ).toBe(true)
      }
    }
  })
})
