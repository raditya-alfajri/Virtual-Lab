import { acidBaseTestLayout } from './acid-base-test/layout'
import { hookeLawLayout } from './hooke-law/layout'
import { newtonLawLayout } from './newton-law/layout'
import { reactionRateLayout } from './reaction-rate/layout'
import { simplePendulumLayout } from './simple-pendulum/layout'
import { solutionConcentrationLayout } from './solution-concentration/layout'
import type { SceneLayout } from './types'

export const layouts: Record<string, SceneLayout> = {
  'uji-asam-basa': acidBaseTestLayout,
  'konsentrasi-larutan': solutionConcentrationLayout,
  'laju-reaksi': reactionRateLayout,
  'hukum-newton': newtonLawLayout,
  'ayunan-sederhana': simplePendulumLayout,
  'hukum-hooke': hookeLawLayout,
}

export function getSceneLayout(id: string): SceneLayout | undefined {
  return Object.hasOwn(layouts, id) ? layouts[id] : undefined
}

export function getBackgroundUrl(id: string): string {
  return `/img/lab/${id}-bg.svg`
}
