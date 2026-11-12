import { useLayoutEffect, useState } from 'react'
import type { Size } from './camera'

/** A callback ref and the content size of the element it is attached to. */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })

  useLayoutEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [setNode, size] as const
}
