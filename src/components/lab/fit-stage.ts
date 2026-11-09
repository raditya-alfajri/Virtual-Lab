import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'

/** Largest uniform scale that shows the whole stage, centred in the box. */
export function fitStage(width: number, height: number) {
  const scale = Math.max(
    0,
    Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT),
  )
  return {
    scale,
    left: (width - STAGE_WIDTH * scale) / 2,
    top: (height - STAGE_HEIGHT * scale) / 2,
  }
}
