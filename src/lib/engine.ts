import type {
  Experiment,
  Explanation,
  ItemDef,
  ItemView,
  LabEvent,
  Result,
  Row,
  World,
  Zone,
} from '../data/types'

export const SHELF = 'shelf'

export type EngineState = {
  world: World
  rows: Row[]
  hint: string | null
  explanation: Explanation | null
  events: LabEvent[]
}

export type EngineAction =
  | { type: 'drop'; sourceId: string; targetId: string }
  | { type: 'use'; itemId: string }
  | { type: 'tick'; dt: number }
  | { type: 'removeRow'; index: number }
  | { type: 'reset' }

const NO_EVENTS: LabEvent[] = []
const GENERIC_REJECT = 'Alat ini tidak bisa dipakai di situ.'
const FIXED_REJECT = 'Benda ini tidak bisa dipindahkan.'

export function createInitialState(exp: Experiment): EngineState {
  const items: World['items'] = {}
  for (const item of exp.items) {
    items[item.id] = { at: item.start ?? SHELF, state: { ...item.state } }
  }
  return {
    world: { time: 0, items },
    rows: [],
    hint: null,
    explanation: null,
    events: [],
  }
}

export function getView(
  exp: Experiment,
  state: EngineState,
): Record<string, ItemView> {
  return exp.view(state.world)
}

export function runEngine(
  exp: Experiment,
  state: EngineState,
  action: EngineAction,
): EngineState {
  switch (action.type) {
    case 'reset':
      return createInitialState(exp)
    case 'removeRow':
      return { ...state, rows: state.rows.filter((_, i) => i !== action.index) }
    case 'drop':
      return dropItem(exp, state, action.sourceId, action.targetId)
    case 'use':
      return tapItem(exp, state, action.itemId)
    case 'tick':
      return tickWorld(exp, state, action.dt)
  }
}

function dropItem(
  exp: Experiment,
  state: EngineState,
  sourceId: string,
  targetId: string,
): EngineState {
  const source = exp.items.find((item) => item.id === sourceId)
  if (!source || !state.world.items[sourceId] || sourceId === targetId) {
    return applyResult(state, { reject: GENERIC_REJECT }, 'action')
  }
  if (source.fixed) {
    return applyResult(state, { reject: FIXED_REJECT }, 'action')
  }

  const interaction = findInteraction(exp, source, targetId)
  if (interaction) {
    const result = interaction.run(state.world, sourceId, targetId)
    return applyResult(state, result, 'action')
  }

  const zone = exp.zones.find((z) => z.id === targetId)
  if (zone) {
    return applyResult(state, moveToZone(state.world, source, zone), 'action')
  }

  if (targetId === SHELF) {
    const world = moveItem(state.world, sourceId, SHELF)
    return applyResult(state, { world }, 'action')
  }

  return applyResult(state, { reject: GENERIC_REJECT }, 'action')
}

function tapItem(
  exp: Experiment,
  state: EngineState,
  itemId: string,
): EngineState {
  const handler = exp.use?.[itemId]
  if (!handler || !state.world.items[itemId]) return withoutEvents(state)
  return applyResult(state, handler(state.world, itemId), 'action')
}

function tickWorld(
  exp: Experiment,
  state: EngineState,
  dt: number,
): EngineState {
  if (!(dt > 0)) return withoutEvents(state)
  const world: World = { ...state.world, time: state.world.time + dt }
  if (!exp.tick) return { ...state, world, events: NO_EVENTS }
  return applyResult({ ...state, world }, exp.tick(world, dt), 'tick')
}

/**
 * Picks the most specific interaction for a drop.
 * Priority: (id, id) → (id, kind) → (kind, id) → (kind, kind); within a tier
 * the first one in the array wins. Zones and the shelf have no kind, so they
 * only match by id.
 */
function findInteraction(exp: Experiment, source: ItemDef, targetId: string) {
  const targetKind = exp.items.find((item) => item.id === targetId)?.kind
  const tiers: [string, string | undefined][] = [
    [source.id, targetId],
    [source.id, targetKind],
    [source.kind, targetId],
    [source.kind, targetKind],
  ]
  for (const [s, t] of tiers) {
    if (t === undefined) continue
    const found = exp.interactions.find(
      (it) => it.source === s && it.target === t,
    )
    if (found) return found
  }
  return undefined
}

function moveToZone(world: World, item: ItemDef, zone: Zone): Result {
  if (!zone.accepts.includes(item.kind)) {
    return { reject: `${zone.name} tidak bisa menampung ${item.name}.` }
  }
  const occupied = Object.entries(world.items).filter(
    ([id, it]) => id !== item.id && it.at === zone.id,
  ).length
  if (zone.capacity !== undefined && occupied >= zone.capacity) {
    return { reject: `${zone.name} sudah penuh.` }
  }
  return { world: moveItem(world, item.id, zone.id) }
}

function moveItem(world: World, itemId: string, at: string): World {
  return {
    ...world,
    items: { ...world.items, [itemId]: { ...world.items[itemId], at } },
  }
}

function withoutEvents(state: EngineState): EngineState {
  return state.events.length === 0 ? state : { ...state, events: NO_EVENTS }
}

function applyResult(
  state: EngineState,
  result: Result,
  mode: 'action' | 'tick',
): EngineState {
  if ('reject' in result) {
    return { ...state, hint: result.reject, events: [{ type: 'rejected' }] }
  }

  const { world, record, explanation } = result
  const newRecord =
    record !== undefined && !state.rows.some((row) => sameRow(row, record))
      ? record
      : undefined
  const events = settleRecordEvents(
    result.events ?? [],
    newRecord !== undefined,
  )

  // A quiet tick (e.g. temperature creeping up) must not wipe what is on screen.
  if (mode === 'tick' && !events.length && !newRecord && !explanation) {
    return { ...state, world, events: NO_EVENTS }
  }
  if (mode === 'action' && !events.length) {
    events.push({ type: 'action-ok' })
  }

  return {
    world,
    rows: newRecord ? [...state.rows, newRecord] : state.rows,
    hint: null,
    explanation: explanation ?? state.explanation,
    events: events.length ? events : NO_EVENTS,
  }
}

/**
 * Ensures exactly one 'record-added' when a row was really added (keeping the
 * data's own event, e.g. one carrying a lineId), and none otherwise.
 */
function settleRecordEvents(events: LabEvent[], added: boolean): LabEvent[] {
  let seen = false
  const out = events.filter((e) => {
    if (e.type !== 'record-added') return true
    if (!added || seen) return false
    seen = true
    return true
  })
  if (added && !seen) out.push({ type: 'record-added' })
  return out
}

function sameRow(a: Row, b: Row): boolean {
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((k) => Object.hasOwn(b, k) && a[k] === b[k])
  )
}
