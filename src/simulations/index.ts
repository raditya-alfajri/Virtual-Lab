import type { SceneLayout } from './types'
import { acidBaseLayout } from './acid-base-test/layout'
import { reactionRateLayout } from './reaction-rate/layout'
import { solutionConcentrationLayout } from './solution-concentration/layout'

// Eksperimen yang sudah punya tampilan lab, dikunci dengan id eksperimen.
const LAYOUTS: Record<string, SceneLayout> = {
  'uji-asam-basa': acidBaseLayout,
  'konsentrasi-larutan': solutionConcentrationLayout,
  'laju-reaksi': reactionRateLayout,
}

export function getSceneLayout(experimentId: string): SceneLayout | undefined {
  return LAYOUTS[experimentId]
}
