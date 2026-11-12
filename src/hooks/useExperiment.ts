import { useEffect, useMemo, useReducer, useState } from 'react'
import type { Experiment } from '../data/types'
import {
  createInitialState,
  getView,
  runEngine,
  type EngineAction,
  type EngineState,
} from '../lib/engine'

export type Speed = 1 | 5

// Longest real time a single frame may count for, so a hidden tab or a slow
// frame does not make a process jump ahead.
const MAX_FRAME_DT = 0.1

export function useExperiment(exp: Experiment) {
  const [state, dispatch] = useReducer(
    (s: EngineState, a: EngineAction) => runEngine(exp, s, a),
    exp,
    createInitialState,
  )
  const [speed, setSpeed] = useState<Speed>(1)
  const view = useMemo(() => getView(exp, state), [exp, state])
  const hasTick = exp.tick !== undefined

  useEffect(() => {
    if (!hasTick) return
    let frame = 0
    let last: number | null = null
    const loop = (now: number) => {
      if (last !== null) {
        const raw = Math.min((now - last) / 1000, MAX_FRAME_DT)
        dispatch({ type: 'tick', dt: raw * speed })
      }
      last = now
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [hasTick, speed])

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
    tap: (itemId: string) => dispatch({ type: 'use', itemId }),
    pull: (itemId: string, value: number) =>
      dispatch({ type: 'pull', itemId, value }),
    release: (itemId: string) => dispatch({ type: 'release', itemId }),
    removeRow: (index: number) => dispatch({ type: 'removeRow', index }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
