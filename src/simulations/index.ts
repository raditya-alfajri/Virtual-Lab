import { acidBaseTestLayout } from './acid-base-test/layout'
import type { SceneLayout } from './types'

const LAYOUTS: Record<string, SceneLayout> = {
  'uji-asam-basa': acidBaseTestLayout,
}

export function getSceneLayout(id: string): SceneLayout | undefined {
  return Object.hasOwn(LAYOUTS, id) ? LAYOUTS[id] : undefined
}

export function getBackgroundUrl(id: string): string {
  return `/img/lab/${id}-bg.svg`
}
