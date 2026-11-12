import { useCallback, useSyncExternalStore } from 'react'

const COMPACT_QUERY =
  '(max-width: 767px), (orientation: landscape) and (max-height: 500px) and (pointer: coarse)'

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

/** True on phones, upright or turned, where the lab uses its phone layout. */
export function useCompactLayout(): boolean {
  return useMediaQuery(COMPACT_QUERY)
}
