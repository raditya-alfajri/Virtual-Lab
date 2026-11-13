import { describe, expect, it } from 'vitest'
import { buildMessages, readReplyTag, toSpeakable } from './prompt.js'
import type { LabContext, TurnEvent, TurnRequest } from './protocol.js'
import { rateLimit, type CounterStore } from './rate-limit.js'
import { parseTurnRequest } from './request.js'
import { SentenceChunker } from './sentence-chunker.js'
import { runTurn } from './turn.js'

const context: LabContext = {
  title: 'Hukum Newton',
  topic: 'Gerak & gaya',
  objectives: [],
  concepts: [],
  items: [{ id: 'cart', name: 'Troli', at: 'di titik start' }],
  columns: [],
  rows: [],
}

function countingStore(): CounterStore {
  const counts = new Map<string, number>()
  return async (key) => {
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts.get(key)!
  }
}

describe('rateLimit', () => {
  const rule = { key: 'ip:1', limit: 2, windowSeconds: 60 }

  it('lets requests through up to the limit, then says how long to wait', async () => {
    const store = countingStore()
    const now = 90_000 // 30 s into a one-minute window
    expect(await rateLimit([rule], store, now)).toBeNull()
    expect(await rateLimit([rule], store, now)).toBeNull()
    expect(await rateLimit([rule], store, now)).toBe(30)
  })

  it('starts counting again in the next window', async () => {
    const store = countingStore()
    for (let i = 0; i < 3; i++) await rateLimit([rule], store, 0)
    expect(await rateLimit([rule], store, 60_000)).toBeNull()
  })

  it('counts each key on its own', async () => {
    const store = countingStore()
    for (let i = 0; i < 3; i++) await rateLimit([rule], store, 0)
    const other = { ...rule, key: 'ip:2' }
    expect(await rateLimit([other], store, 0)).toBeNull()
  })

  it('refuses when any rule is over its limit', async () => {
    const store = countingStore()
    const all = { key: 'all', limit: 1, windowSeconds: 3600 }
    expect(await rateLimit([rule, all], store, 0)).toBeNull()
    expect(await rateLimit([rule, all], store, 0)).toBe(3600)
  })
})

describe('parseTurnRequest', () => {
  it('cuts every field to its limit', () => {
    const request = parseTurnRequest({
      turns: Array.from({ length: 40 }, () => ({
        role: 'user',
        text: 'a'.repeat(5000),
      })),
      context: {
        title: 'b'.repeat(5000),
        items: Array.from({ length: 500 }, (_, i) => ({
          id: `item-${i}`,
          name: 'Benda',
          at: 'di meja',
        })),
        rows: Array.from({ length: 500 }, () => ['1', '2']),
      },
    })!
    expect(request.turns).toHaveLength(12)
    expect(request.turns[0].text).toHaveLength(500)
    expect(request.context.title).toHaveLength(80)
    expect(request.context.items).toHaveLength(24)
    expect(request.context.rows).toHaveLength(12)
    expect(request.voice).toBe(true)
  })

  it('refuses a request with nothing to answer', () => {
    expect(parseTurnRequest(null)).toBeNull()
    expect(parseTurnRequest({ turns: [] })).toBeNull()
    expect(
      parseTurnRequest({ turns: [{ role: 'user', text: ' ' }] }),
    ).toBeNull()
    expect(
      parseTurnRequest({ turns: [{ role: 'assistant', text: 'Hai' }] }),
    ).toBeNull()
    expect(
      parseTurnRequest({ turns: [{ role: 'system', text: 'x' }] }),
    ).toBeNull()
  })
})

describe('buildMessages', () => {
  it('marks bench events and keeps the roles alternating', () => {
    const messages = buildMessages({
      voice: true,
      context,
      turns: [
        { role: 'user', text: 'Hai' },
        { role: 'assistant', text: 'Halo!' },
        { role: 'event', text: 'Data baru tercatat.' },
        { role: 'user', text: 'Kenapa begitu?' },
      ],
    })
    expect(messages.map((m) => m.role)).toEqual([
      'system',
      'user',
      'assistant',
      'user',
    ])
    expect(messages[0].content).toContain('cart: Troli, di titik start')
    expect(messages[3].content).toBe(
      '(Kejadian di lab) Data baru tercatat.\nKenapa begitu?',
    )
  })
})

describe('readReplyTag', () => {
  const ids = ['cart', 'sensor']

  it('waits until the tag is complete', () => {
    expect(readReplyTag('', ids)).toBeNull()
    expect(readReplyTag('[pena', ids)).toBeNull()
  })

  it('reads the mood and the item', () => {
    expect(readReplyTag('[penasaran:cart] Coba lihat', ids)).toEqual({
      mood: 'curious',
      target: 'cart',
      rest: 'Coba lihat',
    })
    expect(readReplyTag('[senang] Wah', ids)).toEqual({
      mood: 'happy',
      target: undefined,
      rest: 'Wah',
    })
  })

  it('ignores an unknown mood or item', () => {
    expect(readReplyTag('[girang:meja] Wah', ids)).toEqual({
      mood: 'neutral',
      target: undefined,
      rest: 'Wah',
    })
  })

  it('takes a reply without a tag as it is', () => {
    expect(readReplyTag('Halo!', ids)).toEqual({
      mood: 'neutral',
      rest: 'Halo!',
    })
  })
})

describe('toSpeakable', () => {
  it('drops tags, markdown and emoji', () => {
    expect(toSpeakable('**Wah** [kagum] keren 🎉  sekali')).toBe(
      'Wah keren sekali',
    )
  })
})

describe('SentenceChunker', () => {
  it('cuts sentences as they complete', () => {
    const chunker = new SentenceChunker()
    expect(chunker.push('Halo! Aku La')).toEqual(['Halo!'])
    expect(chunker.push('bi. Massanya 0,5 kg')).toEqual(['Aku Labi.'])
    expect(chunker.flush()).toEqual(['Massanya 0,5 kg'])
  })

  it('does not cut after an abbreviation', () => {
    const chunker = new SentenceChunker()
    expect(chunker.push('Ada gelas, labu, dll. di meja. ')).toEqual([
      'Ada gelas, labu, dll. di meja.',
    ])
  })
})

describe('runTurn', () => {
  const request: TurnRequest = {
    voice: true,
    context,
    turns: [{ role: 'user', text: 'Hai' }],
  }

  async function* chat(...deltas: string[]) {
    yield* deltas
  }

  async function events(stream: ReadableStream<Uint8Array>) {
    const text = await new Response(stream).text()
    return text
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as TurnEvent)
  }

  const pcm = (text: string) => Buffer.from(text).toString('base64')

  it('streams the mood, the sentences and their audio in order', async () => {
    const stream = runTurn(request, {
      chat: () => chat('[senang:', 'cart] Halo! ', 'Ayo mulai.'),
      // The first sentence's audio arrives after the second's.
      speak: async function* (text) {
        if (text === 'Halo!') await new Promise((r) => setTimeout(r, 20))
        yield new TextEncoder().encode(text)
      },
    })
    expect(await events(stream)).toEqual([
      { type: 'meta', mood: 'happy', target: 'cart' },
      { type: 'text', index: 0, text: 'Halo!' },
      { type: 'text', index: 1, text: 'Ayo mulai.' },
      { type: 'audio', index: 0, data: pcm('Halo!') },
      { type: 'audio-end', index: 0 },
      { type: 'audio', index: 1, data: pcm('Ayo mulai.') },
      { type: 'audio-end', index: 1 },
      { type: 'done' },
    ])
  })

  it('sends text only when the sound is off', async () => {
    const stream = runTurn(
      { ...request, voice: false },
      {
        chat: () => chat('Halo!'),
        speak: () => {
          throw new Error('must not be called')
        },
      },
    )
    expect(await events(stream)).toEqual([
      { type: 'meta', mood: 'neutral' },
      { type: 'text', index: 0, text: 'Halo!' },
      { type: 'audio-end', index: 0 },
      { type: 'done' },
    ])
  })

  it('keeps the text when the voice fails', async () => {
    const stream = runTurn(request, {
      chat: () => chat('Halo!'),
      // eslint-disable-next-line require-yield
      speak: async function* () {
        throw new Error('voice down')
      },
    })
    const types = (await events(stream)).map((e) => e.type)
    expect(types).toEqual(['meta', 'text', 'audio-end', 'done'])
  })

  it('reports an error when the model fails', async () => {
    const stream = runTurn(request, {
      // eslint-disable-next-line require-yield
      chat: async function* () {
        throw new Error('model down')
      },
      speak: () => chat() as never,
    })
    expect((await events(stream)).at(-1)?.type).toBe('error')
  })
})
