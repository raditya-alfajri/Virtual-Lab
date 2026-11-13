import { describe, expect, it } from 'vitest'
import {
  draggedItemId,
  isTrayDrag,
  startConstraint,
  trayDragId,
} from './tray-drag'

describe('tray drag', () => {
  it('drags the same item from the tray as from the room', () => {
    const id = trayDragId('cart')
    expect(id).not.toBe('cart')
    expect(isTrayDrag(id)).toBe(true)
    expect(isTrayDrag('cart')).toBe(false)
    expect(draggedItemId(id)).toBe('cart')
    expect(draggedItemId('cart')).toBe('cart')
  })

  it('starts a tray drag on a pull up, so a sideways swipe still scrolls', () => {
    const usual = { distance: 5 }
    expect(startConstraint('cart', usual)).toBe(usual)
    expect(startConstraint(trayDragId('cart'), usual)).toEqual({
      distance: { y: 8 },
      tolerance: { x: 12 },
    })
  })
})
