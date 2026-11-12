import { useSyncExternalStore } from 'react'

/**
 * How the lab page is laid out:
 * - `wide`: the room fills the screen, the cards float in a column on its right.
 * - `side`: a phone or small tablet held sideways; the same, with a narrow
 *   column holding the title and one tabbed panel.
 * - `stack`: a phone or tablet held upright; title bar, room, then the tabbed
 *   panel, together exactly as tall as the screen.
 */
export type LabLayout = 'wide' | 'side' | 'stack'

const WIDE = '(min-width: 1024px)'
const SIDE = '(orientation: landscape) and (min-width: 640px)'

/** Width of the column floating over the room. */
export const PANEL_WIDTH: Record<LabLayout, number> = {
  wide: 412,
  side: 320,
  stack: 0,
}

function subscribe(onChange: () => void) {
  const queries = [WIDE, SIDE].map((query) => window.matchMedia(query))
  for (const query of queries) query.addEventListener('change', onChange)
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange)
  }
}

function current(): LabLayout {
  if (window.matchMedia(WIDE).matches) return 'wide'
  return window.matchMedia(SIDE).matches ? 'side' : 'stack'
}

export function useLabLayout(): LabLayout {
  return useSyncExternalStore(subscribe, current, () => 'wide')
}
