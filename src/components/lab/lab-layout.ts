import { useSyncExternalStore } from 'react'

/**
 * How the lab page is laid out:
 * - `wide`: the room fills the screen; the title floats at its top left and
 *   the panel, closed until a tab is picked, at its right.
 * - `side`: a phone or small tablet held sideways; the same, only narrower.
 * - `stack`: a phone or tablet held upright; title bar, room, then the panel,
 *   together exactly as tall as the screen.
 */
export type LabLayout = 'wide' | 'side' | 'stack'

const WIDE = '(min-width: 1024px)'
const SIDE = '(orientation: landscape) and (min-width: 640px)'

/** Width the open panel takes from the room. */
export const PANEL_WIDTH: Record<LabLayout, number> = {
  wide: 420,
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

/**
 * A phone, held upright or sideways; a tablet is not one. On a phone the tool
 * tray only holds what is out of sight, and Labi waits small in a corner.
 */
const PHONE =
  '(orientation: portrait) and (max-width: 639px), (orientation: landscape) and (max-height: 499px)'

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  )
}
