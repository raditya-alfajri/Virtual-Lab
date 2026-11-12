export type Value = number | string | boolean
export type Subject = 'kimia' | 'fisika'

export type ItemDef = {
  id: string
  kind: string
  name: string
  fixed?: boolean
  start?: string
  state?: ItemState
}

export type Zone = {
  id: string
  name: string
  accepts: string[]
  capacity?: number
}

export type ItemState = Record<string, Value>
export type World = {
  time: number
  items: Record<string, { at: string; state: ItemState }>
}

export type LabEventType =
  | 'action-ok'
  | 'rejected'
  | 'color-changed'
  | 'stirring-started'
  | 'dissolved'
  | 'dilution'
  | 'heater-on'
  | 'reaction-started'
  | 'record-added'

export type LabEvent = {
  type: LabEventType
  itemId?: string
  lineId?: string
}

export type Row = Record<string, Value>
export type Column = { key: string; label: string }

export type Explanation = {
  result: string
  reason: string
  formula?: string
}

export type Outcome = {
  world: World
  events?: LabEvent[]
  record?: Row
  explanation?: Explanation
  /** Shown instead of `explanation` when `record` is already in the table. */
  duplicateNote?: Explanation
  /** A tip about the next step; it stays on screen until the next action. */
  hint?: string
}
export type Result = Outcome | { reject: string }

export type Interaction = {
  source: string
  target: string
  run: (world: World, sourceId: string, targetId: string) => Result
}

export type ItemView = {
  label?: string
  color?: string
  level?: number
  reading?: string
  active?: boolean
  [key: string]: Value | undefined
}

export type MascotLine = {
  id: string
  text: string
  audio?: string
}

export type Experiment = {
  id: string
  subject: Subject
  title: string
  topic: string
  summary: string
  description: string
  previewImage: string
  objectives: string[]
  tips: string[]

  items: ItemDef[]
  zones: Zone[]
  interactions: Interaction[]
  use?: Record<string, (world: World, itemId: string) => Result>
  /** Keyed by item id: the item is dragged by `value`, e.g. a bob pulled aside by that many degrees. */
  pull?: Record<string, (world: World, itemId: string, value: number) => Result>
  /** Keyed by item id: the pulled item is let go. */
  release?: Record<string, (world: World, itemId: string) => Result>
  /** A reason to refuse moving `sourceId` onto `targetId`, checked before any rule. */
  guard?: (world: World, sourceId: string, targetId: string) => string | null
  tick?: (world: World, dt: number) => Outcome
  view: (world: World) => Record<string, ItemView>

  columns: Column[]
  prediction: { question: string; options?: string[] }
  lines: MascotLine[]
  concepts: { title: string; content: string; formula?: string }[]
}
