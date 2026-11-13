import { env } from './env.js'
import { readSseData } from './sse.js'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type Options = { maxTokens: number; signal: AbortSignal }

type ChatChunk = { choices?: { delta?: { content?: string | null } }[] }

/** Gemini refused or failed the request; `status` is its HTTP status. */
export class ChatError extends Error {
  readonly status: number

  constructor(status: number, detail: string) {
    super(`Gemini ${status}: ${detail}`)
    this.status = status
  }
}

/**
 * Streams the assistant's text from Gemini's OpenAI-compatible endpoint. One
 * request per reply, as the free tier counts its quota in requests.
 */
export async function* streamChat(
  messages: ChatMessage[],
  { maxTokens, signal }: Options,
): AsyncGenerator<string> {
  const effort = env.reasoningEffort
  const response = await fetch(`${env.geminiBaseUrl}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${env.geminiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.chatModel,
      messages,
      stream: true,
      max_tokens: maxTokens,
      ...(effort ? { reasoning_effort: effort } : {}),
    }),
  })
  if (!response.ok || !response.body) {
    throw new ChatError(response.status, await response.text())
  }
  for await (const data of readSseData(response.body)) {
    if (data === '[DONE]') return
    const delta = (JSON.parse(data) as ChatChunk).choices?.[0]?.delta?.content
    if (delta) yield delta
  }
}
