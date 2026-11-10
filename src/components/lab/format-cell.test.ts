import { describe, expect, it } from 'vitest'
import { formatCell } from './format-cell'

describe('formatCell', () => {
  it('keeps strings as the data wrote them', () => {
    expect(formatCell('0,100')).toBe('0,100')
    expect(formatCell('Biru tua')).toBe('Biru tua')
  })

  it('writes numbers the Indonesian way', () => {
    expect(formatCell(7)).toBe('7')
    expect(formatCell(0.5)).toBe('0,5')
    expect(formatCell(1250)).toBe('1.250')
  })

  it('writes booleans as Ya or Tidak, and missing values as empty', () => {
    expect(formatCell(true)).toBe('Ya')
    expect(formatCell(false)).toBe('Tidak')
    expect(formatCell(undefined)).toBe('')
  })
})
