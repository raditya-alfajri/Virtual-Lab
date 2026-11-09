import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'

/** Largest uniform scale that shows the whole stage, centred horizontally. */
export function fitStage(width: number, height: number) {
  const scale = Math.max(
    0,
    Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
  )
  return { scale, left: (width - STAGE_WIDTH * scale) / 2 }
}
