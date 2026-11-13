import { MIC_SAMPLE_RATE, type SttToken } from '../../../api/_lib/protocol'

export type Recording = {
  /**
   * Listens a moment longer so the last word is not cut off, then closes the
   * phrase and resolves with its text ('' when nothing was heard).
   */
  finish: () => Promise<string>
  /** Stops listening and drops what was heard. */
  cancel: () => void
}

/** Samples sent per message: 100 ms. */
const CHUNK_SAMPLES = MIC_SAMPLE_RATE / 10
/** Listening goes on this long after the button is let go. */
const TAIL_MS = 300
/** The longest wait for the final text once the phrase is closed. */
const FINAL_TEXT_MS = 4000

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

const DENIED =
  'Izinkan akses mikrofon di browser untuk berbicara dengan Labi. Kamu tetap bisa mengetik.'
const MISSING = 'Mikrofon tidak ditemukan. Kamu tetap bisa mengetik.'
const FAILED = 'Mikrofon sedang tidak bisa dipakai. Kamu tetap bisa mengetik.'

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/** A socket to the realtime transcriber, opened with a single-use token from our server. */
async function connect(): Promise<WebSocket> {
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
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = () => reject(new Error(FAILED))
  })
  return ws
}

/**
 * Listens while the talk button is held. The microphone streams to the
 * realtime transcriber, which only closes the phrase when `finish` is called,
 * however long the student pauses. Sound heard before the socket is open waits
 * and is sent once it is. Resolves as soon as the microphone is listening.
 * Nothing is recorded: the audio is only turned into text.
 */
export async function startRecording(
  onPartial: (text: string) => void,
): Promise<Recording> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error(MISSING)
  const media = await navigator.mediaDevices
    .getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    .catch((error: unknown) => {
      const missing =
        error instanceof DOMException && error.name === 'NotFoundError'
      throw new Error(missing ? MISSING : DENIED)
    })

  let closed = false
  let capturing = true
  let context: AudioContext | null = null
  let socket: WebSocket | null = null
  let pending = new Float32Array(0)
  let heard = ''
  let broken = false
  let onFinal: ((text: string) => void) | null = null

  const release = () => {
    if (closed) return
    closed = true
    capturing = false
    media.getTracks().forEach((track) => track.stop())
    void context?.close()
    socket?.close()
  }

  const send = (samples: Float32Array, commit: boolean) =>
    socket?.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: toBase64Pcm(samples),
        commit,
        sample_rate: MIC_SAMPLE_RATE,
      }),
    )
  const flush = () => {
    if (socket?.readyState !== WebSocket.OPEN) return
    while (pending.length >= CHUNK_SAMPLES) {
      send(pending.slice(0, CHUNK_SAMPLES), false)
      pending = pending.slice(CHUNK_SAMPLES)
    }
  }

  const connecting = connect().then((ws) => {
    if (closed) {
      ws.close()
      return ws
    }
    socket = ws
    const lost = () => {
      if (closed) return
      broken = true
      onFinal?.(heard)
    }
    ws.onerror = lost
    ws.onclose = lost
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(String(data)) as {
        message_type?: string
        text?: string
        error?: string
      }
      const text = message.text?.trim() ?? ''
      if (message.message_type === 'partial_transcript') {
        if (text) {
          heard = text
          onPartial(text)
        }
      } else if (message.message_type === 'committed_transcript') {
        onFinal?.(text || heard)
      } else if (message.error) {
        broken = true
        onFinal?.(heard)
      }
    }
    flush()
    return ws
  })
  connecting.catch(() => {})

  try {
    context = new AudioContext({ sampleRate: MIC_SAMPLE_RATE })
    const worklet = URL.createObjectURL(
      new Blob([WORKLET], { type: 'application/javascript' }),
    )
    await context.audioWorklet.addModule(worklet)
    URL.revokeObjectURL(worklet)
    await context.resume()
    const tap = new AudioWorkletNode(context, 'mic-tap')
    tap.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      if (!capturing) return
      const joined = new Float32Array(pending.length + data.length)
      joined.set(pending)
      joined.set(data, pending.length)
      pending = joined
      flush()
    }
    context.createMediaStreamSource(media).connect(tap)
  } catch {
    release()
    throw new Error(FAILED)
  }

  return {
    cancel: release,
    async finish() {
      await sleep(TAIL_MS)
      capturing = false
      try {
        await connecting
      } catch (error) {
        release()
        throw error
      }
      if (closed) return ''
      const final = broken
        ? Promise.resolve(heard)
        : new Promise<string>((resolve) => {
            onFinal = resolve
            setTimeout(() => resolve(heard), FINAL_TEXT_MS)
            flush()
            // The phrase is closed with what is left, or a moment of silence.
            send(pending.length > 0 ? pending : new Float32Array(160), true)
            pending = new Float32Array(0)
          })
      const text = await final
      release()
      if (broken && !text) throw new Error(FAILED)
      return text
    },
  }
}
