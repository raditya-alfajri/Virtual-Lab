import type {
  Experiment,
  Explanation,
  ItemDef,
  Result,
  Row,
  World,
} from '../data/types'
import { SHELF } from '../data/instruments'

export type Hint = { text: string; target: string | null }

export type EngineState = {
  world: World
  rows: Row[]
  hint: Hint | null
  explanation: Explanation | null
}

export type EngineAction =
  | { type: 'drop'; id: string; target: string }
  | { type: 'use'; id: string }
  | { type: 'pull'; id: string; value: number }
  | { type: 'release'; id: string }
  | { type: 'tick'; dt: number }
  | { type: 'removeRow'; index: number }
  | { type: 'reset' }

export const MAX_DT = 1

export function createWorld(exp: Experiment): World {
  const items = Object.fromEntries(
    exp.items.map((i) => [
      i.id,
      { at: i.start ?? SHELF, state: { ...i.state } },
    ]),
  )
  return { time: 0, items }
}

export function createInitialState(exp: Experiment): EngineState {
  return { world: createWorld(exp), rows: [], hint: null, explanation: null }
}

function findItem(exp: Experiment, id: string): ItemDef | undefined {
  return exp.items.find((i) => i.id === id)
}

function attachedTo(world: World, id: string): string[] {
  const direct = Object.keys(world.items).filter(
    (other) => world.items[other].at === id,
  )
  return direct.flatMap((child) => [child, ...attachedTo(world, child)])
}

function returnToShelf(exp: Experiment, world: World, id: string): World {
  const fresh = createWorld(exp).items
  const items = { ...world.items }
  for (const other of [id, ...attachedTo(world, id)]) {
    items[other] = { at: SHELF, state: fresh[other].state }
  }
  return { ...world, items }
}

const sameRow = (a: Row, b: Row) => JSON.stringify(a) === JSON.stringify(b)

function apply(
  state: EngineState,
  result: Result,
  target: string | null,
  fromTick = false,
): EngineState {
  if ('reject' in result) {
    return { ...state, hint: { text: result.reject, target } }
  }
  const { record } = result
  const rows =
    record && !state.rows.some((r) => sameRow(r, record))
      ? [...state.rows, record]
      : state.rows
  const hint = result.hint
    ? { text: result.hint, target }
    : fromTick
      ? state.hint
      : null
  return {
    world: result.world,
    rows,
    hint,
    explanation: result.explanation ?? state.explanation,
  }
}

function drop(exp: Experiment, state: EngineState, id: string, target: string) {
  const { world } = state
  const item = findItem(exp, id)
  if (!item || item.fixed || target === id || world.items[id].at === target) {
    return state
  }
  const targetItem = findItem(exp, target)
  const zone = exp.zones.find((z) => z.id === target)
  if (!targetItem && !zone && target !== SHELF) return state
  if (targetItem && attachedTo(world, id).includes(target)) return state

  const blocked = exp.guard?.(world, id, target)
  if (blocked) return apply(state, { reject: blocked }, target)

  const interaction = exp.interactions.find(
    (i) =>
      i.source === item.kind &&
      (i.target === target || i.target === targetItem?.kind),
  )
  if (interaction) {
    return apply(state, interaction.run(world, id, target), target)
  }

  if (target === SHELF) {
    return apply(state, { world: returnToShelf(exp, world, id) }, target)
  }

  if (zone) {
    if (!zone.accepts.includes(item.kind)) {
      return apply(
        state,
        { reject: `${item.name} tidak bisa ditaruh di ${zone.name}.` },
        target,
      )
    }
    const inside = Object.values(world.items).filter((i) => i.at === zone.id)
    if (zone.capacity !== undefined && inside.length >= zone.capacity) {
      return apply(
        state,
        { reject: `${zone.name} sudah penuh. Pindahkan dulu isinya.` },
        target,
      )
    }
    const moved = { ...world.items[id], at: zone.id }
    return apply(
      state,
      { world: { ...world, items: { ...world.items, [id]: moved } } },
      target,
    )
  }

  return apply(
    state,
    { reject: `${item.name} tidak bisa dipakai pada ${targetItem?.name}.` },
    target,
  )
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
      return drop(exp, state, action.id, action.target)

    case 'use':
    case 'release': {
      const item = findItem(exp, action.id)
      const handler = item && exp[action.type]?.[item.kind]
      if (!handler) return state
      return apply(state, handler(state.world, action.id), action.id)
    }

    case 'pull': {
      const item = findItem(exp, action.id)
      const handler = item && exp.pull?.[item.kind]
      if (!handler) return state
      return apply(
        state,
        handler(state.world, action.id, action.value),
        action.id,
      )
    }

    case 'tick': {
      const dt = Math.min(Math.max(action.dt, 0), MAX_DT)
      if (!exp.tick || dt === 0 || !exp.isActive(state.world)) return state
      const world = { ...state.world, time: state.world.time + dt }
      return apply(state, exp.tick(world, dt), null, true)
    }
  }
}
