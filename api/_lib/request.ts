import {
  LIMITS,
  type ChatTurn,
  type LabContext,
  type TurnRequest,
} from './protocol.js'

const text = (value: unknown, max: number = LIMITS.fieldChars) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const list = <T>(value: unknown, max: number, each: (entry: unknown) => T) =>
  Array.isArray(value) ? value.slice(0, max).map(each) : []

const strings = (value: unknown, max: number = LIMITS.listItems) =>
  list(value, max, (entry) => text(entry)).filter(Boolean)

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}

const ROLES: ChatTurn['role'][] = ['user', 'assistant', 'event']

function parseContext(value: unknown): LabContext {
  const raw = record(value)
  const prediction = record(raw.prediction)
  return {
    title: text(raw.title, 80),
    topic: text(raw.topic, 80),
    objectives: strings(raw.objectives, 6),
    concepts: strings(raw.concepts, 6),
    items: list(raw.items, LIMITS.listItems, (entry) => {
      const item = record(entry)
      return {
        id: text(item.id, 40),
        name: text(item.name, 60),
        at: text(item.at, 60),
        note: text(item.note, 80) || undefined,
      }
    }).filter((item) => item.id && item.name),
    columns: strings(raw.columns, 8),
    rows: list(raw.rows, LIMITS.rows, (row) =>
      list(row, 8, (cell) => text(cell, 40)),
    ),
    prediction: text(prediction.question)
      ? {
          question: text(prediction.question),
          answer: text(prediction.answer) || undefined,
        }
      : undefined,
    latest: text(raw.latest, 600) || undefined,
    next: text(raw.next, 200) || undefined,
    guided: raw.guided !== false,
  }
}

/**
 * Reads a turn request from untrusted JSON, cutting every field to its limit,
 * so a request can never cost more than a known number of tokens. Returns null
 * when there is nothing to answer.
 */
export function parseTurnRequest(body: unknown): TurnRequest | null {
  const raw = record(body)
  const turns = list(raw.turns, 100, (entry) => {
    const turn = record(entry)
    const role = ROLES.find((r) => r === turn.role)
    return role && { role, text: text(turn.text, LIMITS.turnChars) }
  })
    .filter((turn): turn is ChatTurn => Boolean(turn?.text))
    .slice(-LIMITS.turns)
  const last = turns.at(-1)
  if (!last || last.role === 'assistant') return null
  return {
    turns,
    context: parseContext(raw.context),
    voice: raw.voice !== false,
  }
}
