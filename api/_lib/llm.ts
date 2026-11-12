import { env } from './env.js'
import { readSseData } from './sse.js'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type Options = { maxTokens: number; signal: AbortSignal }

type ChatChunk = { choices?: { delta?: { content?: string | null } }[] }

/** One streaming request to the OpenAI-compatible Workers AI endpoint. */
async function* openStream(
  messages: ChatMessage[],
  { maxTokens, signal }: Options,
): AsyncGenerator<string> {
  const response = await fetch(`${env.cloudflareBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${env.cloudflareToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.chatModel,
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })
  if (!response.ok || !response.body) {
    throw new Error(`Workers AI ${response.status}: ${await response.text()}`)
  }
  for await (const data of readSseData(response.body)) {
    if (data === '[DONE]') return
    const delta = (JSON.parse(data) as ChatChunk).choices?.[0]?.delta?.content
    if (delta) yield delta
  }
}

/**
 * Streams the assistant's text. With a hedge above 1, identical requests race
 * and the first to produce text wins: more compute for a lower, steadier wait.
 */
export async function* streamChat(
  messages: ChatMessage[],
  options: Options,
): AsyncGenerator<string> {
  const hedge = env.chatHedge
  if (hedge <= 1) return yield* openStream(messages, options)

  const lanes = Array.from({ length: hedge }, () => {
    const abort = new AbortController()
    const signal = AbortSignal.any([options.signal, abort.signal])
    const stream = openStream(messages, { ...options, signal })
    return { abort, stream, first: stream.next() }
  })
  const winner = await Promise.any(
    lanes.map(async (lane) => ({ lane, first: await lane.first })),
  ).catch((error: AggregateError) => Promise.reject(error.errors[0]))
  for (const lane of lanes) {
    if (lane === winner.lane) continue
    lane.abort.abort()
    lane.first.catch(() => {})
  }

  if (winner.first.done) return
  yield winner.first.value
  yield* winner.lane.stream
}
