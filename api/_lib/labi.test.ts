import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BUSY, guard, TIRED } from './http.js'
import { ChatError, streamChat } from './llm.js'
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
  guided: true,
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
    expect(await rateLimit([rule], store, now)).toEqual({ wait: 30, rule })
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

  it('refuses when any rule is over its limit, naming the longest wait', async () => {
    const store = countingStore()
    const all = { key: 'all', limit: 1, windowSeconds: 3600 }
    expect(await rateLimit([rule, all], store, 0)).toBeNull()
    expect(await rateLimit([rule, all], store, 0)).toEqual({
      wait: 3600,
      rule: all,
    })
  })
})

describe('guard', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const ask = (ip: string) =>
    new Request('http://localhost/api/labi/turn', {
      method: 'POST',
      headers: { 'x-real-ip': ip },
    })

  it('refuses everyone politely once the per-minute total is reached', async () => {
    const limits = {
      perMinute: 10,
      perDay: 10,
      totalPerDay: 10,
      totalPerMinute: 2,
    }
    expect(await guard(ask('1'), 'test-busy', limits)).toBeNull()
    expect(await guard(ask('2'), 'test-busy', limits)).toBeNull()
    const refused = await guard(ask('3'), 'test-busy', limits)
    expect(refused?.status).toBe(429)
    expect(await refused?.json()).toEqual({ error: BUSY })
  })

  it('says Labi needs a rest when one visitor asks too much', async () => {
    const limits = { perMinute: 1, perDay: 10, totalPerDay: 10 }
    expect(await guard(ask('1'), 'test-tired', limits)).toBeNull()
    const refused = await guard(ask('1'), 'test-tired', limits)
    expect(await refused?.json()).toEqual({ error: TIRED })
  })
})

describe('streamChat', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'test-model')
    vi.stubEnv('GEMINI_BASE_URL', '')
    vi.stubEnv('GEMINI_REASONING_EFFORT', '')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const sse = (...deltas: string[]) =>
    new Response(
      [
        ...deltas.map(
          (content) =>
            `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`,
        ),
        'data: [DONE]\n\n',
      ].join(''),
    )

  const options = () => ({
    maxTokens: 100,
    signal: new AbortController().signal,
  })

  async function collect(stream: AsyncGenerator<string>) {
    const parts: string[] = []
    for await (const part of stream) parts.push(part)
    return parts
  }

  it('sends one request to Gemini and streams its text', async () => {
    fetchMock.mockResolvedValue(sse('Halo', '!'))
    const parts = await collect(
      streamChat([{ role: 'user', content: 'Hai' }], options()),
    )
    expect(parts).toEqual(['Halo', '!'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    )
    expect(new Headers(init?.headers).get('Authorization')).toBe(
      'Bearer test-key',
    )
    const body = JSON.parse(init?.body as string)
    expect(body).toMatchObject({
      model: 'test-model',
      stream: true,
      max_tokens: 100,
    })
    expect(body).not.toHaveProperty('reasoning_effort')
    expect(body).not.toHaveProperty('temperature')
  })

  it('sends the reasoning effort only when it is set', async () => {
    vi.stubEnv('GEMINI_REASONING_EFFORT', 'minimal')
    vi.stubEnv('GEMINI_BASE_URL', 'https://example.test/openai/')
    fetchMock.mockResolvedValue(sse('Halo'))
    await collect(streamChat([{ role: 'user', content: 'Hai' }], options()))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.test/openai/chat/completions')
    expect(JSON.parse(init?.body as string).reasoning_effort).toBe('minimal')
  })

  it('reports the status Gemini refused with', async () => {
    fetchMock.mockResolvedValue(new Response('quota', { status: 429 }))
    const error = await collect(
      streamChat([{ role: 'user', content: 'Hai' }], options()),
    ).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ChatError)
    expect((error as ChatError).status).toBe(429)
    expect((error as ChatError).message).toBe('Gemini 429: quota')
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
    expect(request.context.guided).toBe(true)
  })

  it('reads when the guided start is over', () => {
    const request = parseTurnRequest({
      turns: [{ role: 'user', text: 'Hai' }],
      context: { title: 'Hukum Newton', guided: false },
    })!
    expect(request.context.guided).toBe(false)
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

  const system = (guided: boolean) =>
    buildMessages({
      voice: true,
      context: { ...context, guided, next: 'Seret troli ke rel.' },
      turns: [{ role: 'user', text: 'Hai' }],
    })[0].content

  it('leads the steps during the guided start', () => {
    const prompt = system(true)
    expect(prompt).toContain('Tahap praktikum: masa panduan.')
    expect(prompt).toContain(
      'Langkah berikutnya menurut panduan praktikum: Seret troli ke rel.',
    )
    expect(prompt).not.toContain('masa panduan selesai')
  })

  it('only suggests a step when asked once the guided start is over', () => {
    const prompt = system(false)
    expect(prompt).toContain('masa panduan selesai')
    expect(prompt).toContain('Jangan memberi instruksi langkah berikutnya')
    expect(prompt).toContain('hanya bila diminta: Seret troli ke rel.')
    expect(prompt).not.toContain('arahkan ke langkah ini')
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
    const stream = await runTurn(request, {
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
    const stream = await runTurn(
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
    const stream = await runTurn(request, {
      chat: () => chat('Halo!'),
      // eslint-disable-next-line require-yield
      speak: async function* () {
        throw new Error('voice down')
      },
    })
    const types = (await events(stream)).map((e) => e.type)
    expect(types).toEqual(['meta', 'text', 'audio-end', 'done'])
  })

  it('refuses before replying when the model fails at once', async () => {
    const refused = new ChatError(429, 'quota')
    const turn = runTurn(request, {
      // eslint-disable-next-line require-yield
      chat: async function* () {
        throw refused
      },
      speak: () => chat() as never,
    })
    await expect(turn).rejects.toBe(refused)
  })

  it('refuses before replying when the model says nothing', async () => {
    const turn = runTurn(request, {
      chat: () => chat(),
      speak: () => chat() as never,
    })
    await expect(turn).rejects.toThrow('empty reply')
  })

  it('reports an error when the model fails mid-reply', async () => {
    const stream = await runTurn(
      { ...request, voice: false },
      {
        chat: async function* () {
          yield 'Halo! '
          throw new Error('model down')
        },
        speak: () => chat() as never,
      },
    )
    const all = await events(stream)
    expect(all.map((e) => e.type)).toEqual([
      'meta',
      'text',
      'audio-end',
      'error',
    ])
  })
})
