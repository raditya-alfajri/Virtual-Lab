import type { KeyboardEvent } from 'react'

/** Runs `action` on Enter or Space, like a native button. */
export function onActivateKey(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    action()
  }
}
