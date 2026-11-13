import { fail, guard, TIRED } from '../_lib/http.js'
import { env } from '../_lib/env.js'
import { ChatError } from '../_lib/llm.js'
import { parseTurnRequest } from '../_lib/request.js'
import { runTurn } from '../_lib/turn.js'

/** Largest request body read; a full context and history is far smaller. */
const MAX_BODY_BYTES = 32_000

/** Answers the student: streams Labi's reply as text and speech. */
export async function POST(request: Request): Promise<Response> {
  const refused = await guard(request, 'turn', {
    perMinute: 12,
    perDay: 200,
    totalPerDay: env.dailyTurns,
    totalPerMinute: env.globalRpm,
  })
  if (refused) return refused

  const body = await request.text()
  if (body.length > MAX_BODY_BYTES)
    return fail(413, 'Permintaan terlalu besar.')
  let turn
  try {
    turn = parseTurnRequest(JSON.parse(body))
  } catch {
    turn = null
  }
  if (!turn) return fail(400, 'Permintaan tidak valid.')

  let reply
  try {
    reply = await runTurn(turn)
  } catch (error) {
    // The browser then falls back to Labi's prepared lines.
    console.error('[labi] turn:', error)
    return error instanceof ChatError && error.status === 429
      ? fail(429, TIRED)
      : fail(503, 'Labi sedang tidak bisa menjawab.')
  }
  return new Response(reply, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
