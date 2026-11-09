import { describe, expect, it } from 'vitest'
import { fitStage } from './fit-stage'

describe('fitStage', () => {
  it('fills a box with the same aspect ratio exactly', () => {
    expect(fitStage(720, 512)).toEqual({ scale: 0.5, left: 0 })
  })

  it('is limited by height in a wide box and centred horizontally', () => {
    expect(fitStage(2000, 512)).toEqual({ scale: 0.5, left: 640 })
  })

  it('is limited by width in a tall box', () => {
    expect(fitStage(720, 1000)).toEqual({ scale: 0.5, left: 0 })
  })

  it('has no size before the box is measured or when it is too small', () => {
    expect(fitStage(0, 0)).toEqual({ scale: 0, left: 0 })
    expect(fitStage(500, -20)).toEqual({ scale: 0, left: 250 })
  })
})
