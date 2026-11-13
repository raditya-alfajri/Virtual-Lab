import { fail, guard } from '../_lib/http.js'
import { env } from '../_lib/env.js'
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

  return new Response(runTurn(turn), {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
