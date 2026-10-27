import { useEffect, useMemo, useReducer } from 'react'
import type { Experiment } from '../data/types'
import {
  runEngine,
  createInitialState,
  type EngineAction,
  type EngineState,
} from '../lib/engine'

export function useExperiment(exp: Experiment, speed = 1) {
  const [state, dispatch] = useReducer(
    (s: EngineState, e: EngineAction) => runEngine(exp, s, e),
    exp,
    createInitialState,
  )
  const view = useMemo(() => exp.view(state.world), [exp, state.world])
  const active = exp.isActive(state.world)

  useEffect(() => {
    if (!active) return
    let last = performance.now()
    let frame = requestAnimationFrame(function loop(now) {
      dispatch({ type: 'tick', dt: ((now - last) / 1000) * speed })
      last = now
      frame = requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(frame)
  }, [active, speed])

  return {
    items: state.world.items,
    view,
    columns: exp.observationColumns,
    observationRows: state.rows,
    hint: state.hint,
    explanation: state.explanation,
    active,
    drop: (id: string, target: string) =>
      dispatch({ type: 'drop', id, target }),
    use: (id: string) => dispatch({ type: 'use', id }),
    pull: (id: string, value: number) => dispatch({ type: 'pull', id, value }),
    release: (id: string) => dispatch({ type: 'release', id }),
    removeRow: (index: number) => dispatch({ type: 'removeRow', index }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
