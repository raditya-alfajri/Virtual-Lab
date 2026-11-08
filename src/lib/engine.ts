import type {
  Experiment,
  Explanation,
  ItemView,
  LabEvent,
  Row,
  World,
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

export function createInitialState(exp: Experiment): EngineState {
  const items: World['items'] = {}
  for (const item of exp.items) {
    items[item.id] = { at: item.start ?? SHELF, state: {} }
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
  _exp: Experiment,
  state: EngineState,
  _sourceId: string,
  _targetId: string,
): EngineState {
  return { ...state, events: [] }
}

function tapItem(
  _exp: Experiment,
  state: EngineState,
  _itemId: string,
): EngineState {
  return { ...state, events: [] }
}

function tickWorld(
  _exp: Experiment,
  state: EngineState,
  _dt: number,
): EngineState {
  return { ...state, events: [] }
}
