import { describe, it, expect } from 'vitest'
import type { ClientRect } from '@dnd-kit/core'
import { innermostItemFirst } from './collision'

type Args = Parameters<ReturnType<typeof innermostItemFirst>>[0]

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }) as ClientRect

// Susunan K1 dalam koordinat panggung: rak 1, tabung di rak 1, panggung.
function argsAt(x: number, y: number, active = 'pipette'): Args {
  const rects = new Map([
    ['shelf', rect(0, 0, 1440, 1024)],
    ['rack-1', rect(1050, 520, 80, 170)],
    ['tube-1', rect(1050, 520, 80, 170)],
    ['pipette', rect(627, 515, 44, 180)],
  ])
  return {
    active: { id: active },
    collisionRect: rects.get(active)!,
    droppableRects: rects,
    droppableContainers: [...rects.keys()].map((id) => ({ id })),
    pointerCoordinates: { x, y },
  } as unknown as Args
}

const detect = innermostItemFirst(['rack-1', 'shelf'])

describe('innermostItemFirst', () => {
  it('picks the tube over the rack zone it sits in', () => {
    expect(detect(argsAt(1090, 600))[0].id).toBe('tube-1')
  })

  it('falls back to the shelf on an empty spot', () => {
    expect(detect(argsAt(700, 300))[0].id).toBe('shelf')
  })

  it('never targets the dragged item itself', () => {
    const ids = detect(argsAt(1090, 600, 'tube-1')).map((c) => c.id)
    expect(ids).toEqual(['rack-1', 'shelf'])
  })
})
