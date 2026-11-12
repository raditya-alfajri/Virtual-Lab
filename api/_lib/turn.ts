import { streamChat } from './llm.js'
import { buildMessages, readReplyTag, toSpeakable } from './prompt.js'
import type { TurnEvent, TurnRequest } from './protocol.js'
import { SentenceChunker } from './sentence-chunker.js'
import { synthesize } from './tts.js'

const MAX_RESPONSE_TOKENS = 160
/** Characters of one reply that are spoken; a longer reply continues as text only. */
const MAX_SPOKEN_CHARS = 500
/** Sentences voiced at the same time. */
const VOICE_LANES = 2

export type TurnDeps = {
  chat: typeof streamChat
  speak: typeof synthesize
}

/**
 * One reply of Labi: the model's text is cut into sentences as it streams in,
 * each sentence goes to the voice right away, and text and audio are written
 * to the returned stream as newline-delimited `TurnEvent`s, audio in sentence
 * order. Cancelling the stream stops the model and the voice.
 */
export function runTurn(
  request: TurnRequest,
  deps: TurnDeps = { chat: streamChat, speak: synthesize },
): ReadableStream<Uint8Array> {
  const abort = new AbortController()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const send = (event: TurnEvent) => {
        if (abort.signal.aborted) return
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      // Audio of sentence n is sent only after all audio of sentence n - 1.
      const sentences: { audio: string[]; done: boolean }[] = []
      let cursor = 0
      const flushAudio = () => {
        for (; cursor < sentences.length; cursor++) {
          const sentence = sentences[cursor]
          for (const data of sentence.audio.splice(0)) {
            send({ type: 'audio', index: cursor, data })
          }
          if (!sentence.done) return
          send({ type: 'audio-end', index: cursor })
        }
      }

      let lanes = VOICE_LANES
      const waiting: (() => void)[] = []
      const voices: Promise<void>[] = []
      const voice = async (index: number, text: string) => {
        if (lanes === 0) await new Promise<void>((free) => waiting.push(free))
        else lanes--
        try {
          for await (const pcm of deps.speak(text, abort.signal)) {
            sentences[index].audio.push(Buffer.from(pcm).toString('base64'))
            flushAudio()
          }
        } catch (error) {
          // The sentence is still shown; it just stays silent.
          if (!abort.signal.aborted) console.error('[labi] voice:', error)
        } finally {
          sentences[index].done = true
          flushAudio()
          const next = waiting.shift()
          if (next) next()
          else lanes++
        }
      }

      let spokenChars = 0
      const say = (chunk: string) => {
        const text = toSpeakable(chunk)
        if (!text) return
        const index = sentences.length
        spokenChars += text.length
        const voiced = request.voice && spokenChars <= MAX_SPOKEN_CHARS
        sentences.push({ audio: [], done: !voiced })
        send({ type: 'text', index, text })
        if (voiced) voices.push(voice(index, text))
        else flushAudio()
      }

      try {
        const chunker = new SentenceChunker()
        const itemIds = request.context.items.map((item) => item.id)
        let head: string | null = ''
        const stream = deps.chat(buildMessages(request), {
          maxTokens: MAX_RESPONSE_TOKENS,
          signal: abort.signal,
        })
        for await (const delta of stream) {
          let text = delta
          if (head !== null) {
            // The reply opens with a mood tag; hold the text until it is read.
            head += delta
            const tag = readReplyTag(head, itemIds)
            if (!tag) continue
            send({ type: 'meta', mood: tag.mood, target: tag.target })
            head = null
            text = tag.rest
          }
          chunker.push(text).forEach(say)
        }
        if (head) say(head)
        chunker.flush().forEach(say)
        await Promise.all(voices)
        if (sentences.length === 0) throw new Error('empty reply')
        send({ type: 'done' })
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error('[labi] turn:', error)
          send({ type: 'error', message: 'Labi sedang tidak bisa menjawab.' })
        }
      }
      if (!abort.signal.aborted) controller.close()
    },
    cancel() {
      abort.abort()
    },
  })
}
