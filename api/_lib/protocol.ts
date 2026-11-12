/** What the browser and the Labi endpoints send each other. */

export const MOODS = [
  'neutral',
  'happy',
  'wow',
  'curious',
  'confused',
  'proud',
  'sad',
] as const
export type Mood = (typeof MOODS)[number]

export type ChatTurn = {
  /** `event`: something that happened on the bench, not something the student said. */
  role: 'user' | 'assistant' | 'event'
  text: string
}

/** The open experiment as Labi sees it. No names, accounts or other personal data. */
export type LabContext = {
  title: string
  topic: string
  objectives: string[]
  concepts: string[]
  /** `at`: where the item is, in words. `note`: what it shows, e.g. a reading. */
  items: { id: string; name: string; at: string; note?: string }[]
  columns: string[]
  rows: string[][]
  prediction?: { question: string; answer?: string }
  /** The latest result explanation or tip shown to the student. */
  latest?: string
}

export type TurnRequest = {
  /** The last entry is the one to answer. */
  turns: ChatTurn[]
  context: LabContext
  /** False when the sound is off: the reply comes as text only. */
  voice: boolean
}

/** One line of the streamed reply (newline-delimited JSON). */
export type TurnEvent =
  /** How Labi feels and which item it flies to. */
  | { type: 'meta'; mood: Mood; target?: string }
  /** Sentence `index` of the reply. */
  | { type: 'text'; index: number; text: string }
  /** A piece of sentence `index` as base64 16-bit mono PCM at `AUDIO_SAMPLE_RATE`. */
  | { type: 'audio'; index: number; data: string }
  /** Sentence `index` has no more audio (or none at all, if the voice failed). */
  | { type: 'audio-end'; index: number }
  | { type: 'done' }
  | { type: 'error'; message: string }

export const AUDIO_SAMPLE_RATE = 24_000
export const MIC_SAMPLE_RATE = 16_000

export type SttToken = {
  /** Single-use token for one realtime transcription socket. */
  token: string
  /** The socket to open with it. */
  url: string
}

export const LIMITS = {
  turns: 12,
  turnChars: 500,
  listItems: 24,
  rows: 12,
  fieldChars: 400,
} as const
