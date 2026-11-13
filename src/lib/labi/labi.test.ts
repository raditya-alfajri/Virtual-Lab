import { describe, expect, it } from 'vitest'
import { newtonLaw } from '../../data/fisika/newton-law'
import { createInitialState, getView } from '../engine'
import { buildLabContext, describeRow } from './context'
import { isBackchannel, isLikelyEcho, words } from './speech-text'

describe('buildLabContext', () => {
  const state = createInitialState(newtonLaw)
  const context = buildLabContext(newtonLaw, {
    world: state.world,
    view: getView(newtonLaw, state),
    columns: newtonLaw.columns,
    rows: [{ gaya: 4, massa: 0.5, waktu: 0.5, percepatan: 8, kecepatan: 16 }],
    latest: null,
    next: null,
    predictionAnswer: 'Setengahnya',
  })

  it('says where every item is and what it shows', () => {
    const cart = context.items.find((item) => item.id === 'cart')
    expect(cart).toMatchObject({ name: 'Troli', at: 'di rak alat' })
    expect(cart?.note).toContain('0,5 kg')
  })

  it('carries the table as shown to the student', () => {
    expect(context.columns[0]).toBe('Gaya F (N)')
    expect(context.rows).toEqual([['4', '0,5', '0,5', '8', '16']])
  })

  it('carries the prediction and its answer', () => {
    expect(context.prediction).toEqual({
      question: newtonLaw.prediction.question,
      answer: 'Setengahnya',
    })
  })
})

describe('describeRow', () => {
  it('reads a row as label and value pairs', () => {
    expect(
      describeRow(newtonLaw.columns.slice(0, 2), { gaya: 4, massa: 0.5 }),
    ).toBe('Gaya F (N) 4, Massa m (kg) 0,5')
  })
})

describe('speech text', () => {
  it('splits into lower-case words', () => {
    expect(words('Oke, Labi!')).toEqual(['oke', 'labi'])
  })

  it('knows short acknowledgements', () => {
    expect(isBackchannel('Oke, iya.')).toBe(true)
    expect(isBackchannel('Oke, kenapa begitu?')).toBe(false)
    expect(isBackchannel('')).toBe(false)
  })

  it("recognises Labi's own words coming back", () => {
    const spoken = 'Coba pasang kipas di belakang troli dulu, ya.'
    expect(isLikelyEcho('pasang kipas di belakang troli', spoken)).toBe(true)
    expect(isLikelyEcho('kenapa harus pakai kipas', spoken)).toBe(false)
    expect(isLikelyEcho('', spoken)).toBe(false)
  })
})
