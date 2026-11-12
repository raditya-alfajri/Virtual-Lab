import { describe, expect, it } from 'vitest'
import { amountOf, firstNumber } from './physics-math'

describe('firstNumber', () => {
  it('reads whole and decimal-comma numbers', () => {
    expect(firstNumber('Bandul 200 g')).toBe(200)
    expect(firstNumber('Beban 0,5 kg')).toBe(0.5)
    expect(firstNumber('Troli')).toBe(0)
  })
})

describe('amountOf', () => {
  it('drops the first word', () => {
    expect(amountOf('Kipas 2 N')).toBe('2 N')
    expect(amountOf('Beban 50 g')).toBe('50 g')
    expect(amountOf('Troli')).toBe('')
  })
})
