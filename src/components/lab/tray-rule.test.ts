import { describe, expect, it } from 'vitest'
import { fitCamera, visibleArea } from './camera'
import { follow, movingItems, NO_TRACK, SETTLE_S } from './moving'
import { inTray, type TrayRule } from './tray-rule'

describe('visibleArea', () => {
  it('is the part of the stage the frame shows', () => {
    const frame = { width: 360, height: 504 }
    const camera = fitCamera({ x: 480, y: 470, w: 495, h: 290 }, frame, {
      width: 1440,
      height: 1024,
    })
    const seen = visibleArea(camera, frame)
    expect(seen.x).toBeCloseTo(480)
    expect(seen.w).toBeCloseTo(495)
    expect(seen.h).toBeCloseTo(504 / camera.scale)
  })
})

describe('tool tray on a phone', () => {
  const seen = { x: 100, y: 100, w: 400, h: 300 }
  const rule: TrayRule = { kind: 'sight', seen, moving: new Set() }

  it('leaves a tool that is only a little cut on the bench', () => {
    expect(inTray('tube', { x: 470, y: 150, w: 80, h: 100 }, rule)).toBe(false)
    expect(inTray('tube', { x: 495, y: 150, w: 80, h: 100 }, rule)).toBe(false)
  })

  it('holds a tool wholly out of sight', () => {
    expect(inTray('tube', { x: 500, y: 150, w: 80, h: 100 }, rule)).toBe(true)
    expect(inTray('tube', { x: 150, y: 0, w: 80, h: 100 }, rule)).toBe(true)
  })

  it('never takes a tool while it moves', () => {
    const rolling: TrayRule = { kind: 'sight', seen, moving: new Set(['cart']) }
    expect(inTray('cart', { x: 900, y: 150, w: 80, h: 50 }, rolling)).toBe(
      false,
    )
  })

  it('elsewhere holds the tools mostly outside the work area', () => {
    const region: TrayRule = { kind: 'region', region: seen }
    expect(inTray('tube', { x: 470, y: 150, w: 80, h: 100 }, region)).toBe(true)
    expect(inTray('tube', { x: 440, y: 150, w: 80, h: 100 }, region)).toBe(
      false,
    )
  })
})

describe('moving items', () => {
  const at = (x: number) => ({ cart: { x, y: 0, w: 10, h: 10 } })

  it('counts an item as moving while its place changes, and a little after', () => {
    let track = follow(NO_TRACK, at(0), 0)
    expect(movingItems(track, 0).size).toBe(0)
    track = follow(track, at(5), 1)
    expect(movingItems(track, 1).has('cart')).toBe(true)
    track = follow(track, at(5), 1 + SETTLE_S / 2)
    expect(movingItems(track, 1 + SETTLE_S / 2).has('cart')).toBe(true)
    expect(movingItems(track, 1.01 + SETTLE_S).has('cart')).toBe(false)
  })

  it('keeps the same track while nothing moves', () => {
    const track = follow(NO_TRACK, at(0), 0)
    expect(follow(track, at(0), 3)).toBe(track)
  })

  it('forgets a move from before a reset', () => {
    const track = follow(follow(NO_TRACK, at(0), 0), at(5), 4)
    expect(movingItems(track, 0).size).toBe(0)
  })
})
