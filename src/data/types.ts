export type Value = number | string | boolean

export type ItemDef = {
  id: string
  kind: string
  name: string
  props?: Record<string, Value>
  start?: string
  state?: Record<string, Value>
  fixed?: boolean
}

export type Zone = {
  id: string
  name: string
  accepts: string[]
  capacity?: number
}

export type ItemState = { at: string; state: Record<string, Value> }

export type World = { time: number; items: Record<string, ItemState> }

export type Row = Record<string, Value>

export type Explanation = { result: string; reason: string; formula?: string }

export type Result =
  | { reject: string }
  | {
      world: World
      record?: Row
      explanation?: Explanation
      hint?: string
    }

export type Interaction = {
  source: string
  target: string
  run: (w: World, sourceId: string, targetId: string) => Result
}

export type ItemHandler = (w: World, id: string) => Result

export type Column = { key: string; label: string }

export type Concept = { title: string; content: string; formula?: string }

export type Experiment = {
  id: string
  title: string
  subject: 'kimia' | 'fisika'
  topic: string
  summary: string
  description: string
  previewImage: string
  objectives: string[]
  tips: string[]
  items: ItemDef[]
  zones: Zone[]
  interactions: Interaction[]
  use?: Record<string, ItemHandler>
  pull?: Record<string, (w: World, id: string, value: number) => Result>
  release?: Record<string, ItemHandler>
  guard?: (w: World, id: string, target: string) => string | null
  tick?: (w: World, dt: number) => Result
  isActive: (w: World) => boolean
  view: (w: World) => Record<string, Record<string, Value>>
  observationColumns: Column[]
  concepts: Concept[]
}
