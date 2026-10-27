import type { Experiment, Input } from '../data/types'

export type Row = { input: Input; values: Record<string, number | string> }

export type EngineState = {
  activeStep: number
  input: Input
  rows: Row[]
  hint: string | null
  resultExplanation: string | null
  completed: boolean
}

export type EngineAction =
  | { type: 'action'; action: string; input: Input }
  | { type: 'removeRow'; index: number }
  | { type: 'reset' }

export const initialState: EngineState = {
  activeStep: 0,
  input: {},
  rows: [],
  hint: null,
  resultExplanation: null,
  completed: false,
}

export function runEngine(
  exp: Experiment,
  state: EngineState,
  event: EngineAction,
): EngineState {
  switch (event.type) {
    case 'reset':
      return initialState
    case 'removeRow':
      return { ...state, rows: state.rows.filter((_, i) => i !== event.index) }
    case 'action': {
      const step = exp.steps[state.activeStep]
      if (!step) return state

      if (event.action !== step.correctAction) {
        return { ...state, hint: `Belum tepat. Coba: ${step.instruction}` }
      }

      const input = { ...state.input, ...event.input }
      let rows = state.rows
      let resultExplanation = state.resultExplanation
      let completed = state.completed
      let activeStep = state.activeStep + 1

      if (step.compute) {
        const result = exp.rule(input)
        rows = [...rows, { input, values: result.values }]
        resultExplanation = result.explanation
        completed = true
        const repeatIndex = exp.steps.findIndex((s) => s.id === step.repeatFrom)
        activeStep =
          repeatIndex >= 0 ? repeatIndex : Math.max(state.activeStep - 1, 0)
      }

      if (activeStep >= exp.steps.length) {
        activeStep = 0
        completed = true
      }

      return {
        ...state,
        activeStep,
        input,
        rows,
        resultExplanation,
        hint: null,
        completed,
      }
    }
  }
}
