import type { Rect } from '../../simulations/types'
import { isInView, shownPart } from './camera'

/**
 * How the tools that wait in the tray are chosen. On a phone (`sight`) only
 * the ones wholly out of sight do, and never while they move; elsewhere
 * (`region`) the ones mostly outside the work area.
 */
export type TrayRule =
  | { kind: 'sight'; seen: Rect; moving: ReadonlySet<string> }
  | { kind: 'region'; region: Rect }

export function inTray(itemId: string, rect: Rect, rule: TrayRule): boolean {
  if (rule.kind === 'region') return !isInView(rect, rule.region)
  return !rule.moving.has(itemId) && shownPart(rect, rule.seen) === 0
}
