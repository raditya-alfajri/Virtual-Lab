import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LabContext } from '../../../api/_lib/protocol'
import { newtonLaw } from '../../data/fisika/newton-law'
import { createInitialState, getView } from '../engine'
import { buildLabContext, describeRow } from './context'
import type { Recording } from './microphone'
import { LabiSession, MIC_READY, NOT_HEARD, TOO_SHORT } from './session'
import { isBackchannel, isLikelyEcho, words } from './speech-text'

const mic = vi.hoisted(() => ({
  start: vi.fn<(onPartial: (text: string) => void) => Promise<Recording>>(),
}))
vi.mock('./microphone', () => ({ startRecording: mic.start }))
vi.mock('./speech-player', () => ({
  unlockAudio: () => {},
  SpeechPlayer: class {
    play() {}
    endSentence() {}
    finish() {}
    stop() {}
  },
}))
const turns = vi.hoisted(() => ({ request: vi.fn() }))
vi.mock('./turn-client', () => ({
  requestTurn: turns.request,
  TurnError: class extends Error {},
}))

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
    guided: false,
  })

  it('says whether the guided start is over', () => {
    expect(context.guided).toBe(false)
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

describe('LabiSession', () => {
  let now = 0
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  const context = { title: 'Hukum Newton' } as LabContext

  function recording(text: string) {
    return { finish: vi.fn(async () => text), cancel: vi.fn() }
  }

  function open() {
    const session = new LabiSession()
    session.describeWith(() => context)
    return session
  }

  beforeEach(() => {
    now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    mic.start.mockReset()
    turns.request.mockReset()
    turns.request.mockImplementation(async function* () {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('talk button', () => {
    it('sends the whole phrase once the button is let go', async () => {
      const heard = recording('Kenapa troli yang berat lebih lambat?')
      mic.start.mockImplementation(async (onPartial) => {
        onPartial('Kenapa troli')
        return heard
      })
      const session = open()
      session.holdMic()
      expect(session.getState().mic).toBe('opening')
      await tick()
      expect(session.getState()).toMatchObject({
        mic: 'listening',
        partial: 'Kenapa troli',
      })
      expect(turns.request).not.toHaveBeenCalled()

      now += 2000
      session.releaseMic()
      expect(session.getState().mic).toBe('sending')
      await tick()
      expect(heard.finish).toHaveBeenCalledOnce()
      expect(session.getState().mic).toBe('off')
      expect(session.getState().messages.at(-1)).toMatchObject({
        role: 'user',
        text: 'Kenapa troli yang berat lebih lambat?',
      })
      expect(turns.request).toHaveBeenCalledOnce()
    })

    it('ignores a press that is too short to be a question', async () => {
      const heard = recording('Hai')
      mic.start.mockResolvedValue(heard)
      const session = open()
      session.holdMic()
      await tick()
      now += 300
      session.releaseMic()
      await tick()
      expect(heard.finish).not.toHaveBeenCalled()
      expect(heard.cancel).toHaveBeenCalled()
      expect(session.getState()).toMatchObject({
        mic: 'off',
        notice: TOO_SHORT,
      })
      expect(turns.request).not.toHaveBeenCalled()
    })

    it('says the microphone is ready when it was let go while the browser asked', async () => {
      const heard = recording('Hai')
      let allow!: () => void
      mic.start.mockImplementation(
        () =>
          new Promise((resolve) => {
            allow = () => resolve(heard)
          }),
      )
      const session = open()
      session.holdMic()
      now += 800
      session.releaseMic()
      now += 3000
      allow()
      await tick()
      expect(heard.cancel).toHaveBeenCalled()
      expect(session.getState()).toMatchObject({
        mic: 'off',
        notice: MIC_READY,
      })
    })

    it('tells the student when nothing was heard', async () => {
      mic.start.mockResolvedValue(recording(''))
      const session = open()
      session.holdMic()
      await tick()
      now += 1500
      session.releaseMic()
      await tick()
      expect(session.getState().notice).toBe(NOT_HEARD)
      expect(turns.request).not.toHaveBeenCalled()
    })

    it('keeps typing possible when the microphone is refused', async () => {
      const refused = 'Izinkan akses mikrofon. Kamu tetap bisa mengetik.'
      mic.start.mockRejectedValue(new Error(refused))
      const session = open()
      session.holdMic()
      await tick()
      expect(session.getState()).toMatchObject({ mic: 'off', notice: refused })
      session.ask('Hai')
      expect(turns.request).toHaveBeenCalledOnce()
    })
  })

  describe('guided start', () => {
    const step = (text: string) => ({ text, target: 'cart' })

    it('shows each next step until the guidance ends', () => {
      const session = open()
      session.guide(step('Ambil troli.'))
      session.guide(step('Taruh troli di rel.'))
      expect(session.getState()).toMatchObject({
        bubble: 'Taruh troli di rel.',
        guiding: true,
      })

      session.endGuidance()
      expect(session.getState()).toMatchObject({ bubble: null, guiding: false })
      session.guide(step('Nyalakan kipas.'))
      expect(session.getState().bubble).toBeNull()
    })

    it('offers the next step as a suggestion when asked after the guidance', () => {
      const session = open()
      session.guide(step('Ambil troli.'))
      session.endGuidance()
      session.guide(step('Nyalakan kipas.'))
      session.nudge()
      expect(session.getState()).toMatchObject({
        bubble: 'Kalau mau, coba ini: Nyalakan kipas.',
        guiding: false,
      })
    })

    it('says why an action did not work', () => {
      const session = open()
      session.explain('Tabung masih kosong.')
      expect(session.getState()).toMatchObject({
        bubble: 'Tabung masih kosong.',
        mood: 'confused',
      })
    })
  })
})
