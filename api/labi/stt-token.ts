import { env } from '../_lib/env.js'
import { fail, guard, json } from '../_lib/http.js'
import { MIC_SAMPLE_RATE, type SttToken } from '../_lib/protocol.js'

/** Silence (seconds) that ends the student's turn. */
const SILENCE_SECS = '0.7'

/**
 * Hands the browser a single-use token to stream the microphone straight to
 * the transcriber. The API key itself never leaves the server, and the token
 * opens one socket only.
 */
export async function POST(request: Request): Promise<Response> {
  const refused = await guard(request, 'stt', {
    perMinute: 4,
    perDay: 40,
    totalPerDay: Math.ceil(env.dailyTurns / 4),
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
    commit_strategy: 'vad',
    vad_silence_threshold_secs: SILENCE_SECS,
    token,
  })
  const body: SttToken = {
    token,
    url: `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`,
  }
  return json(body)
}
