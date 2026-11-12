import { env } from './env.js'
import { AUDIO_SAMPLE_RATE } from './protocol.js'

/** Streams `text` spoken in Labi's voice as 16-bit mono PCM. */
export async function* synthesize(
  text: string,
  signal: AbortSignal,
): AsyncGenerator<Uint8Array> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${env.voiceId}/stream?output_format=pcm_${AUDIO_SAMPLE_RATE}`,
    {
      method: 'POST',
      signal,
      headers: {
        'xi-api-key': env.elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: env.ttsModel,
        language_code: 'id',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          speed: 1.05,
        },
      }),
    },
  )
  if (!response.ok || !response.body) {
    throw new Error(
      `ElevenLabs TTS ${response.status}: ${await response.text()}`,
    )
  }
  // Chunks can end in the middle of a sample; only whole samples are passed on.
  let carry: Uint8Array | null = null
  for await (const chunk of response.body) {
    let bytes: Uint8Array = chunk
    if (carry) {
      bytes = new Uint8Array(chunk.length + 1)
      bytes[0] = carry[0]
      bytes.set(chunk, 1)
      carry = null
    }
    if (bytes.length % 2 === 1) {
      carry = bytes.subarray(bytes.length - 1)
      bytes = bytes.subarray(0, bytes.length - 1)
    }
    if (bytes.length > 0) yield bytes
  }
}
