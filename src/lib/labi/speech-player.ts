import { AUDIO_SAMPLE_RATE } from '../../../api/_lib/protocol'

type Events = {
  /** Sentence `index` starts to be heard (or shown, when it has no audio). */
  onSentence: (index: number) => void
  /** Everything queued has been heard. */
  onEnd: () => void
}

/** Time a sentence without audio stays up before the next one, per character. */
const READ_SECONDS_PER_CHAR = 0.055
const MIN_READ_SECONDS = 1.2
/** Head start before the first sound, so the first chunks do not underrun. */
const LEAD_SECONDS = 0.06

const wallClock = () => performance.now() / 1000

let sharedContext: AudioContext | null = null
let sharedAnalyser: AnalyserNode | null = null

function output() {
  if (!sharedContext) {
    sharedContext = new AudioContext()
    sharedAnalyser = sharedContext.createAnalyser()
    sharedAnalyser.fftSize = 256
    sharedAnalyser.connect(sharedContext.destination)
  }
  return { context: sharedContext, analyser: sharedAnalyser! }
}

/**
 * Browsers only let a page make sound after the visitor has touched it.
 * Call this from a click or key handler.
 */
export function unlockAudio() {
  const { context } = output()
  if (context.state === 'suspended') void context.resume()
}

const canPlay = () => output().context.state === 'running'

/** How loud Labi is right now, 0 to 1. */
export function speechLevel(): number {
  if (!sharedAnalyser || sharedContext?.state !== 'running') return 0
  const samples = new Uint8Array(sharedAnalyser.fftSize)
  sharedAnalyser.getByteTimeDomainData(samples)
  let sum = 0
  for (const sample of samples) sum += ((sample - 128) / 128) ** 2
  return Math.min(1, Math.sqrt(sum / samples.length) * 4)
}

function decodePcm(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64)
  const samples = new Float32Array(binary.length >> 1)
  for (let i = 0; i < samples.length; i++) {
    const value = binary.charCodeAt(2 * i) | (binary.charCodeAt(2 * i + 1) << 8)
    samples[i] = (value >= 0x8000 ? value - 0x10000 : value) / 0x8000
  }
  return samples
}

/**
 * Plays one reply: the audio of each sentence back to back as it streams in.
 * A sentence without audio (sound off, voice failed, page not yet touched)
 * takes the time needed to read it instead, so the text keeps its pace.
 */
export class SpeechPlayer {
  readonly #events: Events
  readonly #sources = new Set<AudioBufferSourceNode>()
  readonly #timers = new Set<ReturnType<typeof setTimeout>>()
  /** Sentences that have announced their start. */
  readonly #started = new Set<number>()
  /** Wall-clock time at which everything queued so far has been heard. */
  #end = 0
  #stopped = false

  constructor(events: Events) {
    this.#events = events
  }

  /** Queues a piece of audio of sentence `index`. */
  play(index: number, base64: string) {
    if (this.#stopped || !canPlay()) return
    const { context, analyser } = output()
    const samples = decodePcm(base64)
    if (samples.length === 0) return
    const buffer = context.createBuffer(1, samples.length, AUDIO_SAMPLE_RATE)
    buffer.copyToChannel(samples, 0)
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(analyser)
    const at = this.#reserve(index, buffer.duration)
    source.start(context.currentTime + (at - wallClock()))
    this.#sources.add(source)
    source.onended = () => this.#sources.delete(source)
  }

  /** Sentence `index` is complete. If nothing of it was played, it is shown for a reading pause. */
  endSentence(index: number, text: string) {
    if (this.#stopped || this.#started.has(index)) return
    const pause = Math.max(
      MIN_READ_SECONDS,
      text.length * READ_SECONDS_PER_CHAR,
    )
    this.#reserve(index, pause)
  }

  /** No more sentences are coming: `onEnd` fires when the last one has been heard. */
  finish() {
    this.#at(Math.max(this.#end, wallClock()), () => this.#events.onEnd())
  }

  /** Falls silent at once; no more events fire. */
  stop() {
    this.#stopped = true
    for (const timer of this.#timers) clearTimeout(timer)
    this.#timers.clear()
    for (const source of this.#sources) {
      source.onended = null
      source.stop()
    }
    this.#sources.clear()
  }

  /** Takes the next `seconds` of the timeline for sentence `index`; returns their start. */
  #reserve(index: number, seconds: number): number {
    const start = Math.max(this.#end, wallClock() + LEAD_SECONDS)
    this.#end = start + seconds
    if (!this.#started.has(index)) {
      this.#started.add(index)
      this.#at(start, () => this.#events.onSentence(index))
    }
    return start
  }

  #at(time: number, run: () => void) {
    const timer = setTimeout(
      () => {
        this.#timers.delete(timer)
        if (!this.#stopped) run()
      },
      Math.max(0, (time - wallClock()) * 1000),
    )
    this.#timers.add(timer)
  }
}
