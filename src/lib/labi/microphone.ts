import { MIC_SAMPLE_RATE, type SttToken } from '../../../api/_lib/protocol'

type Events = {
  /** Interim text of what is being said; it may still change. */
  onPartial: (text: string) => void
  /** Final text of a phrase, sent when the speaker pauses. */
  onCommitted: (text: string) => void
  /** The microphone closed by itself; `message` says why, if it failed. */
  onClose: (message?: string) => void
}

export type Microphone = { close: () => void }

/** Samples sent per message: 100 ms. */
const CHUNK_SAMPLES = MIC_SAMPLE_RATE / 10
/** Hang up after this long without a word, so an open tab does not stream forever. */
const IDLE_MS = 90_000

// Runs on the audio thread: passes the microphone samples to the page.
const WORKLET = `registerProcessor('mic-tap', class extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0][0]
    if (channel) this.port.postMessage(channel.slice(0))
    return true
  }
})`

function toBase64Pcm(samples: Float32Array): string {
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  let binary = ''
  for (const byte of new Uint8Array(pcm.buffer)) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const DENIED = 'Izinkan akses mikrofon di browser untuk berbicara dengan Labi.'
const FAILED = 'Mikrofon sedang tidak bisa dipakai. Kamu tetap bisa mengetik.'

/**
 * Opens the microphone and streams it to the realtime transcriber. The page
 * gets a single-use token from our server and never sees the API key. Nothing
 * is recorded: the audio is only turned into text.
 */
export async function openMicrophone(events: Events): Promise<Microphone> {
  // Ask for the microphone first, so a refusal does not use up a token.
  const media = await navigator.mediaDevices
    .getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    .catch(() => {
      throw new Error(DENIED)
    })

  let socket: WebSocket | null = null
  let context: AudioContext | null = null
  let idle: ReturnType<typeof setTimeout> | undefined
  let closed = false

  const release = () => {
    closed = true
    clearTimeout(idle)
    media.getTracks().forEach((track) => track.stop())
    void context?.close()
    socket?.close()
  }
  const hangUp = (message?: string) => {
    if (closed) return
    release()
    events.onClose(message)
  }
  const heard = () => {
    clearTimeout(idle)
    idle = setTimeout(hangUp, IDLE_MS)
  }

  try {
    const response = await fetch('/api/labi/stt-token', { method: 'POST' })
    const body = (await response
      .json()
      .catch(() => ({}))) as Partial<SttToken> & {
      error?: string
    }
    if (!response.ok || !body.url) {
      throw new Error((response.status === 429 && body.error) || FAILED)
    }

    const ws = new WebSocket(body.url)
    socket = ws
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error(FAILED))
    })
    ws.onerror = () => hangUp(FAILED)
    ws.onclose = () => hangUp()
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(String(data)) as {
        message_type?: string
        text?: string
        error?: string
      }
      const text = message.text?.trim()
      if (message.message_type === 'partial_transcript' && text) {
        heard()
        events.onPartial(text)
      } else if (message.message_type === 'committed_transcript' && text) {
        heard()
        events.onCommitted(text)
      } else if (message.error) {
        hangUp(FAILED)
      }
    }

    context = new AudioContext({ sampleRate: MIC_SAMPLE_RATE })
    const worklet = URL.createObjectURL(
      new Blob([WORKLET], { type: 'application/javascript' }),
    )
    await context.audioWorklet.addModule(worklet)
    URL.revokeObjectURL(worklet)
    const tap = new AudioWorkletNode(context, 'mic-tap')
    let pending = new Float32Array(0)
    tap.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      const joined = new Float32Array(pending.length + data.length)
      joined.set(pending)
      joined.set(data, pending.length)
      pending = joined
      if (pending.length < CHUNK_SAMPLES || ws.readyState !== WebSocket.OPEN) {
        return
      }
      ws.send(
        JSON.stringify({
          message_type: 'input_audio_chunk',
          audio_base_64: toBase64Pcm(pending),
          commit: false,
          sample_rate: MIC_SAMPLE_RATE,
        }),
      )
      pending = new Float32Array(0)
    }
    context.createMediaStreamSource(media).connect(tap)
    heard()
  } catch (error) {
    release()
    throw error instanceof Error ? error : new Error(FAILED)
  }

  return { close: release }
}
