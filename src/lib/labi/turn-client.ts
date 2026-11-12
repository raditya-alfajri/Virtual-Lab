import type { TurnEvent, TurnRequest } from '../../../api/_lib/protocol'

/** The reply could not be fetched; `message` can be shown to the student. */
export class TurnError extends Error {}

const STALL_MS = 20_000
const UNAVAILABLE = 'Aku lagi tidak bisa menjawab. Coba lagi sebentar, ya.'

/** Asks Labi for a reply and yields its events as they stream in. */
export async function* requestTurn(
  request: TurnRequest,
  signal: AbortSignal,
): AsyncGenerator<TurnEvent> {
  // Give up when nothing has arrived for a while, so Labi never hangs.
  const stalled = new AbortController()
  let watchdog: ReturnType<typeof setTimeout> | undefined
  const alive = () => {
    clearTimeout(watchdog)
    watchdog = setTimeout(() => stalled.abort(), STALL_MS)
  }
  try {
    alive()
    yield* readTurn(request, AbortSignal.any([signal, stalled.signal]), alive)
  } catch (error) {
    if (stalled.signal.aborted && !signal.aborted)
      throw new TurnError(UNAVAILABLE)
    throw error
  } finally {
    clearTimeout(watchdog)
  }
}

async function* readTurn(
  request: TurnRequest,
  signal: AbortSignal,
  alive: () => void,
): AsyncGenerator<TurnEvent> {
  let response: Response
  try {
    response = await fetch('/api/labi/turn', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new TurnError(UNAVAILABLE)
  }
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new TurnError((response.status === 429 && body?.error) || UNAVAILABLE)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    alive()
    buffer += value
    let newline: number
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline)
      buffer = buffer.slice(newline + 1)
      if (!line) continue
      const event = JSON.parse(line) as TurnEvent
      if (event.type === 'error') throw new TurnError(UNAVAILABLE)
      yield event
    }
  }
}
