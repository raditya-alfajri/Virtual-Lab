import { useMemo, useReducer, useState } from 'react'
import type { Experiment } from '../data/types'
import {
  createInitialState,
  getView,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../lib/engine'

export type Speed = 1 | 5

export function useExperiment(exp: Experiment) {
  const [state, dispatch] = useReducer(
    (s: EngineState, a: EngineAction) => runEngine(exp, s, a),
    exp,
    createInitialState,
  )
  const [speed, setSpeed] = useState<Speed>(1)
  const view = useMemo(() => getView(exp, state), [exp, state])

  return {
    world: state.world,
    view,
    rows: state.rows,
    columns: exp.columns,
    hint: state.hint,
    explanation: state.explanation,
    events: state.events,
    speed,
    setSpeed,
    drop: (sourceId: string, targetId: string) =>
      dispatch({ type: 'drop', sourceId, targetId }),
    use: (itemId: string) => dispatch({ type: 'use', itemId }),
    removeRow: (index: number) => dispatch({ type: 'removeRow', index }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
