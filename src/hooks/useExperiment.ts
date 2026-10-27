import { useReducer } from 'react'
import type { Experiment, Input } from '../data/types'
import { runEngine, initialState, type EngineAction, type EngineState } from '../lib/machine'

export function useExperiment(exp: Experiment) {
  const [state, dispatch] = useReducer(
    (s: EngineState, e: EngineAction) => runEngine(exp, s, e),
    initialState
  )

  return {
    activeStep: state.activeStep,
    observationRows: state.rows,
    hint: state.hint,
    stepExplanation: exp.steps[state.activeStep]?.explanation ?? '',
    resultExplanation: state.resultExplanation,
    completed: state.completed,
    performAction: (action: string, input: Input = {}) => dispatch({ type: 'action', action, input }),
    removeRow: (index: number) => dispatch({ type: 'removeRow', index }),
    reset: () => dispatch({ type: 'reset' }),
  }
}