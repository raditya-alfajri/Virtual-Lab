import { STAGE_WIDTH, type Rect, type Side } from '../../../simulations/types'

/** Space between an item and a button beside it, in stage units (Tailwind ml-3/mr-3). */
const SIDE_GAP = 12

/**
 * Moves a button beside an item to the other side when it would run off the
 * stage, as happens once a phone draws it at screen size. `width` is the
 * button's width in stage units; buttons above or below keep their side.
 */
export function fitActionSide(
  side: Side,
  rect: Rect,
  width: number,
  stageWidth: number = STAGE_WIDTH,
): Side {
  if (side === 'right' && rect.x + rect.w + SIDE_GAP + width > stageWidth) {
    return rect.x - SIDE_GAP - width >= 0 ? 'left' : side
  }
  if (side === 'left' && rect.x - SIDE_GAP - width < 0) {
    return rect.x + rect.w + SIDE_GAP + width <= stageWidth ? 'right' : side
  }
  return side
}
