import type { SceneLayout } from './types'
import { acidBaseLayout } from './acid-base-test/layout'

// Eksperimen yang sudah punya tampilan lab, dikunci dengan id eksperimen.
const LAYOUTS: Record<string, SceneLayout> = {
  'uji-asam-basa': acidBaseLayout,
}

export function getSceneLayout(experimentId: string): SceneLayout | undefined {
  return LAYOUTS[experimentId]
}
