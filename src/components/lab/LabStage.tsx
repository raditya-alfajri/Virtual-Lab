import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../simulations/types'

type Props = {
  background: string
  children?: ReactNode
}

export default function LabStage({ background, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / STAGE_WIDTH)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: STAGE_HEIGHT * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <img
          src={background}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full select-none"
        />
        {children}
      </div>
    </div>
  )
}
