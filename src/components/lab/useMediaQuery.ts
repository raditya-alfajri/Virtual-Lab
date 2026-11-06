import { useCallback, useSyncExternalStore } from 'react'

// Mode HP: layar sempit, atau HP dalam posisi lanskap (lebar bisa ≥ 768 px,
// tetapi pendek dan disentuh jari). Laptop, desktop, dan tablet tidak cocok.
export const PHONE_QUERY =
  '(max-width: 767px), (orientation: landscape) and (max-height: 500px) and (pointer: coarse)'

export const LANDSCAPE_QUERY = '(orientation: landscape)'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
