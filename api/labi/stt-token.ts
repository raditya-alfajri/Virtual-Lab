import { env } from '../_lib/env.js'
import { fail, guard, json } from '../_lib/http.js'
import { MIC_SAMPLE_RATE, type SttToken } from '../_lib/protocol.js'

/**
 * Hands the browser a single-use token to stream the microphone straight to
 * the transcriber. The API key itself never leaves the server, and the token
 * opens one socket only. The browser closes each phrase itself when the talk
 * button is let go, so every press uses one token: the limits follow Labi's.
 */
export async function POST(request: Request): Promise<Response> {
  const refused = await guard(request, 'stt', {
    perMinute: 12,
    perDay: 200,
    totalPerDay: env.dailyTurns,
  })
  if (refused) return refused

  const response = await fetch(
    'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',
    { method: 'POST', headers: { 'xi-api-key': env.elevenLabsKey } },
  )
  const { token } = (await response.json().catch(() => ({}))) as {
    token?: string
  }
  if (!response.ok || !token) {
    console.error('[labi] stt token:', response.status)
    return fail(502, 'Mikrofon sedang tidak bisa dipakai.')
  }

  const params = new URLSearchParams({
    model_id: env.sttModel,
    audio_format: `pcm_${MIC_SAMPLE_RATE}`,
    language_code: 'id',
    commit_strategy: 'manual',
    token,
  })
  const body: SttToken = {
    token,
    url: `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`,
  }
  return json(body)
}
