import { useLayoutEffect, useState } from 'react'
import type { Size } from './camera'

/** A callback ref and the border-box size of the element it is attached to. */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })

  useLayoutEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const [box] = entry.borderBoxSize
      setSize({ w: box.inlineSize, h: box.blockSize })
    })
    observer.observe(node, { box: 'border-box' })
    return () => observer.disconnect()
  }, [node])

  return [setNode, size] as const
}
