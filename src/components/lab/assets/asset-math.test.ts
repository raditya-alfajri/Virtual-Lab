import { describe, expect, it } from 'vitest'
import {
  clampUnit,
  levelToY,
  secondsFromReading,
  stickerLines,
  stopwatchHandAngle,
  svgId,
} from './asset-math'

describe('clampUnit', () => {
  it('keeps values between 0 and 1 and treats junk as 0', () => {
    expect(clampUnit(0.4)).toBe(0.4)
    expect(clampUnit(-1)).toBe(0)
    expect(clampUnit(3)).toBe(1)
    expect(clampUnit(undefined)).toBe(0)
    expect(clampUnit('abc')).toBe(0)
  })
})

describe('levelToY', () => {
  it('maps an empty, half and full container between bottom and top', () => {
    expect(levelToY(0, 156, 20)).toBe(156)
    expect(levelToY(0.5, 156, 20)).toBe(88)
    expect(levelToY(1, 156, 20)).toBe(20)
    expect(levelToY(2, 156, 20)).toBe(20)
  })
})

describe('secondsFromReading', () => {
  it('reads Indonesian decimals and falls back to 0', () => {
    expect(secondsFromReading('12,3 s')).toBe(12.3)
    expect(secondsFromReading('0 s')).toBe(0)
    expect(secondsFromReading(undefined)).toBe(0)
    expect(secondsFromReading('—')).toBe(0)
  })
})

describe('stopwatchHandAngle', () => {
  it('turns 6 degrees per second and wraps every minute', () => {
    expect(stopwatchHandAngle(0)).toBe(0)
    expect(stopwatchHandAngle(15)).toBe(90)
    expect(stopwatchHandAngle(75)).toBe(90)
  })
})

describe('stickerLines', () => {
  it('puts the first word on its own line', () => {
    expect(stickerLines('Cuka')).toEqual(['Cuka'])
    expect(stickerLines('Air jeruk')).toEqual(['Air', 'jeruk'])
    expect(stickerLines('Botol air suling')).toEqual(['Botol', 'air suling'])
  })
})

describe('svgId', () => {
  it('drops characters that break url(#…) references', () => {
    expect(svgId('«r1»')).toBe('asset-r1')
    expect(svgId(':r2:')).toBe('asset-r2')
    expect(svgId('_r_3_')).toBe('asset-_r_3_')
  })
})
